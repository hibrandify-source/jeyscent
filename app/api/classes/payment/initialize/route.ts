import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── POST /api/classes/payment/initialize ────────────────────────────────────
// Starts a QorePay checkout for a class seat. Saves a PendingEnrollment row
// keyed by the QorePay reference so the success redirect can confirm later
// (server-side re-verifies with QorePay, mirroring subscriptions/confirm).
//
// Pricing rule (mirrored in /api/classes/confirm):
//   if class.earlyBirdUsed < class.earlyBirdMax  -> earlyBirdPrice
//   else                                          -> price
export async function POST(request: NextRequest) {
  try {
    let body: { classId?: string; name?: string; email?: string; phone?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const classId = body.classId?.trim();
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim();

    if (!classId || !name || !email || !phone) {
      return NextResponse.json(
        { error: "Class ID, name, email and phone are required" },
        { status: 400 }
      );
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email" }, { status: 400 });
    }
    if (phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json({ error: "Please enter a valid phone number" }, { status: 400 });
    }

    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls || !cls.published) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Reject duplicate enrollment for the same email+class that's already active
    const existingEnrollment = await prisma.classEnrollment.findFirst({
      where: { classId, email, status: "active" },
      select: { id: true },
    });
    if (existingEnrollment) {
      return NextResponse.json(
        { error: "You are already enrolled in this class. Check your email for your access pin." },
        { status: 409 }
      );
    }

    // Compute price based on early-bird availability
    const isEarlyBird = cls.earlyBirdUsed < cls.earlyBirdMax;
    const amount = isEarlyBird ? cls.earlyBirdPrice : cls.price;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const qorepayRes = await fetch("https://api.qorepay.com/v1/purchases", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.QOREPAY_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // kobo
        currency: "NGN",
        brand_id: process.env.QOREPAY_BRAND_ID,
        customer_email: email,
        description: `JeyScent Class — ${cls.title} (${isEarlyBird ? "Early Bird" : "Standard"})`,
        metadata: {
          kind: "class",
          classId,
          name,
          email,
          phone,
          amount,
          isEarlyBird,
        },
        // QorePay does not append the reference to the redirect_url on its own,
        // so the success page can't read `?reference=` from the URL. Two-pronged
        // recovery is handled client-side on the success page:
        //   1. URL `?reference=` (when a future QorePay change passes it back).
        //   2. sessionStorage `jeyscent_class_checkout.reference`, which the
        //      checkout page stashes right before redirecting to QorePay. This
        //      is advisory only — the confirm endpoint always re-verifies with
        //      QorePay server-side, so trusting the stashed value is safe.
        redirect_url: `${baseUrl}/classes/success`,
        failure_url: `${baseUrl}/classes/checkout?payment=failed`,
      }),
    });

    const qorepayData = await qorepayRes.json();

    if (!qorepayData.data?.checkout_url) {
      console.error("[classes/payment/initialize] QorePay error:", qorepayData);
      return NextResponse.json(
        { error: qorepayData.message || "Failed to initialize payment" },
        { status: 400 }
      );
    }

    const reference = qorepayData.data.reference as string;

    // Persist the pending enrollment so the success page can confirm later.
    // We use upsert-by-reference in case QorePay returns a reused reference
    // (shouldn't happen but keeps the unique constraint safe).
    await prisma.pendingEnrollment.upsert({
      where: { reference },
      create: {
        classId,
        reference,
        name,
        email,
        phone,
        amount,
        isEarlyBird,
      },
      update: {
        classId,
        name,
        email,
        phone,
        amount,
        isEarlyBird,
      },
    });

    return NextResponse.json({
      authorization_url: qorepayData.data.checkout_url,
      reference,
      amount,
      isEarlyBird,
    });
  } catch (error) {
    console.error("[POST /api/classes/payment/initialize]", error);
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
