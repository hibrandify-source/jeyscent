import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { getJwtSecret } from "@/lib/auth";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rateLimit";
import { getClientIp, normalizeUa } from "@/lib/device";
import { getDriveFileId, fetchDriveFile } from "@/lib/drive";
import { presignGet } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// ── GET /api/classes/stream/[id] ─────────────────────────────────────────────
// Serves a class episode's video to the bound device. Two flavors:
//   • Drive-hosted (has a drive.google.com URL) — bytes are proxied through
//     this route so the Drive file id never reaches the browser.
//   • R2-hosted (videoUrl is a bare object key, no scheme) — this route
//     redirects (307) to a freshly signed 30-minute R2 URL. Because the
//     player re-requests on every range/seek, each request gets a new URL:
//     expiry can never interrupt playback, and any URL captured from the
//     network panel dies within 30 minutes.
// Access is granted by the HttpOnly `watch_access` cookie set at pin
// authorization time, and re-verified per request against the enrollment's
// device binding (normalized UA), so a copied cookie can't be used from a
// different device.
//
// Range requests pass through so the native <video> element can seek; the
// upstream status (200/206) and Content-Range headers are forwarded as-is.

function readEnrollmentId(request: NextRequest): string | null {
  const cookie = request.cookies.get("watch_access")?.value;
  if (!cookie) return null;
  try {
    const decoded = jwt.verify(cookie, getJwtSecret()) as {
      enrollmentId?: string;
    };
    return decoded.enrollmentId || null;
  } catch {
    return null;
  }
}

async function getAuthorizedEnrollment(
  request: NextRequest,
  enrollmentId: string
) {
  const enrollment = await prisma.classEnrollment.findUnique({
    where: { id: enrollmentId },
    include: { device: true },
  });
  if (!enrollment || enrollment.status !== "active") return null;
  if (!enrollment.device) return null; // pin was never activated
  const ua = normalizeUa(request.headers.get("user-agent") || "");
  const boundUa = normalizeUa(enrollment.device.userAgent || "");
  if (boundUa !== ua) return null;
  return enrollment;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = clientIp(request);
  const rl = rateLimit(`stream:${ip}`, { limit: 300, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterMs);

  const { id: episodeId } = await params;
  const enrollmentId = readEnrollmentId(request);
  if (!enrollmentId) {
    return new Response("Unauthorized. Re-enter your access pin.", { status: 401 });
  }
  const enrollment = await getAuthorizedEnrollment(request, enrollmentId);
  if (!enrollment) {
    return new Response(
      "This access pin is registered to another device. Each pin works on only one device.",
      { status: 403 }
    );
  }

  const episode = await prisma.classEpisode.findUnique({
    where: { id: episodeId },
  });
  if (!episode || episode.classId !== enrollment.classId || !episode.videoUrl) {
    return new Response("Not found", { status: 404 });
  }

  const range = request.headers.get("range");
  const driveId = getDriveFileId(episode.videoUrl);

  // ── R2-hosted: fresh 30-min presigned URL per request ───────────────────
  // A bare key (no scheme) is an R2 object. Redirect to a newly signed URL so
  // every range request the player makes gets a fresh one — playback can
  // never outlive its URL, and anything captured in the network panel is dead
  // within 30 minutes. `no-store` stops the browser caching the Location.
  if (!driveId && !/^[a-z][a-z0-9+.-]*:\/\//i.test(episode.videoUrl)) {
    try {
      const signed = await presignGet(episode.videoUrl, 30 * 60);
      return NextResponse.redirect(signed, {
        status: 307,
        headers: {
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (err) {
      console.error(`[stream] Failed to presign R2 key for episode ${episodeId}:`, err);
      return new Response("Upstream error", { status: 502 });
    }
  }

  let upstream: Response;
  try {
    if (driveId) {
      upstream = await fetchDriveFile(driveId, range);
    } else {
      const headers: Record<string, string> = {};
      if (range) headers["Range"] = range;
      upstream = await fetch(episode.videoUrl, { headers, redirect: "follow" });
    }
  } catch (err) {
    console.error(`[stream] Failed to fetch episode ${episodeId}:`, err);
    return new Response("Upstream error", { status: 502 });
  }

  if (!upstream.ok && upstream.status !== 206) {
    console.error(
      `[stream] Upstream ${upstream.status} for episode ${episodeId}`
    );
    return new Response("Upstream error", { status: 502 });
  }

  const headers = new Headers();
  const upstreamType = upstream.headers.get("content-type");
  // Drive's direct-download URLs often report application/octet-stream —
  // the files are mp4s, so normalize for a smooth native-player experience.
  headers.set(
    "Content-Type",
    upstreamType && upstreamType !== "application/octet-stream"
      ? upstreamType
      : "video/mp4"
  );
  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);
  const contentRange = upstream.headers.get("content-range");
  if (contentRange) headers.set("Content-Range", contentRange);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Content-Type-Options", "nosniff");

  if (request.method === "HEAD") {
    return new Response(null, { status: upstream.status, headers });
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}
