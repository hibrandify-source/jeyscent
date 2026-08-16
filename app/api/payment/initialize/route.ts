import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rateLimit";
import {
  validatePayloadStructure,
  validatePayloadAgainstCatalog,
} from "@/lib/orders";

export async function POST(request: NextRequest) {
  // Rate-limit by IP — 10 initializations per minute. Each call hits
  // QorePay's API (which counts against the merchant quota); throttling
  // per-IP stops attackers from suffocating the gateway.
  const ip = clientIp(request);
  const rl = rateLimit(`pay:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterMs, "Too many checkout attempts. Please slow down.");

  try {
    const { amount, email, name, metadata, checkoutData } = await request.json();

    // ── Input validation ─────────────────────────────────────────────────────
    if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "A valid email is required" },
        { status: 400 }
      );
    }

    const isSubscription = !!metadata?.subscriptionData;

    // ── Validate the checkout snapshot BEFORE the customer pays ─────────────
    // Regular (non-subscription) checkouts send the full checkout payload.
    // Structure + live catalog prices are validated here so a bad price can
    // never be charged; after payment, order creation trusts this snapshot
    // instead of re-checking the catalog (a verified payment must never be
    // rejected because a price changed mid-checkout).
    if (!isSubscription && checkoutData) {
      const struct = validatePayloadStructure(checkoutData);
      if (!struct.ok) {
        return NextResponse.json({ error: struct.error }, { status: 400 });
      }
      const catalog = validatePayloadAgainstCatalog(checkoutData);
      if (!catalog.ok) {
        return NextResponse.json({ error: catalog.error }, { status: 400 });
      }
      if (Math.round(amount * 100) !== Math.round(checkoutData.grandTotal * 100)) {
        return NextResponse.json(
          { error: "Total mismatch — please refresh the page and try again" },
          { status: 400 }
        );
      }
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const qorepayRes = await fetch("https://api.qorepay.com/v1/purchases", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.QOREPAY_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency: "NGN",
        brand_id: process.env.QOREPAY_BRAND_ID,
        customer_email: email,
        description: `JeyScent Order — ${name || email}`,
        metadata,
        // ✅ Both flows go to the same success page
        redirect_url: `${baseUrl}/checkout/success`,
        failure_url: `${baseUrl}/checkout?payment=failed`,
      }),
    });

    const qorepayData = await qorepayRes.json();

    if (!qorepayData.data?.checkout_url) {
      return NextResponse.json(
        { error: qorepayData.message || "Failed to initialize payment" },
        { status: 400 }
      );
    }

    const reference = qorepayData.data.reference;

    // ── Save pending order snapshot to DB ──────────────────────────────────
    // Regular checkouts: persist the full checkout payload keyed by the
    // QorePay reference. This is what lets /api/checkout, the QorePay webhook
    // and admin reconciliation create the order server-side even if the
    // customer's browser dies at the gateway. Failure here is non-fatal: the
    // success page falls back to the client-supplied payload.
    if (!isSubscription && checkoutData && reference) {
      try {
        await prisma.pendingOrder.upsert({
          where: { reference },
          create: { reference, payload: checkoutData },
          update: { payload: checkoutData },
        });
      } catch (pendingErr) {
        console.error(
          "[payment/initialize] Failed to persist PendingOrder (non-fatal):",
          pendingErr
        );
      }
    }

    // ── Save pending subscription to DB ───────────────────────────────────
    if (isSubscription && reference) {
      const user = await getCurrentUser();

      if (user) {
        const sub = metadata.subscriptionData;

        if (Array.isArray(sub.items) && sub.items.length > 0) {
          await prisma.pendingSubscription.create({
            data: {
              userId:         user.id,
              reference,
              items:          sub.items,
              frequency:      sub.frequency || "bimonthly",
              frequencyMonths: sub.frequencyMonths || 2,
              totalPrice:     sub.totalPrice || 0,
            },
          });
        } else {
          // Legacy single-item fallback
          await prisma.pendingSubscription.create({
            data: {
              userId:         user.id,
              reference,
              items: [
                {
                  productId:   sub.productId || "",
                  productName: sub.productName || "",
                  size:        sub.size || "",
                  quantity:    sub.quantity || 1,
                  unitPrice:   sub.unitPrice ?? sub.price ?? 0,
                },
              ],
              frequency:      sub.frequency || "bimonthly",
              frequencyMonths: sub.frequencyMonths || 2,
              totalPrice:     sub.price || 0,
            },
          });
        }
      }
    }

    return NextResponse.json({
      authorization_url: qorepayData.data.checkout_url,
      reference,
    });
  } catch (error) {
    console.error("Payment initialization error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}