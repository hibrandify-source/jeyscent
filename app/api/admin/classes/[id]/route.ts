import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

// ── GET /api/admin/classes/[id] ─────────────────────────────────────────────
// Returns all active enrollments for a class with their device bindings.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;

    const cls = await prisma.class.findUnique({
      where: { id },
      include: {
        episodes: { orderBy: { episodeNumber: "asc" } },
        enrollments: {
          where: { status: "active" },
          include: { device: true },
          orderBy: { createdAt: "desc" },
        },
        pendingEnrollments: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });

    return NextResponse.json({ class: cls });
  } catch (error) {
    console.error("[GET /api/admin/classes/[id]]", error);
    return NextResponse.json({ error: "Failed to load class" }, { status: 500 });
  }
}

// ── PATCH /api/admin/classes/[id] ───────────────────────────────────────────
// Update class fields (title, prices, video, early-bird cap, published).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = String(body.title);
    if (body.description !== undefined) data.description = String(body.description);
    if (body.kind !== undefined) data.kind = String(body.kind);
    if (body.singleEpisode !== undefined) {
      // singleEpisode only applies to video classes.
      const kindNow = body.kind !== undefined ? String(body.kind) : undefined;
      if (kindNow === "pdf") {
        data.singleEpisode = false;
      } else if (kindNow === "video") {
        data.singleEpisode = Boolean(body.singleEpisode);
      } else {
        // Kind not changing in this request — read from DB to context-check.
        const existing = await prisma.class.findUnique({
          where: { id },
          select: { kind: true },
        });
        data.singleEpisode =
          existing?.kind === "video" ? Boolean(body.singleEpisode) : false;
      }
    }
    if (body.price !== undefined) data.price = Number(body.price);
    if (body.earlyBirdPrice !== undefined) data.earlyBirdPrice = Number(body.earlyBirdPrice);
    if (body.earlyBirdMax !== undefined) data.earlyBirdMax = Number(body.earlyBirdMax);
    if (body.pdfUrl !== undefined) data.pdfUrl = String(body.pdfUrl) || null;
    if (body.imageUrl !== undefined) data.imageUrl = String(body.imageUrl);
    if (body.published !== undefined) data.published = Boolean(body.published);

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await prisma.class.update({ where: { id }, data });
    return NextResponse.json({ class: updated });
  } catch (error) {
    console.error("[PATCH /api/admin/classes/[id]]", error);
    return NextResponse.json({ error: "Failed to update class" }, { status: 500 });
  }
}

// ── DELETE /api/admin/classes/[id] ──────────────────────────────────────────
// Optionally nullify the device binding for an enrollment (when given an
// `enrollmentId` in the body), so an admin can reset a locked-out user
// without deleting the enrollment. If no enrollmentId is passed, deletes the
// class itself.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    let body: { enrollmentId?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Body optional
    }

    // If an enrollmentId is passed, reset that enrollment's IP binding.
    if (body.enrollmentId) {
      await prisma.deviceBinding.deleteMany({
        where: { enrollmentId: body.enrollmentId },
      });
      return NextResponse.json({ success: true, reset: body.enrollmentId });
    }

    // Otherwise delete the class entirely (cascades to enrollments + bindings).
    await prisma.class.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/classes/[id]]", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
