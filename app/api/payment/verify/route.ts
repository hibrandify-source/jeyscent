import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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

    console.log(
      "QorePay verification response:",
      JSON.stringify(verifyData, null, 2)
    );

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