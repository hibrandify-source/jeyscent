// app/api/subscriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Use its own instance to avoid any import issues with @/lib/db
const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      );
    }

    const { email } = body;

    if (!email || !email.includes("@") || !email.includes(".")) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if already subscribed
    const existing = await prisma.subscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      if (existing.active) {
        return NextResponse.json(
          { message: "You are already subscribed! 🎉" },
          { status: 200 }
        );
      } else {
        await prisma.subscriber.update({
          where: { email: normalizedEmail },
          data: { active: true },
        });
        return NextResponse.json(
          { message: "Welcome back! You have been resubscribed. 🎉" },
          { status: 200 }
        );
      }
    }

    // Create new subscriber
    await prisma.subscriber.create({
      data: { email: normalizedEmail },
    });

    return NextResponse.json(
      { message: "Successfully subscribed! Stay tuned for updates. 🎉" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}