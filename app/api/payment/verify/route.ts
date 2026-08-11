import { NextRequest, NextResponse } from "next/server";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  // Rate-limit: 20 verifications per minute per IP. Each call hits QorePay's
  // GET /v1/purchases/:reference endpoint — throttling protects gateway quota.
  const ip = clientIp(request);
  const rl = rateLimit(`verify:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterMs, "Too many verification attempts. Please slow down.");

  try {
    const { reference } = await request.json();

    if (!reference) {
      return NextResponse.json(
        { error: "Payment reference is required" },
        { status: 400 }
      );
    }

    // Verify with QorePay: GET /v1/purchases/:reference
    const verifyRes = await fetch(
      `https://api.qorepay.com/v1/purchases/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.QOREPAY_SECRET_KEY}`,
        },
      }
    );

    const verifyData = await verifyRes.json();

    // QorePay returns: { data: { status: "SUCCESS", amount, currency, ... } }
    const isSuccessful =
      verifyRes.ok &&
      verifyData.data?.status === "SUCCESS";

    if (isSuccessful) {
      return NextResponse.json({
        verified: true,
        reference: verifyData.data.reference,
        // Convert kobo back to naira
        amount: verifyData.data.amount / 100,
        channel: verifyData.data.channel || "CARD",
        currency: verifyData.data.currency,
        paidAt: verifyData.data.transaction?.paid_at || new Date().toISOString(),
        customerEmail: verifyData.data.customer_email,
        metadata: verifyData.data.metadata,
      });
    } else {
      return NextResponse.json(
        {
          verified: false,
          status: verifyData.data?.status,
          error: `Payment status: ${verifyData.data?.status || "unknown"}`,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}