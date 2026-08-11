import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUser, getUserByEmail } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { sendClassAccessEmail } from "@/lib/email";
import crypto from "crypto";

// ── POST /api/classes/confirm ────────────────────────────────────────────────
// Server-side confirmation of a class enrollment after QorePay redirect.
// Re-verifies the payment with QorePay (like /api/subscriptions/confirm), so
// we never trust the client. On success:
//   1. Generates a unique 12-char access pin.
//   2. Atomically creates the ClassEnrollment and increments earlyBirdUsed
//      (only if this was an early-bird payment).
//   3. Deletes the PendingEnrollment row.
//   4. If no JeyScent account exists for the buyer's email, auto-creates one
//      with a generated password (so the buyer can sign in to watch later
//      and we have a stable identity for repeat purchases).
//   5. Emails the access pin (+ account credentials for new accounts) to the buyer.
function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: NextRequest) {
  try {
    let body: { reference?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const reference = body.reference?.trim();
    if (!reference) {
      return NextResponse.json(
        { error: "Payment reference is required" },
        { status: 400 }
      );
    }

    const pending = await prisma.pendingEnrollment.findUnique({
      where: { reference },
      include: {
        class: {
          include: {
            episodes: { select: { id: true }, orderBy: { episodeNumber: "asc" } },
          },
        },
      },
    });
    if (!pending) {
      return NextResponse.json(
        { error: "No pending enrollment found for this reference" },
        { status: 404 }
      );
    }

    // Already confirmed (race / refresh)? Idempotent: tell client all good.
    const alreadyEnrolled = await prisma.classEnrollment.findFirst({
      where: { paymentRef: reference },
      select: { id: true, accessPin: true },
    });
    if (alreadyEnrolled) {
      return NextResponse.json({ success: true, confirmed: alreadyEnrolled.accessPin });
    }

    // ── Verify payment with QorePay before confirming ───────────────────────
    let qorepayStatus: string | undefined;
    try {
      const verifyRes = await fetch(
        `https://api.qorepay.com/v1/purchases/${reference}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${process.env.QOREPAY_SECRET_KEY}` },
        }
      );
      const verifyData = await verifyRes.json();
      qorepayStatus = verifyData.data?.status as string | undefined;

      console.log(
        "[classes/confirm] QorePay verify response:",
        JSON.stringify(verifyData, null, 2)
      );

      if (!verifyRes.ok || verifyData.data?.status !== "SUCCESS") {
        return NextResponse.json(
          { error: `Payment not verified. Status: ${qorepayStatus || "unknown"}` },
          { status: 400 }
        );
      }
    } catch (verifyErr) {
      console.error("[classes/confirm] Payment verification failed:", verifyErr);
      return NextResponse.json(
        { error: "Could not verify payment. Please contact support." },
        { status: 500 }
      );
    }

    // ── Generate a unique 12-char hex access pin ───────────────────────────
    let accessPin = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = crypto.randomBytes(6).toString("hex"); // 12 hex chars
      const collision = await prisma.classEnrollment.findUnique({
        where: { accessPin: candidate },
        select: { id: true },
      });
      if (!collision) {
        accessPin = candidate;
        break;
      }
    }
    if (!accessPin) {
      console.error("[classes/confirm] Could not generate a unique pin after 5 attempts");
      return NextResponse.json(
        { error: "Could not generate access pin. Please contact support." },
        { status: 500 }
      );
    }

    // ── Atomic create + early-bird increment + delete pending ─────────────
    // We bump earlyBirdUsed only when the pending row was marked early-bird
    // AND the class is still within its early-bird quota. This guards against
    // two students racing for the last slot — the increment is conditional.
    // paymentRef has a UNIQUE constraint (partial index, NULLs allowed), so if
    // two concurrent confirmations of the same reference race past the
    // idempotency check above, the loser's CREATE throws P2002 — we catch it
    // and treat the race as a successful idempotent confirmation.
    const isEarly = pending.isEarlyBird;
    const shouldBumpEarly = isEarly && pending.class.earlyBirdUsed < pending.class.earlyBirdMax;

    let enrollment;
    try {
      enrollment = await prisma.$transaction(async (tx) => {
        const created = await tx.classEnrollment.create({
          data: {
            classId: pending.classId,
            name: pending.name,
            email: pending.email,
            phone: pending.phone,
            accessPin,
            amountPaid: pending.amount,
            isEarlyBird: shouldBumpEarly,
            paymentRef: reference,
            status: "active",
          },
        });

        if (shouldBumpEarly) {
          await tx.class.update({
            where: { id: pending.classId },
            data: { earlyBirdUsed: { increment: 1 } },
          });
        }

        await tx.pendingEnrollment.delete({ where: { id: pending.id } });
        return created;
      });
    } catch (txErr: unknown) {
      const code =
        (txErr as { code?: string })?.code ||
        (txErr as { meta?: { code?: string } })?.meta?.code;
      if (code === "P2002") {
        // Concurrent confirmation won the race — fetch the winning enrollment
        // and treat this request as an idempotent success.
        console.log("[classes/confirm] Concurrent confirm race for reference", reference, "— returning existing enrollment");
        const winner = await prisma.classEnrollment.findUnique({
          where: { paymentRef: reference },
          select: { id: true, accessPin: true, email: true },
        });
        if (winner) {
          return NextResponse.json({
            success: true,
            confirmed: winner.accessPin,
            email: winner.email,
            className: pending.class.title,
          });
        }
        // P2002 on something other than paymentRef (e.g. accessPin collision)
        // fall through to the generic 500.
      }
      console.error("[classes/confirm] Transaction failed:", txErr);
      return NextResponse.json(
        { error: "Failed to confirm enrollment. Please contact support." },
        { status: 500 }
      );
    }

    // ── Auto-create JeyScent account if none exists for this email ────────
    // Every student who pays gets a proper user account automatically. The
    // account creation is best-effort: if a User row already exists (e.g.
    // they previously placed a product order, or signed up manually), we
    // skip it. If two enrollments race on the same email, prisma.user's
    // unique email constraint will throw P2002 — we catch and skip.
    let accountPassword: string | undefined;
    try {
      const existing = await getUserByEmail(enrollment.email);
      if (!existing) {
        const temp = generatePassword();
        const hashed = await hashPassword(temp);
        await createUser(enrollment.name, enrollment.email, hashed);
        accountPassword = temp;
        console.log("[classes/confirm] Auto-created account for:", enrollment.email);
      } else {
        console.log("[classes/confirm] Existing account found for:", enrollment.email, "(role:", existing.role + ")");
      }
    } catch (err: unknown) {
      // P2002 = unique-constraint violation (concurrent create on same email).
      // Treat as "account exists" and proceed without sending credentials.
      const code =
        (err as { code?: string })?.code || (err as { meta?: { code?: string } })?.meta?.code;
      if (code === "P2002") {
        console.log("[classes/confirm] Account already exists for:", enrollment.email, "(race-safe)");
      } else {
        console.error("[classes/confirm] Auto-account creation failed (non-fatal):", err);
      }
    }

    // ── Send access pin by email ────────────────────────────────────────────
    try {
      const kind = (pending.class.kind as "video" | "pdf") || "video";
      await sendClassAccessEmail({
        name: enrollment.name,
        email: enrollment.email,
        className: pending.class.title,
        pin: enrollment.accessPin,
        kind,
        episodeCount: kind === "video" ? pending.class.episodes.length : undefined,
        singleEpisode: kind === "video" ? pending.class.singleEpisode : undefined,
        hasPdf: kind === "video" ? !!pending.class.pdfUrl : undefined,
        accountPassword,
      });
    } catch (emailErr) {
      console.error("[classes/confirm] Access-pin email failed (non-fatal):", emailErr);
    }

    console.log("[classes/confirm] Enrollment confirmed:", enrollment.id, "early:", shouldBumpEarly);

    return NextResponse.json({
      success: true,
      confirmed: enrollment.accessPin,
      email: enrollment.email,
      className: pending.class.title,
    });
  } catch (error) {
    console.error("[POST /api/classes/confirm]", error);
    return NextResponse.json(
      { error: "Failed to confirm enrollment" },
      { status: 500 }
    );
  }
}
