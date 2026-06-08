// app/api/payment/initialize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { amount, email, name, metadata } = await request.json();

    if (!amount || !email) {
      return NextResponse.json(
        { error: "Amount and email are required" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const isSubscription = !!metadata?.subscriptionData;

    // ── Initialize QorePay payment ─────────────────────────────────────────
    const qorepayRes = await fetch("https://api.qorepay.com/v1/purchases", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.QOREPAY_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount:         Math.round(amount * 100),
        currency:       "NGN",
        brand_id:       process.env.QOREPAY_BRAND_ID,
        customer_email: email,
        description:    `JeyScent Order — ${name || email}`,
        metadata,
        redirect_url:   `${baseUrl}/checkout/success`,
        failure_url:    `${baseUrl}/checkout?payment=failed`,
      }),
    });

    const qorepayData = await qorepayRes.json();

    console.log("QorePay initialize response:", JSON.stringify(qorepayData, null, 2));

    if (!qorepayData.data?.checkout_url) {
      return NextResponse.json(
        { error: qorepayData.message || "Failed to initialize payment" },
        { status: 400 }
      );
    }

    const reference = qorepayData.data.reference;

    // ── Save pending subscription to DB (non-blocking) ────────────────────
    if (isSubscription && reference) {
      try {
        const user = await getCurrentUser();
        if (user) {
          const sub = metadata.subscriptionData;

          // Multi-item basket shape
          if (Array.isArray(sub.items) && sub.items.length > 0) {
            await prisma.pendingSubscription.create({
              data: {
                userId:         user.id,
                reference,
                items:          sub.items,
                frequency:      sub.frequency      || "quarterly",
                frequencyMonths: sub.frequencyMonths || 3,
                totalPrice:     sub.totalPrice      || 0,
              },
            });
          } else {
            // Legacy single-item shape
            await prisma.pendingSubscription.create({
              data: {
                userId:         user.id,
                reference,
                items: [
                  {
                    productId:   sub.productId   || "",
                    productName: sub.productName || "",
                    size:        sub.size        || "",
                    quantity:    sub.quantity    || 1,
                    unitPrice:   sub.unitPrice ?? sub.price ?? 0,
                  },
                ],
                frequency:      sub.frequency      || "quarterly",
                frequencyMonths: sub.frequencyMonths || 3,
                totalPrice:     sub.price          || 0,
              },
            });
          }
          console.log("[initialize] Pending subscription saved:", reference);
        } else {
          console.warn("[initialize] isSubscription=true but no authenticated user found");
        }
      } catch (dbErr) {
        // Don't block payment — log and continue
        console.error("[initialize] Failed to save pending subscription:", dbErr);
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