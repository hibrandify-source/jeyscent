// app/api/admin/subscribers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// FIXED: decoded.userId → decoded.id, 'ADMIN' → 'admin'
async function isAdmin(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) return false;

  const decoded = verifyToken(token);
  if (!decoded) return false;

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  return user?.role === "admin";
}

// GET all subscribers
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter");

    const where =
      filter === "active"
        ? { active: true }
        : filter === "inactive"
        ? { active: false }
        : {};

    const subscribers = await prisma.subscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const stats = {
      total: await prisma.subscriber.count(),
      active: await prisma.subscriber.count({ where: { active: true } }),
      inactive: await prisma.subscriber.count({ where: { active: false } }),
    };

    return NextResponse.json({ subscribers, stats });
  } catch (error) {
    console.error("Fetch subscribers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscribers" },
      { status: 500 }
    );
  }
}

// DELETE a subscriber (or deactivate)
export async function DELETE(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, permanent } = await request.json();

    if (permanent) {
      await prisma.subscriber.delete({ where: { id } });
    } else {
      await prisma.subscriber.update({
        where: { id },
        data: { active: false },
      });
    }

    return NextResponse.json({ message: "Subscriber removed" });
  } catch (error) {
    console.error("Delete subscriber error:", error);
    return NextResponse.json(
      { error: "Failed to remove subscriber" },
      { status: 500 }
    );
  }
}