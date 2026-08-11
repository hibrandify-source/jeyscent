import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

// ── PATCH /api/admin/classes/[id]/episodes/[episodeId] ────────────────────────
// Update an episode. Allows renumbering and editing secrets (videoUrl /
// videoPassword). Renumbering is the admin's responsibility — we don't
// auto-renumber siblings to avoid surprises.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; episodeId: string }> }
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { episodeId } = await params;
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = String(body.title);
    if (body.episodeNumber !== undefined) data.episodeNumber = Number(body.episodeNumber);
    if (body.videoUrl !== undefined) data.videoUrl = String(body.videoUrl);
    if (body.videoPassword !== undefined) data.videoPassword = String(body.videoPassword);
    if (body.duration !== undefined) data.duration = body.duration ? String(body.duration) : null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await prisma.classEpisode.update({
      where: { id: episodeId },
      data,
    });
    return NextResponse.json({ episode: updated });
  } catch (error) {
    console.error("[PATCH /api/admin/classes/[id]/episodes/[episodeId]]", error);
    return NextResponse.json({ error: "Failed to update module" }, { status: 500 });
  }
}

// ── DELETE /api/admin/classes/[id]/episodes/[episodeId] ──────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; episodeId: string }> }
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { episodeId } = await params;
    await prisma.classEpisode.delete({ where: { id: episodeId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/classes/[id]/episodes/[episodeId]]", error);
    return NextResponse.json({ error: "Failed to delete module" }, { status: 500 });
  }
}
