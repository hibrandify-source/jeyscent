import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createOrder, createUser, getUserByEmail } from "@/lib/db";
import { hashPassword, generateToken } from "@/lib/auth";
import {
  sendOrderConfirmation,
  sendAdminNotification,
  sendWelcomeEmail,
} from "@/lib/email";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function generatePassword(): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ── Debug log so you can see exactly what arrives ──────────────────────
    console.log("[checkout] POST body:", JSON.stringify(body, null, 2));

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

    // ── Core field validation ───────────────────────────────────────────────
    const missing: string[] = [];
    if (!name)          missing.push("name");
    if (!email)         missing.push("email");
    if (!phone)         missing.push("phone");
    // Use != null so that a genuine 0 total is still caught, but "falsy" strings aren't
    if (total == null || total === "") missing.push("total");
    if (!items?.length) missing.push("items");

    if (missing.length > 0) {
      console.error("[checkout] Missing required fields:", missing);
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // ── Address validation only for delivery orders ─────────────────────────
    if (!isPickup && (!shippingAddress || !shippingCity || !shippingState)) {
      console.error("[checkout] Missing delivery address fields");
      return NextResponse.json(
        { error: "Missing required delivery address fields" },
        { status: 400 }
      );
    }

    // ── Safe resolved values ────────────────────────────────────────────────
    const resolvedAddress = isPickup
      ? "Self Pickup / Customer Rider"
      : shippingAddress;
    const resolvedCity  = isPickup ? "N/A" : shippingCity;
    const resolvedState = isPickup ? "N/A" : shippingState;

    // ── Duplicate order guard ───────────────────────────────────────────────
    if (paymentRef) {
      const existingOrder = await prisma.order.findFirst({
        where: { paymentRef },
      });

      if (existingOrder) {
        console.log("[checkout] Duplicate paymentRef — returning existing order:", existingOrder.id);
        return NextResponse.json({
          orderId: existingOrder.id,
          newAccount: false,
          message: "Order already exists",
        });
      }
    }

    // ── User resolution ─────────────────────────────────────────────────────
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
      } else {
        // Guest checkout — create silent account
        tempPassword = generatePassword();
        const hashedPw = await hashPassword(tempPassword);
        const newUser = await createUser(name, email, hashedPw);
        userId = newUser.id;
        // newAccount stays false — no welcome email sent
      }
    }

    // ── Create the order ────────────────────────────────────────────────────
    const orderId = await createOrder({
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

    console.log("[checkout] Order created:", orderId);

    // ── Email ───────────────────────────────────────────────────────────────
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
      deliveryEstimate:
        deliveryEstimate || (isPickup ? "Customer arranges pickup" : ""),
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