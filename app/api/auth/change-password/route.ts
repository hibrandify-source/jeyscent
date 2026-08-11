// app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { sendPasswordChangedEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate-limit: 5 password changes per hour per user — slows brute-force
    // against currentPassword if an attacker has a session.
    const rl = rateLimit(`chpw:${user.id}`, { limit: 5, windowMs: 3_600_000 });
    if (!rl.ok) return tooManyRequests(rl.retryAfterMs, "Too many password change attempts. Please wait a while.");

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Re-fetch full user record (includes password hash)
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, dbUser.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: dbUser.id },
      data: { password: hashedPassword },
    });

    // Send password changed email notification
    try {
      await sendPasswordChangedEmail(dbUser.email, dbUser.name || "Valued Customer");
    } catch (emailError) {
      console.error("Failed to send password changed email:", emailError);
    }

    return NextResponse.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}