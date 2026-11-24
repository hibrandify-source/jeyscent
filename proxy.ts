// proxy.ts — security headers, light request hardening, and host routing for
// the gifting storefront (gift.jeyscent.com → app/gift/*).
//
// In Next.js 16 the `middleware.ts` file convention was renamed to `proxy.ts`
// (https://nextjs.org/docs/app/api-reference/file-conventions/proxy). We use
// it here only for defense-in-depth security headers — route-level
// authentication & authorization stays in each route handler via
// getCurrentUser()/requireAdmin(), which is more flexible and survives any
// future refactor that moves a Server Function to a different path.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Conservative CSP — strict enough to raise the bar against XSS, loose
// enough not to break:
//   • next/image with Cloudinary URLs         -> img-src https://res.cloudinary.com
//   • Google Drive video preview iframes        -> frame-src https://drive.google.com
//   • QorePay redirect (navigation, not fetch) -> form-action https://api.qorepay.com
//   • inline styles via style={{...}}          -> style-src 'unsafe-inline'
//   • Gmail mailto links                       -> mailto: scheme
//   • R2 presigned uploads (XHR from admin)    -> connect-src https://…r2.cloudflarestorage.com
//   • R2 presigned video streams (<video>)     -> media-src https://…r2.cloudflarestorage.com
//   • Meta/Facebook Pixel                      -> script-src connect.facebook.net
//                                              -> connect-src connect.facebook.net + *.facebook.com
// 'unsafe-eval' is required for Next.js dev mode; in prod it could be
// removed, but keeping it makes the rule work in both modes without a
// conditional that's easy to forget when promoting build to prod.
const R2_HOST = "https://cef4262c981af992b448ebda8d3604e4.eu.r2.cloudflarestorage.com";
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https: blob:",
  "frame-src 'self' https://drive.google.com",
  "frame-ancestors 'none'",
  "form-action 'self' https://api.qorepay.com",
  `connect-src 'self' https://connect.facebook.net https://*.facebook.com https://*.fbcdn.net ${R2_HOST}`,
  `media-src 'self' ${R2_HOST} blob:`,
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

// Skip security headers for paths where they're either irrelevant or where
// they'd interfere with Next.js internals.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};

// ── Gifting storefront (gift.jeyscent.com) ──────────────────────────────────
// gift.<host> is served by app/gift/*: "/" → "/gift", "/corporate" →
// "/gift/corporate", etc. API routes, Next internals and static files are
// shared and never rewritten. Locally, use http://gift.localhost:3000.
const GIFT_PREFIX = "/gift";

function isGiftHost(host: string) {
  return host.startsWith("gift.");
}

// Hosts where the gift subdomain exists, so /gift/* on the main host can be
// redirected to it. Other hosts (e.g. Vercel preview URLs) have no gift.
// subdomain and keep serving /gift/* directly.
function hasGiftSubdomain(host: string) {
  const hostname = host.split(":")[0];
  return (
    hostname === "localhost" ||
    hostname === "jeyscent.com" ||
    hostname.endsWith(".jeyscent.com")
  );
}

function isSharedPath(pathname: string) {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    // Files from /public (images, icons, …)
    /\.[a-z0-9]+$/i.test(pathname)
  );
}

function routeStorefront(request: NextRequest): NextResponse | null {
  const host = request.headers.get("host") || "";
  const { pathname, search } = request.nextUrl;
  if (isSharedPath(pathname)) return null;

  if (isGiftHost(host)) {
    const mainHost = host.slice("gift.".length);
    // Admin lives on the main site only. Built by hand so Location stays
    // absolute: NextResponse.redirect() relativizes URLs it considers
    // same-origin, which loops locally (gift.localhost → localhost).
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      const target = new URL(`${pathname}${search}`, `${request.nextUrl.protocol}//${mainHost}`);
      return new NextResponse(null, { status: 307, headers: { Location: target.toString() } });
    }
    // Never expose the internal prefix on the gift host.
    if (pathname === GIFT_PREFIX || pathname.startsWith(`${GIFT_PREFIX}/`)) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.slice(GIFT_PREFIX.length) || "/";
      return NextResponse.redirect(url, 308);
    }
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? GIFT_PREFIX : `${GIFT_PREFIX}${pathname}`;
    return NextResponse.rewrite(url, { request: { headers: request.headers } });
  }

  if (
    (pathname === GIFT_PREFIX || pathname.startsWith(`${GIFT_PREFIX}/`)) &&
    hasGiftSubdomain(host)
  ) {
    const giftHost = `gift.${host.replace(/^www\./, "")}`;
    const giftPath = pathname.slice(GIFT_PREFIX.length) || "/";
    return NextResponse.redirect(
      new URL(`${giftPath}${search}`, `${request.nextUrl.protocol}//${giftHost}`),
      308
    );
  }

  return null;
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()"
  );
  return response;
}

export function proxy(request: NextRequest) {
  // Basic UA block for obvious bot traffic hitting auth endpoints. Real
  // browsers always send a User-Agent; an empty/missing UA on POST /api/auth
  // is almost always scripted abuse. We do NOT block by UA on GETs (some
  // legitimate monitoring tools send no UA on headless GETs).
  const isAuthPost =
    request.method === "POST" &&
    request.nextUrl.pathname.startsWith("/api/auth/");
  if (isAuthPost && !request.headers.get("user-agent")) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const response =
    routeStorefront(request) ??
    NextResponse.next({
      request: { headers: request.headers },
    });

  // Security headers (defense-in-depth; XSS, clickjacking, MIME-sniff,
  // referrer leakage, downgrade attacks, fingerprinting permissions).
  return applySecurityHeaders(response);
}
