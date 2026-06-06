// app/api/admin/subscriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser }            from "@/lib/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "all";

  const where = filter === "active"
    ? { status: "active" }
    : filter === "cancelled"
    ? { status: "cancelled" }
    : {};

  const [subscriptions, allSubs] = await Promise.all([
    prisma.subscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    // Always fetch all to compute stats regardless of filter
    prisma.subscription.findMany({
      select: { status: true, price: true },
    }),
  ]);

  const active    = allSubs.filter((s) => s.status === "active");
  const cancelled = allSubs.filter((s) => s.status === "cancelled");
  // Quarterly revenue = sum of active subscription prices
  const monthlyRecurring = active.reduce((sum, s) => sum + s.price, 0);

  return NextResponse.json({
    subscriptions,
    stats: {
      total:            allSubs.length,
      active:           active.length,
      cancelled:        cancelled.length,
      monthlyRecurring, // actually quarterly, labelled in UI
    },
  });
}

// PATCH — update status (cancel or reactivate)
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, status } = await request.json();
  if (!id || !["active", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const updated = await prisma.subscription.update({
    where: { id },
    data:  { status },
  });

  return NextResponse.json({ subscription: updated });
}

// DELETE — permanently remove
export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  await prisma.subscription.delete({ where: { id } });
  return NextResponse.json({ success: true });
}