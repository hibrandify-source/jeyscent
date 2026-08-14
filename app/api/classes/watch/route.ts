import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rateLimit";
import { getClientIp, normalizeUa } from "@/lib/device";
import { getJwtSecret } from "@/lib/auth";
import { isDriveUrl } from "@/lib/drive";
import { presignGet } from "@/lib/r2";

// Resolve a stored asset reference to the URL the browser should actually
// fetch. Three flavors:
//   • Drive link        -> our streaming proxy (hides the raw Drive URL/file id)
//   • No scheme (R2 key) -> presigned R2 GET URL (bucket is private; a bare
//                           key is 403 without a signature). 7-day expiry so a
//                           student's device keeps playing without re-entering
//                           their pin every day.
//   • Any other URL     -> pass through unchanged
async function deliveryUrl(url: string, streamPath: string): Promise<string> {
  if (isDriveUrl(url)) return streamPath;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
    try {
      return await presignGet(url, 60 * 60 * 24 * 7);
    } catch (err) {
      console.error("[classes/watch] Failed to presign R2 key:", url, err);
      return url;
    }
  }
  return url;
}

// ── POST /api/classes/watch ───────────────────────────────────────────────────
// Validates an access pin (+email as a soft second factor) and returns the
// class's content only from the device that first used the pin.
//   Pin -> one enrollment -> exactly one DeviceBinding.
//
// Returns:
//   • kind === "video" -> { authorized, kind, className, episodes:[{...}], pdfUrl? }
//   • kind === "pdf"   -> { authorized, kind, className, pdfUrl }
//
// Device-lock behavior (UA-based):
//   The User-Agent string is the sole device identity. This is what makes a pin
//   work on exactly one physical device: a phone and a laptop are different UAs
//   even when they sit on the same WiFi (same IP), so a pin activated on mobile
//   cannot be reused on a laptop — the user's stated requirement. A device that
//   roams networks (WiFi -> LTE) keeps the same UA and stays unlocked.
//   • No binding exists: bind IP + UA, return content.
//   • Binding exists, UA matches (after normalization) -> return content. The
//     IP is silently updated in case the device moved networks; IP never gates
//     access on its own.
//   • Binding exists, UA differs -> 403. A different browser/device, period.
//
// On success an HttpOnly `watch_access` cookie (signed, 7 days) is set. The
// /api/classes/stream/* routes verify it per request and re-check the device
// binding, so Drive-hosted assets never expose their file id to the browser.
//
// IP source: `x-forwarded-for` first entry (Vercel passes it through),
// falling back to `request.ip`. Stripped of port. Used for logging only.
// UA source: the `user-agent` request header, normalized so same-browser minor
// version bumps (and minor OS point releases) don't trip the lock.

async function setWatchCookie(enrollmentId: string) {
  const token = jwt.sign({ enrollmentId }, getJwtSecret(), {
    expiresIn: "7d",
  });
  const cookieStore = await cookies();
  cookieStore.set("watch_access", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/classes",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function POST(request: NextRequest) {
  // Rate-limit by IP — 30 watch attempts per minute. Pin brute-force is
  // effectively infeasible (48-bit entropy), but this stops trivial flooding
  // and abuse of the device-binding side effects.
  const ip = clientIp(request);
  const rl = rateLimit(`watch:${ip}`, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterMs, "Too many access attempts. Please slow down.");

  try {
    let body: { pin?: string; email?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const pin = body.pin?.trim().toLowerCase();
    const email = body.email?.trim().toLowerCase();

    if (!pin) {
      return NextResponse.json({ error: "Access pin is required" }, { status: 400 });
    }

    const enrollment = await prisma.classEnrollment.findUnique({
      where: { accessPin: pin },
      include: {
        class: {
          include: { episodes: { orderBy: { episodeNumber: "asc" } } },
        },
        device: true,
      },
    });

    if (!enrollment || enrollment.status !== "active") {
      return NextResponse.json(
        { error: "Invalid access pin. Please check the pin in your email." },
        { status: 401 }
      );
    }

    if (email && email !== enrollment.email.toLowerCase()) {
      return NextResponse.json(
        { error: "Pin/email mismatch. Please use the email you paid with." },
        { status: 401 }
      );
    }

    const kind = (enrollment.class.kind as "video" | "pdf") || "video";

    // Pre-flight: ensure the class has the assets its kind requires.
    if (kind === "video" && enrollment.class.episodes.length === 0) {
      return NextResponse.json(
        { error: "The class video modules are not available yet. Please check back later." },
        { status: 409 }
      );
    }
    if (kind === "pdf" && !enrollment.class.pdfUrl) {
      return NextResponse.json(
        { error: "The class PDF is not available yet. Please check back later." },
        { status: 409 }
      );
    }

    const ip = getClientIp(request);
    const userAgentRaw = request.headers.get("user-agent") || "";
    const userAgent = userAgentRaw.slice(0, 500);
    const uaFingerprint = normalizeUa(userAgentRaw);

    // ── Device-lock logic (device-based via User-Agent) ────────────────────
    if (!enrollment.device) {
      // First time this pin is used — bind it. If two requests for the same
      // pin race past this null-check, the loser's CREATE throws P2002 on the
      // unique enrollmentId constraint — we re-fetch the winning binding and
      // continue as normal (instead of falling through to a generic 500).
      try {
        await prisma.deviceBinding.create({
          data: {
            enrollmentId: enrollment.id,
            ipAddress: ip,
            userAgent,
          },
        });
        console.log(
          `[classes/watch] Bound enrollment ${enrollment.id} to UA="${uaFingerprint}" IP=${ip}`
        );
      } catch (createErr: unknown) {
        const code =
          (createErr as { code?: string })?.code ||
          (createErr as { meta?: { code?: string } })?.meta?.code;
        if (code !== "P2002") {
          console.error("[classes/watch] Failed to bind device:", createErr);
          return NextResponse.json(
            { error: "Failed to authorize access" },
            { status: 500 }
          );
        }
        // Race lost — re-fetch the winning binding and re-check below.
        const raced = await prisma.deviceBinding.findUnique({
          where: { enrollmentId: enrollment.id },
        });
        if (!raced) {
          // Should not happen, but bail safely.
          return NextResponse.json(
            { error: "Failed to authorize access" },
            { status: 500 }
          );
        }
        const racedUa = normalizeUa(raced.userAgent || "");
        // Winning binding was created from a different device (different UA).
        if (racedUa !== uaFingerprint) {
          return NextResponse.json(
            {
              error:
                "This access pin is registered to another device. Each pin works on only one device.",
            },
            { status: 403 }
          );
        }
        console.log(
          `[classes/watch] Race-lost create for enrollment ${enrollment.id}; matched winning binding (UA=${uaFingerprint})`
        );
      }
    } else {
      // UA is the sole device identity. Same UA = same device, regardless of
      // IP — a phone on LTE and that same phone on WiFi are one device, while a
      // laptop on the same WiFi is a different UA and stays locked out.
      const boundUa = normalizeUa(enrollment.device.userAgent || "");
      if (boundUa !== uaFingerprint) {
        console.warn(
          `[classes/watch] Rejected pin ${pin}: bound UA="${boundUa}", requested UA="${uaFingerprint}"`
        );
        return NextResponse.json(
          {
            error:
              "This access pin is registered to another device. Each pin works on only one device.",
          },
          { status: 403 }
        );
      }
      // Same device. If the IP drifted (device roamed networks), silently
      // update the stored IP for logging/tracking — it never gates access.
      if (enrollment.device.ipAddress !== ip) {
        await prisma.deviceBinding.update({
          where: { id: enrollment.device.id },
          data: { ipAddress: ip },
        });
        console.log(
          `[classes/watch] Same device, new IP for enrollment ${enrollment.id}: ${enrollment.device.ipAddress} -> ${ip}`
        );
      } else {
        // Same device, same IP. If the UA changed (different browser on the
        // same device), silently update the stored UA so the new browser on
        // this device remains authorized too.
        if (userAgentRaw !== (enrollment.device.userAgent || "")) {
          await prisma.deviceBinding.update({
            where: { id: enrollment.device.id },
            data: { userAgent: userAgent },
          });
          console.log(
            `[classes/watch] Same UA, updated stored UA for enrollment ${enrollment.id}`
          );
        }
      }
    }

    // ── Authorized — issue the stream cookie and return content ────────────
    // Drive-hosted URLs are rewritten to our streaming proxy so the raw Drive
    // link (and its file id) never reaches the browser — no pop-out, no public
    // link. Non-Drive URLs pass through unchanged.
    await setWatchCookie(enrollment.id);

    if (kind === "video") {
      const episodes = await Promise.all(
        enrollment.class.episodes.map(async (ep) => ({
          id: ep.id,
          title: ep.title,
          episodeNumber: ep.episodeNumber,
          videoUrl: await deliveryUrl(
            ep.videoUrl,
            `/api/classes/stream/${ep.id}`
          ),
          videoPassword: ep.videoPassword || "",
          duration: ep.duration || null,
        }))
      );
      return NextResponse.json({
        authorized: true,
        kind: "video",
        className: enrollment.class.title,
        episodes,
        // Optional companion PDF on a video class. Omitted entirely when unset
        // so the client can simply check for its presence.
        ...(enrollment.class.pdfUrl
          ? {
              pdfUrl: await deliveryUrl(
                enrollment.class.pdfUrl,
                `/api/classes/stream/${enrollment.class.id}/pdf`
              ),
            }
          : {}),
      });
    }

    // kind === "pdf"  (pdfUrl guaranteed non-null by the pre-flight check above)
    return NextResponse.json({
      authorized: true,
      kind: "pdf",
      className: enrollment.class.title,
      pdfUrl: await deliveryUrl(
        enrollment.class.pdfUrl as string,
        `/api/classes/stream/${enrollment.class.id}/pdf`
      ),
    });
  } catch (error) {
    console.error("[POST /api/classes/watch]", error);
    return NextResponse.json(
      { error: "Failed to authorize access" },
      { status: 500 }
    );
  }
}
