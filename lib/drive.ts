// lib/drive.ts
// Server-side Google Drive access. The browser NEVER sees a Drive URL — the
// watch API rewrites Drive-hosted assets to our /api/classes/stream/* proxy,
// which resolves the file id to a direct download URL server-side and pipes
// the bytes back with Range passthrough (so seeking works). This removes the
// Drive "pop-out" escape hatch and keeps the file id out of the page DOM.

const directUrlCache = new Map<string, { url: string; at: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1h — direct URLs are stable for long stretches

/** Extract a Drive file id from any common Drive URL form. */
export function getDriveFileId(url: string): string | null {
  if (!url) return null;
  let m = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  m = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  m = url.match(/drive\.google\.com\/uc\?.*[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  return null;
}

export function isDriveUrl(url: string): boolean {
  return getDriveFileId(url) !== null;
}

/**
 * Follow Drive's redirect chain manually (`redirect: "manual"`) so we land on
 * the final content host with the `Range` header intact — fetch's automatic
 * redirect-follow strips Range on cross-origin hops, which would break video
 * seeking (the client would always get a full 200 body instead of 206).
 */
async function resolveDirectUrl(fileId: string): Promise<string> {
  const cached = directUrlCache.get(fileId);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.url;

  const candidates = [
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`,
  ];

  for (const base of candidates) {
    const res = await fetch(base, { redirect: "manual" });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      const url = new URL(location, base).toString();
      directUrlCache.set(fileId, { url, at: Date.now() });
      return url;
    }
    // Some files are served directly without a redirect.
    if (res.ok) {
      directUrlCache.set(fileId, { url: base, at: Date.now() });
      return base;
    }
  }
  throw new Error(`Could not resolve Drive file ${fileId}`);
}

/**
 * Fetch the file bytes for a Drive file id, forwarding an optional Range
 * header. Handles the virus-scan interstitial for large files by re-parsing
 * the confirm token and retrying.
 */
export async function fetchDriveFile(
  fileId: string,
  range?: string | null
): Promise<Response> {
  const finalUrl = await resolveDirectUrl(fileId);
  const headers: Record<string, string> = {};
  if (range) headers["Range"] = range;

  const res = await fetch(finalUrl, { headers, redirect: "follow" });
  if (res.status === 200 && res.headers.get("content-type")?.includes("text/html")) {
    // Virus-scan interstitial — grab the confirm token and retry.
    const html = await res.text();
    const m =
      html.match(/name="confirm"\s+value="([^"]+)"/) ||
      html.match(/confirm=([A-Za-z0-9_-]+)/);
    if (m) {
      const retry = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0&confirm=${m[1]}`;
      const retried = await fetch(retry, { headers, redirect: "follow" });
      if (!retried.headers.get("content-type")?.includes("text/html")) {
        return retried;
      }
    }
    throw new Error(`Drive returned an HTML interstitial for file ${fileId}`);
  }
  return res;
}