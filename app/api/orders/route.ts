import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  createOrder,
  getOrdersByUserId,
  getAllOrders,
} from "@/lib/db";
import {
  sendOrderConfirmation,
  sendAdminNotification,
} from "@/lib/email";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Rate-limit: 10 orders per minute per user.
    const rl = rateLimit(`orders:${user.id}`, { limit: 10, windowMs: 60_000 });
    if (!rl.ok) return tooManyRequests(rl.retryAfterMs, "Too many orders. Please slow down.");

    const body = await request.json();
    const {
      items,
      total,
      paymentRef,
      shippingAddress,
      shippingCity,
      shippingState,
      phone,
      email,
    } = body;

    if (
      !items ||
      !items.length ||
      !total ||
      !shippingAddress ||
      !shippingCity ||
      !shippingState ||
      !phone ||
      !email
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const orderId = await createOrder({
      userId: user.id,
      total,
      paymentRef,
      shippingAddress,
      shippingCity,
      shippingState,
      phone,
      email,
      items,
    });

    // Send emails (non-blocking)
    const emailData = {
      customerName: user.name,
      customerEmail: email,
      orderId,
      items,
      total,
      shippingAddress: `${shippingAddress}, ${shippingCity}, ${shippingState}`,
    };

    sendOrderConfirmation(emailData).catch(console.error);
    sendAdminNotification(emailData).catch(console.error);

    return NextResponse.json({
      orderId,
      message: "Order created successfully",
    });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (user.role === "admin") {
      const orders = await getAllOrders();
      return NextResponse.json({ orders });
    }

    const orders = await getOrdersByUserId(user.id);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}