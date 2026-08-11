// app/api/admin/subscribers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Reuse the canonical auth helper — it re-loads the user from the DB on every
// call, so deleted/deactivated admins can't ride a stale JWT to victory.
async function isAdmin() {
  const user = await getCurrentUser();
  return !!user && user.role === "admin";
}

// GET all subscribers
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
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
  if (!(await isAdmin())) {
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