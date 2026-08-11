import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── GET /api/classes ──────────────────────────────────────────────────────────
// Public catalog feed — returns every published class without any secret
// fields (no videoUrl, no pdfUrl). Episode `videoUrl` is intentionally
// excluded; episode titles + summary counts only. The public detail page
// uses this to render marketing content; the watch API returns the URLs only
// to paid & authorized clients.
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const onlyPublished = url.searchParams.get("all") !== "1";

    const classes = await prisma.class.findMany({
      where: onlyPublished ? { published: true } : undefined,
      orderBy: { createdAt: "desc" },
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
          select: { id: true, title: true, episodeNumber: true, duration: true },
        },
        // We expose a boolean flag for the PDF companion (so the public
        // marketing and checkout pages can mention it) without exposing the
        // pdfUrl itself, which is a paid secret.
        pdfUrl: true,
      },
    });

    const withCounts = classes.map((c) => {
      const { pdfUrl, earlyBirdUsed, ...rest } = c;
      return {
        ...rest,
        episodeCount: c.episodes.length,
        earlyBRemaining: Math.max(0, c.earlyBirdMax - earlyBirdUsed),
        hasPdf: !!pdfUrl,
      };
    });

    return NextResponse.json({ classes: withCounts });
  } catch (error) {
    console.error("[GET /api/classes]", error);
    return NextResponse.json({ error: "Failed to load classes" }, { status: 500 });
  }
}
