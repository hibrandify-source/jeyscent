import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { presignPut } from "@/lib/r2";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

// ── POST /api/admin/classes/[id]/upload ──────────────────────────────────────
// Returns a presigned PUT URL for uploading a video module or companion PDF
// directly to R2 from the browser (the file never passes through Vercel, so
// multi-GB uploads aren't bounded by the 300s function limit).
//
// Body: { target: "episode" | "pdf", episodeId?, filename, contentType }
// Returns: { uploadUrl, key } — the client PUTs the file to `uploadUrl`, then
// saves `key` into the episode's videoUrl / the class's pdfUrl.

function sanitizeName(name: string): string {
  const base = name.replace(/[^\w.\-]+/g, "-").replace(/-+/g, "-").slice(0, 80);
  return base || "upload";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    let body: {
      target?: string;
      episodeId?: string;
      filename?: string;
      contentType?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const target = body.target;
    const contentType = body.contentType || "application/octet-stream";
    const filename = sanitizeName(body.filename || "upload");

    if (target === "episode") {
      const episodeId = body.episodeId?.trim();
      if (!episodeId) {
        return NextResponse.json(
          { error: "episodeId is required for episode uploads" },
          { status: 400 }
        );
      }
      const episode = await prisma.classEpisode.findUnique({
        where: { id: episodeId },
        select: { classId: true },
      });
      if (!episode || episode.classId !== id) {
        return NextResponse.json(
          { error: "Episode not found in this class" },
          { status: 404 }
        );
      }
      const key = `classes/videos/${episodeId}/${filename}`;
      const uploadUrl = await presignPut(key, contentType);
      return NextResponse.json({ uploadUrl, key });
    }

    if (target === "pdf") {
      const cls = await prisma.class.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!cls) {
        return NextResponse.json({ error: "Class not found" }, { status: 404 });
      }
      const key = `classes/pdfs/${id}/${filename}`;
      const uploadUrl = await presignPut(key, contentType);
      return NextResponse.json({ uploadUrl, key });
    }

    return NextResponse.json(
      { error: 'target must be "episode" or "pdf"' },
      { status: 400 }
    );
  } catch (error) {
    console.error("[POST /api/admin/classes/[id]/upload]", error);
    return NextResponse.json(
      { error: "Failed to create upload" },
      { status: 500 }
    );
  }
}