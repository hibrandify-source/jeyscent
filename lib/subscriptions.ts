// lib/subscriptions.ts
// Shared subscription confirmation for the two writers of Subscription rows:
//   1. POST /api/subscriptions/confirm   (customer browser, after QorePay redirect)
//   2. POST /api/payment/webhook         (QorePay server-to-server notification)
//
// Both re-verify the payment with QorePay before confirming, so subscriptions
// can never be granted for an unpaid reference. Idempotency: a reference that
// already produced Subscription rows (paymentRef column) is a no-op, which
// closes the race where the webhook and the browser confirm the same purchase
// at the same instant — the second confirmer returns before touching
// quantities.
import { prisma } from "./prisma";

export interface ConfirmSubscriptionResult {
  ok: boolean;
  error?: string;
  /** HTTP-ish status for the caller (404 = no pending record, 400 = unverified, …). */
  status?: number;
  /** True when the reference had already produced Subscription rows. */
  alreadyConfirmed?: boolean;
}

interface PendingItem {
  productId: string;
  productName?: string;
  size?: string;
  quantity?: number;
  unitPrice?: number;
  price?: number;
}

export async function confirmSubscription(
  reference: string,
  opts?: { expectedUserId?: string }
): Promise<ConfirmSubscriptionResult> {
  const pending = await prisma.pendingSubscription.findUnique({
    where: { reference },
  });
  if (!pending) {
    return { ok: false, error: "No pending subscription found", status: 404 };
  }

  if (opts?.expectedUserId && pending.userId !== opts.expectedUserId) {
    return { ok: false, error: "No pending subscription found", status: 404 };
  }

  // Already confirmed (race / webhook+browser / stale retry)? Idempotent no-op.
  const already = await prisma.subscription.findFirst({
    where: { paymentRef: reference },
    select: { id: true },
  });
  if (already) {
    // The pending row may still exist if the winning writer crashed before
    // deleting it — clean up so the user can't be double-charged on retry.
    await prisma.pendingSubscription
      .deleteMany({ where: { id: pending.id } })
      .catch((err) =>
        console.error("[subscription-confirm] Pending cleanup failed:", err)
      );
    console.log(
      "[subscription-confirm] Reference",
      reference,
      "already confirmed — skipping"
    );
    return { ok: true, alreadyConfirmed: true };
  }

  // ── Verify payment with QorePay before confirming ─────────────────────────
  try {
    const verifyRes = await fetch(
      `https://api.qorepay.com/v1/purchases/${reference}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${process.env.QOREPAY_SECRET_KEY}` },
      }
    );
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok || verifyData.data?.status !== "SUCCESS") {
      return {
        ok: false,
        status: 400,
        error: `Payment not verified. Status: ${verifyData.data?.status || "unknown"}`,
      };
    }
  } catch (verifyErr) {
    console.error("[subscription-confirm] Payment verification failed:", verifyErr);
    return {
      ok: false,
      status: 500,
      error: "Could not verify payment. Please contact support.",
    };
  }

  const items: PendingItem[] = Array.isArray(pending.items)
    ? (pending.items as unknown as PendingItem[])
    : [];
  if (items.length === 0) {
    console.error(
      "[subscription-confirm] No items in pending subscription",
      pending.id
    );
    return { ok: false, status: 400, error: "No items found in pending subscription" };
  }

  const nextDelivery = new Date();
  nextDelivery.setMonth(nextDelivery.getMonth() + (pending.frequencyMonths || 2));

  for (const item of items) {
    const unitPrice = item.unitPrice ?? item.price ?? 0;
    const size = item.size ?? "";

    const existing = await prisma.subscription.findFirst({
      where: { userId: pending.userId, productId: item.productId, size, status: "active" },
    });

    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          quantity: (existing.quantity || 1) + (item.quantity || 1),
          price: unitPrice,
          nextDelivery,
          paymentRef: reference,
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId: pending.userId,
          productId: item.productId,
          productName: item.productName || "",
          size,
          quantity: item.quantity || 1,
          frequency: pending.frequency || "bimonthly",
          price: unitPrice,
          status: "active",
          nextDelivery,
          paymentRef: reference,
        },
      });
    }
  }

  await prisma.pendingSubscription.delete({ where: { id: pending.id } });
  console.log(
    "[subscription-confirm] Confirmed",
    reference,
    "for user",
    pending.userId
  );

  return { ok: true };
}