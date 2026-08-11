// app/api/subscriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser }           from "@/lib/auth";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";
import { products, getSalePrice } from "@/data/products";


export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to start a subscription" },
        { status: 401 }
      );
    }

    // Rate-limit: 5 subscription creations per minute per user.
    const rl = rateLimit(`subcreate:${user.id}`, { limit: 5, windowMs: 60_000 });
    if (!rl.ok) return tooManyRequests(rl.retryAfterMs, "Too many subscription attempts. Please slow down.");

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { productId, productName, size, frequency = "quarterly", price } = body;

    if (!productId || !productName || !size || !price) {
      return NextResponse.json(
        { error: "Missing required subscription fields" },
        { status: 400 }
      );
    }

    if (typeof price !== "number" || price <= 0) {
      return NextResponse.json(
        { error: "Invalid price" },
        { status: 400 }
      );
    }

    // ── Server-side price validation ──────────────────────────────────
    // Verify the subscription price matches the source of truth in
    // data/products.ts — a client could otherwise submit a lower price.
    const product = products.find((p) => p.id === productId);
    if (!product) {
      return NextResponse.json(
        { error: "Invalid product" },
        { status: 400 }
      );
    }
    const sizeInfo = product.sizes.find((s) => s.size === size);
    if (!sizeInfo) {
      return NextResponse.json(
        { error: "Invalid size for this product" },
        { status: 400 }
      );
    }
    const expectedUnitPrice = getSalePrice(sizeInfo.price);
    if (price !== expectedUnitPrice) {
      return NextResponse.json(
        { error: "Price mismatch — please refresh the page and try again" },
        { status: 400 }
      );
    }

    // ✅ Prevent duplicate active subscriptions for the same product+size
    const existing = await prisma.subscription.findFirst({
      where: {
        userId:    user.id,
        productId,
        size,
        status:    "active",
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "You already have an active subscription for this product and size." },
        { status: 200 }
      );
    }

    const nextDelivery = new Date();
    nextDelivery.setMonth(nextDelivery.getMonth() + 3);

    const subscription = await prisma.subscription.create({
      data: {
        userId:      user.id,
        productId,
        productName,
        size,
        frequency,
        price,
        status:      "active",
        nextDelivery,
      },
    });

    return NextResponse.json(
      { message: "Subscription created successfully!", subscription },
      { status: 201 }
    );

  } catch (error) {
    console.error("[POST /api/subscriptions]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// ✅ GET — fetch current user's subscriptions (useful for dashboard)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const subscriptions = await prisma.subscription.findMany({
      where:   { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ subscriptions });

  } catch (error) {
    console.error("[GET /api/subscriptions]", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}