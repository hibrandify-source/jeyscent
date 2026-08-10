import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

// ── GET /api/admin/classes ────────────────────────────────────────────────────
// Returns the active class (first published) plus enrollment stats. We model
// a single class for v1 — the schema supports multiple, but the marketing
// page assumes one.
export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const classes = await prisma.class.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        episodes: {
          orderBy: { episodeNumber: "asc" },
          select: { id: true, title: true, episodeNumber: true, duration: true },
        },
        _count: {
          select: {
            enrollments: { where: { status: "active" } },
          },
        },
      },
    });

    const [totalEnrollments, totalRevenue, earlyBirdEnrollments] = await Promise.all([
      prisma.classEnrollment.count({ where: { status: "active" } }),
      prisma.classEnrollment.aggregate({
        _sum: { amountPaid: true },
        where: { status: "active" },
      }),
      prisma.classEnrollment.count({ where: { status: "active", isEarlyBird: true } }),
    ]);

    return NextResponse.json({
      classes,
      stats: {
        totalEnrollments,
        totalRevenue: totalRevenue._sum.amountPaid || 0,
        earlyBirdEnrollments,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/classes]", error);
    return NextResponse.json({ error: "Failed to load classes" }, { status: 500 });
  }
}

// ── POST /api/admin/classes ───────────────────────────────────────────────────
// Create or update a class. For v1 we upsert a single record: pass `id` to
// update, omit it to create. Optionally `seed` to create a starter row.
type CreateBody = {
  id?: string;
  title?: string;
  description?: string;
  kind?: "video" | "pdf";
  singleEpisode?: boolean;
  price?: number;
  earlyBirdPrice?: number;
  earlyBirdMax?: number;
  pdfUrl?: string | null;
  imageUrl?: string;
  published?: boolean;
};

export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let body: CreateBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (body.id) {
      // Update existing
      const data: Record<string, unknown> = {};
      if (body.title !== undefined) data.title = body.title;
      if (body.description !== undefined) data.description = body.description;
      if (body.kind !== undefined) data.kind = body.kind;
      if (body.singleEpisode !== undefined) {
        // singleEpisode only applies to video classes; pdfKind forces false.
        const effectiveKind = body.kind !== undefined ? body.kind : undefined;
        if (effectiveKind === "pdf") {
          data.singleEpisode = false;
        } else {
          data.singleEpisode = Boolean(body.singleEpisode);
        }
      }
      if (body.price !== undefined) data.price = Number(body.price);
      if (body.earlyBirdPrice !== undefined) data.earlyBirdPrice = Number(body.earlyBirdPrice);
      if (body.earlyBirdMax !== undefined) data.earlyBirdMax = Number(body.earlyBirdMax);
      if (body.pdfUrl !== undefined) data.pdfUrl = body.pdfUrl || null;
      if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
      if (body.published !== undefined) data.published = Boolean(body.published);

      const updated = await prisma.class.update({
        where: { id: body.id },
        data,
      });
      return NextResponse.json({ class: updated });
    }

    // Create new
    if (!body.title) {
      return NextResponse.json({ error: "Title is required to create a class" }, { status: 400 });
    }
    const kind = body.kind === "pdf" ? "pdf" : "video";
    const singleEpisode = kind === "video" ? Boolean(body.singleEpisode) : false;
    const pdfUrl = (body.pdfUrl || "").trim() || null;
    if (kind === "pdf" && !pdfUrl) {
      return NextResponse.json({ error: "A PDF class requires a PDF URL" }, { status: 400 });
    }
    const created = await prisma.class.create({
      data: {
        title: body.title,
        description: body.description || "",
        kind,
        singleEpisode,
        price: Number(body.price ?? 40000),
        earlyBirdPrice: Number(body.earlyBirdPrice ?? 30000),
        earlyBirdMax: Number(body.earlyBirdMax ?? 10),
        pdfUrl: kind === "pdf" ? pdfUrl : (pdfUrl || null),
        imageUrl: body.imageUrl || "",
        published: Boolean(body.published ?? false),
      },
    });
    return NextResponse.json({ class: created }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/classes]", error);
    return NextResponse.json({ error: "Failed to save class" }, { status: 500 });
  }
}
