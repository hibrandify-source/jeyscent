// app/api/subscriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser }           from "@/lib/auth";


export async function POST(request: NextRequest) {
  try {
    // ✅ Auth check — read JWT cookie the same way /api/auth/me does
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to start a subscription" },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { productId, productName, size, frequency = "quarterly", price } = body;

    // ✅ Validate the fields the subscribe page actually sends
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

    // ✅ Next delivery = 3 months from today
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