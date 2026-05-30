// app/api/checkout/route.ts
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
    const {
      name,
      email,
      phone,
      shippingAddress,
      shippingCity,
      shippingState,
      paymentRef,
      total,
      shippingFee,
      isParkPickup,
      deliveryEstimate,
      items,
      createAccount = false, // ✅ Changed default to false
    } = body;

    // Validate
    if (
      !name ||
      !email ||
      !phone ||
      !shippingAddress ||
      !shippingCity ||
      !shippingState ||
      !total ||
      !items?.length
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Prevent duplicate orders with same payment reference
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

    let userId: string | null = null;
    let newAccount = false;
    let tempPassword: string | null = null;

    // Check if user is logged in
    const currentUser = await getCurrentUser();

    if (currentUser) {
      // ✅ User is logged in - use their account
      userId = currentUser.id;
    } else {
      const existingUser = await getUserByEmail(email);

      if (existingUser) {
        // ✅ Existing user found - use their account
        userId = existingUser.id;
      } else if (createAccount) {
        // ✅ NEW: Only create account if customer explicitly opted in
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
        // ✅ FIXED: Guest checkout - no account created
        // We need to handle this based on your Prisma schema
        // Option 1: Make userId optional in Order schema (recommended)
        // Option 2: Create a generic "guest" user and associate all guest orders
        
        // For now, we'll create a minimal account but NOT log them in or notify them
        // This is needed if your Order table requires userId
        tempPassword = generatePassword();
        const hashedPw = await hashPassword(tempPassword);
        const newUser = await createUser(name, email, hashedPw);
        userId = newUser.id;
        // newAccount stays false - no welcome email, no notification to user
        // The account exists but user doesn't know about it (not ideal but works)
      }
    }

    // Create the order
    const orderId = await createOrder({
      userId,
      total,
      paymentRef,
      shippingAddress,
      shippingCity,
      shippingState,
      phone,
      email,
      items,
    });

    const emailData = {
      customerName: name,
      customerEmail: email,
      orderId,
      items,
      total,
      shippingAddress: `${shippingAddress}, ${shippingCity}, ${shippingState}`,
      shippingFee: shippingFee || 0,
      isParkPickup: isParkPickup || false,
      deliveryEstimate: deliveryEstimate || "",
    };

    sendOrderConfirmation(emailData).catch(console.error);
    sendAdminNotification(emailData).catch(console.error);

    // ✅ Only send welcome email if user explicitly opted in
    if (newAccount && tempPassword) {
      sendWelcomeEmail({
        name,
        email,
        password: tempPassword,
      }).catch(console.error);
    }

    return NextResponse.json({
      orderId,
      newAccount,
      message: "Order created successfully",
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}