import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { getJwtSecret } from "@/lib/auth";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rateLimit";
import { normalizeUa } from "@/lib/device";
import { getDriveFileId, fetchDriveFile } from "@/lib/drive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// ── GET /api/classes/stream/[id]/pdf ─────────────────────────────────────────
// Proxies a class's companion PDF to the bound device, served inline so the
// browser's PDF viewer opens it in a new tab instead of a forced download.
// Same cookie + device-binding check as the video stream route.

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
  const rl = rateLimit(`stream-pdf:${ip}`, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterMs);

  const { id: classId } = await params;
  const enrollmentId = readEnrollmentId(request);
  if (!enrollmentId) {
    return new Response("Unauthorized. Re-enter your access pin.", { status: 401 });
  }
  const enrollment = await getAuthorizedEnrollment(request, enrollmentId);
  if (!enrollment || enrollment.classId !== classId) {
    return new Response(
      "This access pin is registered to another device. Each pin works on only one device.",
      { status: 403 }
    );
  }

  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls || !cls.pdfUrl) {
    return new Response("Not found", { status: 404 });
  }

  const range = request.headers.get("range");
  const driveId = getDriveFileId(cls.pdfUrl);

  let upstream: Response;
  try {
    if (driveId) {
      upstream = await fetchDriveFile(driveId, range);
    } else {
      const headers: Record<string, string> = {};
      if (range) headers["Range"] = range;
      upstream = await fetch(cls.pdfUrl, { headers, redirect: "follow" });
    }
  } catch (err) {
    console.error(`[stream] Failed to fetch PDF for class ${classId}:`, err);
    return new Response("Upstream error", { status: 502 });
  }

  if (!upstream.ok && upstream.status !== 206) {
    console.error(`[stream] Upstream ${upstream.status} for class ${classId}`);
    return new Response("Upstream error", { status: 502 });
  }

  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set(
    "Content-Disposition",
    `inline; filename="${(cls.title || "class-notes")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60)}.pdf"`
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