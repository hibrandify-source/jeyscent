import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserByEmail } from "@/lib/db";
import { hashPassword, generateToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  // Rate-limit by IP — 5 new accounts per minute per IP. Prevents automated
  // mass account creation / spam signups.
  const ip = clientIp(request);
  const rl = rateLimit(`register:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterMs, "Too many signups from this network. Please try again shortly.");

  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const user = await createUser(name, email, hashedPassword);

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
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}