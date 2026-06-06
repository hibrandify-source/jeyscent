import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params; // await needed in Next.js 15
    const { status } = await request.json();

    if (!["active", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Ensure subscription belongs to this user
    const subscription = await prisma.subscription.findFirst({
      where: { id, userId: user.id },
    });

    if (!subscription) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ subscription: updated });
  } catch (error) {
    console.error("[PATCH /api/subscriptions/[id]]", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}