// lib/classes.ts
// Shared class-enrollment confirmation for the two writers of
// ClassEnrollment rows:
//   1. POST /api/classes/confirm        (customer browser, after QorePay redirect)
//   2. POST /api/payment/webhook        (QorePay server-to-server notification)
//
// Both re-verify the payment with QorePay before confirming, so an
// enrollment can never be granted for an unpaid reference. The unique
// paymentRef constraint on ClassEnrollment makes concurrent confirmations
// of the same reference resolve to a single enrollment (and a single
// early-bird slot).
import { prisma } from "./prisma";
import { sendClassAccessEmail } from "./email";
import crypto from "crypto";

export interface ConfirmClassResult {
  ok: boolean;
  error?: string;
  /** HTTP-ish status for the caller (404 = no pending record, 400 = unverified, …). */
  status?: number;
  enrollmentId?: string;
  accessPin?: string;
  email?: string;
  className?: string;
  /** True when a concurrent confirm already created the enrollment. */
  alreadyConfirmed?: boolean;
}

export async function confirmClassEnrollment(
  reference: string
): Promise<ConfirmClassResult> {
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
    return { ok: false, error: "No pending enrollment found for this reference", status: 404 };
  }

  // Already confirmed (race / webhook+browser)? Idempotent — return the pin.
  const alreadyEnrolled = await prisma.classEnrollment.findFirst({
    where: { paymentRef: reference },
    select: { id: true, accessPin: true, email: true },
  });
  if (alreadyEnrolled) {
    return {
      ok: true,
      enrollmentId: alreadyEnrolled.id,
      accessPin: alreadyEnrolled.accessPin,
      email: alreadyEnrolled.email,
      alreadyConfirmed: true,
    };
  }

  // ── Verify payment with QorePay before confirming ─────────────────────────
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

    if (!verifyRes.ok || verifyData.data?.status !== "SUCCESS") {
      return {
        ok: false,
        status: 400,
        error: `Payment not verified. Status: ${qorepayStatus || "unknown"}`,
      };
    }
  } catch (verifyErr) {
    console.error("[class-confirm] Payment verification failed:", verifyErr);
    return {
      ok: false,
      status: 500,
      error: "Could not verify payment. Please contact support.",
    };
  }

  // ── Generate a unique 12-char hex access pin ──────────────────────────────
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
    console.error("[class-confirm] Could not generate a unique pin after 5 attempts");
    return {
      ok: false,
      status: 500,
      error: "Could not generate access pin. Please contact support.",
    };
  }

  // ── Atomic create + early-bird increment + delete pending ─────────────────
  // earlyBirdUsed is bumped only when the pending row was marked early-bird
  // AND the class is still within its early-bird quota — guards against two
  // students racing for the last slot. paymentRef is UNIQUE (partial index),
  // so a concurrent confirmation of the same reference that races past the
  // idempotency check above throws P2002 — caught and treated as a success.
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
      // Concurrent confirm won the race — return the winning enrollment.
      console.log(
        "[class-confirm] Concurrent confirm race for reference",
        reference,
        "— returning existing enrollment"
      );
      const winner = await prisma.classEnrollment.findUnique({
        where: { paymentRef: reference },
        select: { id: true, accessPin: true, email: true },
      });
      if (winner) {
        return {
          ok: true,
          enrollmentId: winner.id,
          accessPin: winner.accessPin,
          email: winner.email,
          className: pending.class.title,
          alreadyConfirmed: true,
        };
      }
      // P2002 on something other than paymentRef (e.g. accessPin collision)
      // falls through to the generic error below.
    }
    console.error("[class-confirm] Transaction failed:", txErr);
    return {
      ok: false,
      status: 500,
      error: "Failed to confirm enrollment. Please contact support.",
    };
  }

  // ── Send access pin by email ──────────────────────────────────────────────
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
    });
  } catch (emailErr) {
    console.error("[class-confirm] Access-pin email failed (non-fatal):", emailErr);
  }

  console.log(
    "[class-confirm] Enrollment confirmed:",
    enrollment.id,
    "early:",
    shouldBumpEarly
  );

  return {
    ok: true,
    enrollmentId: enrollment.id,
    accessPin: enrollment.accessPin,
    email: enrollment.email,
    className: pending.class.title,
  };
}