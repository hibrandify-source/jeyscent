// app/api/admin/quotes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const QUOTE_STATUSES = ["new", "contacted", "quoted", "won", "lost"] as const;

async function isAdmin() {
  const user = await getCurrentUser();
  return !!user && user.role === "admin";
}

// GET all quote requests (optionally ?status=new)
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const status = new URL(request.url).searchParams.get("status");
    const where =
      status && (QUOTE_STATUSES as readonly string[]).includes(status) ? { status } : {};

    const [quotes, grouped] = await Promise.all([
      prisma.quoteRequest.findMany({ where, orderBy: { createdAt: "desc" } }),
      prisma.quoteRequest.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    const counts: Record<string, number> = { all: 0 };
    for (const g of grouped) {
      counts[g.status] = g._count._all;
      counts.all += g._count._all;
    }

    return NextResponse.json({ quotes, counts });
  } catch (error) {
    console.error("[admin/quotes] GET error:", error);
    return NextResponse.json({ error: "Failed to load quotes" }, { status: 500 });
  }
}
