import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rateLimit";

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: NextRequest) {
  // Rate-limit by IP — 3 requests per minute. Each request triggers a DB write
  // and an outgoing email, so stricter than login/register. Throttle is per
  // IP (not per email) so an attacker can't enumerate emails by sending
  // resets to many addresses from the same IP.
  const ip = clientIp(request);
  const rl = rateLimit(`forgot:${ip}`, { limit: 3, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterMs, "Too many reset requests. Please try again shortly.");

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);

    if (!user) {
      // Don't reveal whether email exists
      return NextResponse.json({
        message: "If an account exists, a reset email has been sent",
      });
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const hashedPassword = await hashPassword(tempPassword);

    // Update user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Send email with temp password
    await sendPasswordResetEmail({
      name: user.name,
      email: user.email,
      tempPassword,
    });

    return NextResponse.json({
      message: "If an account exists, a reset email has been sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}