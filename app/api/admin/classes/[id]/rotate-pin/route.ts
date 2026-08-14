import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

// ── POST /api/admin/classes/[id]/rotate-pin ─────────────────────────────────
// Generates a fresh 12-char hex access pin for an enrollment, invalidating the
// previous pin (pin lookups match exactly, so the old value stops working).
// Also clears the device binding so the student can register the pin on a
// fresh device immediately.
async function generateUniquePin(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = crypto.randomBytes(6).toString("hex"); // 12 hex chars
    const collision = await prisma.classEnrollment.findUnique({
      where: { accessPin: candidate },
      select: { id: true },
    });
    if (!collision) return candidate;
  }
  throw new Error("Could not generate a unique pin after 5 attempts");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    let body: { enrollmentId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const enrollmentId = body.enrollmentId?.trim();
    if (!enrollmentId) {
      return NextResponse.json(
        { error: "enrollmentId is required" },
        { status: 400 }
      );
    }

    const enrollment = await prisma.classEnrollment.findFirst({
      where: { id: enrollmentId, classId: id },
      select: { id: true },
    });
    if (!enrollment) {
      return NextResponse.json(
        { error: "Enrollment not found in this class" },
        { status: 404 }
      );
    }

    const newPin = await generateUniquePin();
    const updated = await prisma.$transaction(async (tx) => {
      await tx.deviceBinding.deleteMany({
        where: { enrollmentId: enrollment.id },
      });
      return tx.classEnrollment.update({
        where: { id: enrollment.id },
        data: { accessPin: newPin },
        select: { accessPin: true, email: true, name: true },
      });
    });

    console.log(
      `[admin] Rotated access pin + reset device binding for enrollment ${enrollment.id} (${updated.email})`
    );

    return NextResponse.json({
      success: true,
      pin: updated.accessPin,
      deviceReset: true,
    });
  } catch (error) {
    console.error("[POST /api/admin/classes/[id]/rotate-pin]", error);
    return NextResponse.json(
      { error: "Failed to rotate access pin" },
      { status: 500 }
    );
  }
}
