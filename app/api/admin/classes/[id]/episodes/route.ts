import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

// ── POST /api/admin/classes/[id]/episodes ────────────────────────────────────
// Add an episode to a video class. `episodeNumber` is optional — if omitted,
// we set it to (currentCount + 1). videoUrl + videoPassword are the per-episode
// secrets; the public catalog never returns them.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    let body: {
      title?: string;
      episodeNumber?: number;
      videoUrl?: string;
      videoPassword?: string;
      duration?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Module title is required" }, { status: 400 });
    }

    const cls = await prisma.class.findUnique({
      where: { id },
      select: { kind: true, singleEpisode: true },
    });
    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });
    if (cls.kind !== "video") {
      return NextResponse.json(
        { error: "Episodes can only be added to video classes" },
        { status: 400 }
      );
    }

    const count = await prisma.classEpisode.count({ where: { classId: id } });
    if (cls.singleEpisode && count >= 1) {
      return NextResponse.json(
        {
          error:
            "This class is in single-module mode and already has a module. Switch to multi-module mode in Class Settings to add more, or edit the existing module.",
        },
        { status: 400 }
      );
    }
    const episodeNumber =
      body.episodeNumber !== undefined ? Number(body.episodeNumber) : count + 1;

    const episode = await prisma.classEpisode.create({
      data: {
        classId: id,
        title: body.title.trim(),
        episodeNumber,
        videoUrl: body.videoUrl || "",
        videoPassword: body.videoPassword || "",
        duration: body.duration || null,
      },
    });

    return NextResponse.json({ episode }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/classes/[id]/episodes]", error);
      return NextResponse.json({ error: "Failed to add module" }, { status: 500 });
  }
}
