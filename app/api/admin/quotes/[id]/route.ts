// app/api/admin/quotes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const QUOTE_STATUSES = ["new", "contacted", "quoted", "won", "lost"];

// PATCH { status } — move a quote request through the sales pipeline
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { status } = await request.json();
    if (!QUOTE_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const quote = await prisma.quoteRequest.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json({ quote });
  } catch (error) {
    console.error("[admin/quotes] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update quote" }, { status: 500 });
  }
}
