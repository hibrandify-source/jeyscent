// app/api/subscriptions/confirm/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // ── Find most recent pending subscription for this user ───────────────
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

    // ── Verify payment with QorePay before confirming ─────────────────────
    try {
      const verifyRes = await fetch(
        `https://api.qorepay.com/v1/purchases/${pending.reference}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.QOREPAY_SECRET_KEY}`,
          },
        }
      );
      const verifyData = await verifyRes.json();

      console.log("[confirm] QorePay verify response:", JSON.stringify(verifyData, null, 2));

      if (!verifyRes.ok || verifyData.data?.status !== "SUCCESS") {
        return NextResponse.json(
          {
            error: `Payment not verified. Status: ${verifyData.data?.status || "unknown"}`,
          },
          { status: 400 }
        );
      }
    } catch (verifyErr) {
      console.error("[confirm] Payment verification failed:", verifyErr);
      return NextResponse.json(
        { error: "Could not verify payment. Please contact support." },
        { status: 500 }
      );
    }

    // ── Compute next delivery date ─────────────────────────────────────────
    const nextDelivery = new Date();
    nextDelivery.setMonth(
      nextDelivery.getMonth() + (pending.frequencyMonths || 3)
    );

    // ── Create one subscription record per line item ───────────────────────
    const items = Array.isArray(pending.items)
      ? (pending.items as {
          productId:   string;
          productName: string;
          size:        string;
          quantity:    number;
          unitPrice:   number;
          price?:      number;
        }[])
      : [];

    if (items.length === 0) {
      return NextResponse.json(
        { error: "No items found in pending subscription" },
        { status: 400 }
      );
    }

    for (const item of items) {
      const unitPrice = item.unitPrice ?? item.price ?? 0;

      // Check for existing active subscription for same product+size
      const existing = await prisma.subscription.findFirst({
        where: {
          userId:    user.id,
          productId: item.productId,
          size:      item.size,
          status:    "active",
        },
      });

      if (existing) {
        // Update quantity on existing instead of duplicating
        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            quantity:    (existing.quantity || 1) + (item.quantity || 1),
            price:       unitPrice,
            nextDelivery,
          },
        });
        console.log("[confirm] Updated existing subscription:", existing.id);
      } else {
        // Create new subscription line
        await prisma.subscription.create({
          data: {
            userId:      user.id,
            productId:   item.productId,
            productName: item.productName,
            size:        item.size,
            quantity:    item.quantity || 1,
            frequency:   pending.frequency || "quarterly",
            price:       unitPrice,
            status:      "active",
            nextDelivery,
          },
        });
        console.log("[confirm] Created subscription for:", item.productName);
      }
    }

    // ── Clean up pending record ───────────────────────────────────────────
    await prisma.pendingSubscription.delete({ where: { id: pending.id } });

    console.log("[confirm] Subscription confirmed successfully for user:", user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/subscriptions/confirm]", error);
    return NextResponse.json(
      { error: "Failed to confirm subscription" },
      { status: 500 }
    );
  }
}