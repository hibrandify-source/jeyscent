import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── GET /api/classes/[id] ──────────────────────────────────────────────────────
// Public read of a single published class. Returns episode titles + numbers
// + durations (so the public detail page can show a curriculum preview), but
// NEVER the videoUrl / videoPassword: those are returned only by the watch
// API to paid & IP-locked clients. The pdfUrl is also withheld here.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cls = await prisma.class.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        kind: true,
        singleEpisode: true,
        price: true,
        earlyBirdPrice: true,
        earlyBirdMax: true,
        earlyBirdUsed: true,
        imageUrl: true,
        published: true,
        createdAt: true,
        episodes: {
          orderBy: { episodeNumber: "asc" },
          select: {
            id: true,
            title: true,
            episodeNumber: true,
            duration: true,
          },
        },
        // Exposed as a boolean only — the URL itself is a paid secret.
        pdfUrl: true,
      },
    });

    if (!cls || !cls.published) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const { pdfUrl, earlyBirdUsed, ...rest } = cls;
    return NextResponse.json({
      class: {
        ...rest,
        episodeCount: cls.episodes.length,
        earlyBRemaining: Math.max(0, cls.earlyBirdMax - earlyBirdUsed),
        hasPdf: !!pdfUrl,
      },
    });
  } catch (error) {
    console.error("[GET /api/classes/[id]]", error);
    return NextResponse.json({ error: "Failed to load class" }, { status: 500 });
  }
}
