import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── POST /api/classes/watch ───────────────────────────────────────────────────
// Validates an access pin (+email as a soft second factor) and returns the
// class's content only from the device that first used the pin.
//   Pin -> one enrollment -> exactly one DeviceBinding.
//
// Returns:
//   • kind === "video" -> { authorized, kind, className, episodes:[{...}], pdfUrl? }
//   • kind === "pdf"   -> { authorized, kind, className, pdfUrl }
//
// Device-lock behavior (device-based, not network-based):
//   • No binding exists: bind UA + IP, return content.
//   • Binding exists, UA matches -> return content. (If the IP changed — e.g.
//     the user's carrier rotated IPs, or they moved Wi-Fi → mobile data on the
//     SAME device — we silently re-bind to the new IP. UA is the stable identity
//     signal; IP is treated as advisory.)
//   • Binding exists, UA differs  -> 403. One device, ever.
//
// UA source: the `user-agent` request header (Vercel/Neon pass it through).
// IP source: `x-forwarded-for` first entry, falling back to `request.ip`. We
// deliberately strip the port if present. UA is matched exactly; minor browser
// version bumps in the same browser will still match because the UA prefix
// (browser family, OS family, device family) is stable across point releases.

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first.split(":")[0];
  }
  const directIp = (request as unknown as { ip?: string }).ip;
  if (directIp) return directIp.split(":")[0];
  return "0.0.0.0";
}

// Normalize a UA for the purposes of "same device?" comparison. We strip the
// fine-grained version tokens (e.g. "Chrome/124.0.6367.91" -> "Chrome") so a
// same-browser minor update doesn't trip the lock, while keeping the
//identifying parts (browser family + OS family + device family + build).
function normalizeUa(raw: string): string {
  return raw
    // Collapse Chrome/Edge/Firefox/Safari version tokens
    .replace(/(Chrome|Edge|Edg|Firefox|Safari|Version|OPR|Opera|CriOS|FxiOS)\/[\d.]+/g, "$1")
    // Collapse mobile-version tokens
    .replace(/Mobile\/[\dA-F]+/g, "Mobile")
    // Trim runs of whitespace left behind
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: NextRequest) {
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
      // First time this pin is used — bind it.
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
    } else {
      const boundUa = normalizeUa(enrollment.device.userAgent || "");
      if (boundUa !== uaFingerprint) {
        // Same ua-fingerprint is required; an exact mismatch means a different
        // browser/device, even if they're on the same network.
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
      // UA matches the locked device. If the IP drifted (carrier NAT rotation,
      // Wi-Fi → mobile data, router reboot, etc.) on the SAME physical device,
      // silently re-bind to the new IP so future attempts compare against it.
      if (enrollment.device.ipAddress !== ip) {
        await prisma.deviceBinding.update({
          where: { id: enrollment.device.id },
          data: { ipAddress: ip },
        });
        console.log(
          `[classes/watch] Same device, new IP for enrollment ${enrollment.id}: ${enrollment.device.ipAddress} -> ${ip}`
        );
      }
    }

    // ── Authorized — return content for the class's kind ────────────────────
    if (kind === "video") {
      return NextResponse.json({
        authorized: true,
        kind: "video",
        className: enrollment.class.title,
        episodes: enrollment.class.episodes.map((ep) => ({
          id: ep.id,
          title: ep.title,
          episodeNumber: ep.episodeNumber,
          videoUrl: ep.videoUrl,
          videoPassword: ep.videoPassword || "",
          duration: ep.duration || null,
        })),
        // Optional companion PDF on a video class. Omitted entirely when unset
        // so the client can simply check for its presence.
        ...(enrollment.class.pdfUrl
          ? { pdfUrl: enrollment.class.pdfUrl }
          : {}),
      });
    }

    // kind === "pdf"
    return NextResponse.json({
      authorized: true,
      kind: "pdf",
      className: enrollment.class.title,
      pdfUrl: enrollment.class.pdfUrl,
    });
  } catch (error) {
    console.error("[POST /api/classes/watch]", error);
    return NextResponse.json(
      { error: "Failed to authorize access" },
      { status: 500 }
    );
  }
}
