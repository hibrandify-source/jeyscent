import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createOrder, createUser, getUserByEmail } from "@/lib/db";
import { hashPassword, generateToken } from "@/lib/auth";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rateLimit";
import {
  sendOrderConfirmation,
  sendAdminNotification,
  sendWelcomeEmail,
} from "@/lib/email";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { products, getSalePrice } from "@/data/products";

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: NextRequest) {
  // Rate-limit: 10 checkout submissions per minute per IP. Each creates DB
  // rows, sends emails, and may create a user — throttling stops abuse.
  const ip = clientIp(request);
  const rl = rateLimit(`checkout:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterMs, "Too many orders. Please slow down.");

  try {
    const body = await request.json();

    const {
      name,
      email,
      phone,
      shippingAddress,
      shippingCity,
      shippingState,
      deliveryMethod,
      paymentRef,
      total,
      shippingFee,
      isParkPickup,
      deliveryEstimate,
      items,
      createAccount = false,
    } = body;

    const isPickup = deliveryMethod === "pickup";

    // ── Core field validation ──────────────────────────────────────────────
    const missing: string[] = [];
    if (!name)                        missing.push("name");
    if (!email)                       missing.push("email");
    if (!phone)                       missing.push("phone");
    if (total == null || total === "") missing.push("total");
    if (!items?.length)               missing.push("items");

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // ── Address validation only for delivery orders ────────────────────────
    if (!isPickup && (!shippingAddress || !shippingCity || !shippingState)) {
      return NextResponse.json(
        { error: "Missing required delivery address fields" },
        { status: 400 }
      );
    }

    // ── Server-side price validation ──────────────────────────────────────
    // Don't trust client-sent prices — recompute from the source of truth
    // (data/products.ts) and reject if anything doesn't match exactly.
    let computedItemsTotal = 0;
    for (const item of items) {
      if (typeof item.productId !== "string" || !item.productId) {
        return NextResponse.json({ error: "Invalid product in cart" }, { status: 400 });
      }
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
      if (!sizeInfo.inStock) {
        return NextResponse.json(
          { error: `${product.name} (${item.size}) is out of stock` },
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

    // Verify that total isn't less than the computed items total + shipping.
    // (total should equal computedItemsTotal + shippingFee, but we allow
    // the client to pass a higher total e.g. for rounding — just not lower.)
    const expectedMinTotal = computedItemsTotal + (typeof shippingFee === "number" ? shippingFee : 0);
    if (typeof total !== "number" || total < expectedMinTotal) {
      return NextResponse.json(
        { error: "Total mismatch — please refresh the page and try again" },
        { status: 400 }
      );
    }

    // ── Safe resolved values ───────────────────────────────────────────────
    const resolvedAddress = isPickup ? "Self Pickup / Customer Rider" : shippingAddress;
    const resolvedCity    = isPickup ? "N/A" : shippingCity;
    const resolvedState   = isPickup ? "N/A" : shippingState;

    // ── Duplicate order guard (fast-path) ──────────────────────────────────
    if (paymentRef) {
      const existingOrder = await prisma.order.findFirst({
        where: { paymentRef },
      });

      if (existingOrder) {
        return NextResponse.json({
          orderId: existingOrder.id,
          newAccount: false,
          message: "Order already exists",
        });
      }
    }

    // ── User resolution ────────────────────────────────────────────────────
    let userId: string | null = null;
    let newAccount = false;
    let tempPassword: string | null = null;

    const currentUser = await getCurrentUser();

    if (currentUser) {
      userId = currentUser.id;
    } else {
      const existingUser = await getUserByEmail(email);

      if (existingUser) {
        userId = existingUser.id;
      } else if (createAccount) {
        tempPassword = generatePassword();
        const hashedPw = await hashPassword(tempPassword);
        const newUser = await createUser(name, email, hashedPw);

        userId = newUser.id;
        newAccount = true;

        const token = generateToken({
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
        });

        const cookieStore = await cookies();
        cookieStore.set("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        });
      }
      // Guest checkout: userId stays null — no silent account is created.
      // The order is still tracked by email and phone, and the customer
      // can always create an account later if they want to track orders.
    }

    // ── Create the order ───────────────────────────────────────────────────
    let orderId: string;
    try {
      orderId = await createOrder({
        userId,
        total,
        paymentRef,
        shippingAddress: resolvedAddress,
        shippingCity: resolvedCity,
        shippingState: resolvedState,
        phone,
        email,
        items,
      });
    } catch (createErr: unknown) {
      // P2002 = unique constraint violation on paymentRef — a concurrent
      // request already created the order for this payment reference.
      // Re-fetch the winning order and return it idempotently.
      if (
        typeof createErr === "object" && createErr !== null &&
        "code" in createErr && (createErr as { code: string }).code === "P2002"
      ) {
        const existingOrder = await prisma.order.findFirst({ where: { paymentRef } });
        if (existingOrder) {
          return NextResponse.json({
            orderId: existingOrder.id,
            newAccount: false,
            message: "Order already exists",
          });
        }
      }
      throw createErr;
    }

    // ── Emails ─────────────────────────────────────────────────────────────
    const displayAddress = isPickup
      ? "Self Pickup — our team will contact you via WhatsApp with pickup details"
      : `${resolvedAddress}, ${resolvedCity}, ${resolvedState}`;

    const emailData = {
      customerName: name,
      customerEmail: email,
      orderId,
      items,
      total,
      shippingAddress: displayAddress,
      shippingFee: shippingFee || 0,
      isParkPickup: isParkPickup || false,
      deliveryEstimate: deliveryEstimate || (isPickup ? "Customer arranges pickup" : ""),
    };

    sendOrderConfirmation(emailData).catch(console.error);
    sendAdminNotification(emailData).catch(console.error);

    if (newAccount && tempPassword) {
      sendWelcomeEmail({ name, email, password: tempPassword }).catch(console.error);
    }

    return NextResponse.json({
      orderId,
      newAccount,
      message: "Order created successfully",
    });
  } catch (error) {
    console.error("[checkout] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}