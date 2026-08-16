// app/api/subscriptions/confirm/route.ts
// Thin wrapper around the shared confirmSubscription() in lib/subscriptions.ts,
// which is also used by the QorePay webhook (/api/payment/webhook).
//
// Reference-driven when the success page provides one (it now does), falling
// back to the legacy "most recent pending subscription for the logged-in
// user" lookup so old clients / manual flows keep working.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";
import { confirmSubscription } from "@/lib/subscriptions";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Rate-limit: 10 confirmations per hour per user — prevents Brute-forcing
    // the QorePay verify loop for different pending references.
    const rl = rateLimit(`subconfirm:${user.id}`, { limit: 10, windowMs: 3_600_000 });
    if (!rl.ok) return tooManyRequests(rl.retryAfterMs, "Too many confirmation attempts. Please wait a while.");

    let body: { reference?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Body-less legacy call — fall through to the fallback path below.
    }

    const reference = body.reference?.trim();

    if (reference) {
      // Reference-driven (current success page). expectedUserId keeps a user
      // from confirming another user's pending purchase by guessing the
      // reference — rows are still created under the pending row's owner.
      const result = await confirmSubscription(reference, {
        expectedUserId: user.id,
      });
      if (result.ok) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json(
        { error: result.error || "Failed to confirm subscription" },
        { status: result.status ?? 500 }
      );
    }

    // ── Legacy fallback: most recent pending subscription for this user ────
    const pending = await prisma.pendingSubscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (!pending) {
      return NextResponse.json(
        { error: "No pending subscription found" },
        { status: 404 }
      );
    }

    const result = await confirmSubscription(pending.reference, {
      expectedUserId: user.id,
    });
    if (result.ok) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json(
      { error: result.error || "Failed to confirm subscription" },
      { status: result.status ?? 500 }
    );
  } catch (error) {
    console.error("[POST /api/subscriptions/confirm]", error);
    return NextResponse.json(
      { error: "Failed to confirm subscription" },
      { status: 500 }
    );
  }
}