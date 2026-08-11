import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/db";
import { verifyPassword, generateToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  // Rate-limit by IP — 10 attempts per minute. Combined with the generic
  // "Invalid email or password" error below (no email enumeration), this
  // makes brute-force attacks impractical.
  const ip = clientIp(request);
  const rl = rateLimit(`login:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterMs, "Too many login attempts. Please try again shortly.");

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);

    if (!user) {
      // Don't log which email failed — that's PII and aids enumeration.
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}