// proxy.ts — security headers + light request hardening.
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
// 'unsafe-eval' is required for Next.js dev mode; in prod it could be
// removed, but keeping it makes the rule work in both modes without a
// conditional that's easy to forget when promoting build to prod.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https: blob:",
  "frame-src 'self' https://drive.google.com",
  "frame-ancestors 'none'",
  "form-action 'self' https://api.qorepay.com",
  "connect-src 'self'",
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

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Security headers (defense-in-depth; XSS, clickjacking, MIME-sniff,
  // referrer leakage, downgrade attacks, fingerprinting permissions).
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
