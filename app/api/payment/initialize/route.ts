import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { amount, email, name, metadata } = await request.json();

    if (!amount || !email) {
      return NextResponse.json(
        { error: "Amount and email are required" },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Initialize QorePay purchase
    const qorepayRes = await fetch(
      "https://api.qorepay.com/v1/purchases",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.QOREPAY_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // QorePay expects kobo (multiply naira by 100)
          amount: Math.round(amount * 100),
          currency: "NGN",
          brand_id: process.env.QOREPAY_BRAND_ID,
          customer_email: email,
          description: `JeyScent Order — ${name || email}`,
          metadata: {
            customer_name: name || "",
            customer_phone: metadata?.customer_phone || "",
            ...metadata,
          },
          redirect_url: `${baseUrl}/checkout/success`,
          failure_url: `${baseUrl}/checkout?payment=failed`,
        }),
      }
    );

    const qorepayData = await qorepayRes.json();

    console.log(
      "QorePay initialize response:",
      JSON.stringify(qorepayData, null, 2)
    );

    // QorePay returns: { data: { reference, status, checkout_url, amount, currency } }
    if (!qorepayData.data?.checkout_url) {
      console.error("QorePay error:", qorepayData);
      return NextResponse.json(
        {
          error:
            qorepayData.message ||
            "Failed to initialize payment",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      authorization_url: qorepayData.data.checkout_url, // keep same key so checkout/page.tsx needs no change
      reference: qorepayData.data.reference,
    });
  } catch (error) {
    console.error("Payment initialization error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}