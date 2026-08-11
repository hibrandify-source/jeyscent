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
import { prisma } from "@/lib/prisma";
import { products, getSalePrice } from "@/data/products";

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

    // ── Server-side price validation ──────────────────────────────────
    let computedItemsTotal = 0;
    for (const item of items) {
      if (typeof item.quantity !== "number" || item.quantity < 1 || !Number.isInteger(item.quantity)) {
        return NextResponse.json({ error: "Invalid quantity in cart" }, { status: 400 });
      }
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Invalid product: ${item.productId}` },
          { status: 400 }
        );
      }
      const sizeInfo = product.sizes.find((s) => s.size === item.size);
      if (!sizeInfo) {
        return NextResponse.json(
          { error: `Invalid size for ${product.name}: ${item.size}` },
          { status: 400 }
        );
      }
      const expectedUnitPrice = getSalePrice(sizeInfo.price);
      if (item.price !== expectedUnitPrice) {
        return NextResponse.json(
          { error: "Price mismatch — please refresh the page and try again" },
          { status: 400 }
        );
      }
      computedItemsTotal += expectedUnitPrice * item.quantity;
    }
    if (typeof total !== "number" || total < computedItemsTotal) {
      return NextResponse.json(
        { error: "Total mismatch — please refresh the page and try again" },
        { status: 400 }
      );
    }

    // ── Create the order (P2002 race handling) ────────────────────────
    let orderId: string;
    try {
      orderId = await createOrder({
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
    } catch (createErr: unknown) {
      if (
        typeof createErr === "object" && createErr !== null &&
        "code" in createErr && (createErr as { code: string }).code === "P2002"
      ) {
        const existingOrder = await prisma.order.findFirst({ where: { paymentRef } });
        if (existingOrder) {
          return NextResponse.json({
            orderId: existingOrder.id,
            message: "Order already exists",
          });
        }
      }
      throw createErr;
    }

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