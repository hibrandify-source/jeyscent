// lib/r2.ts
// Cloudflare R2 access (S3-compatible). The bucket is private — the browser
// never talks to R2 directly except through short-lived presigned URLs:
//   • GET  — issued by the watch API after pin + device-lock, so video/PDF
//     bytes flow CDN -> student with Vercel functions never open during
//     playback (no 300s stream cap, no Drive link exposure).
//   • PUT  — issued by the admin API so file uploads stream browser -> R2
//     without buffering multi-GB files through a serverless function.
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// The EU jurisdiction bucket must be reached via the .eu. endpoint; the
// endpoint is set explicitly in .env.local so region/jurisdiction quirks
// never depend on SDK inference.
function getConfig() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const endpoint = process.env.R2_ENDPOINT;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !endpoint) {
    throw new Error("R2 environment variables are not configured");
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, endpoint };
}

let client: S3Client | null = null;

function r2Client(): S3Client {
  if (client) return client;
  const { accessKeyId, secretAccessKey, endpoint, accountId } = getConfig();
  client = new S3Client({
    region: "auto", // R2 is regionless; the endpoint carries jurisdiction
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    // R2 requires virtual-hosted-style or path-style? Both work; path-style
    // is explicit and avoids bucket-name-in-host surprises.
    forcePathStyle: true,
    // Newer SDK versions add an automatic CRC32 checksum to PutObject, which
    // puts a placeholder value into presigned URLs and breaks the signature
    // when the real upload happens. Only send checksums when required.
    requestChecksumCalculation: "WHEN_REQUIRED",
    // Stable identity for CDN logs / debugging.
    customUserAgent: `jeyscent/${accountId}`,
  });
  return client;
}

export function r2Bucket(): string {
  return getConfig().bucket;
}

/** Presigned GET URL for streaming/downloading an object (default 24h). */
export async function presignGet(
  key: string,
  expiresInSeconds = 60 * 60 * 24
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: r2Bucket(),
    Key: key,
  });
  return getSignedUrl(r2Client(), command, { expiresIn: expiresInSeconds });
}

/**
 * Presigned PUT URL for browser->R2 uploads (default 15 min — just enough to
 * stream a file). `contentType` is set on the object (served back on GET);
 * it is intentionally NOT a signed header so the browser can send it freely.
 * Content-Disposition is left unset so PDFs render inline by default.
 */
export async function presignPut(
  key: string,
  contentType: string,
  expiresInSeconds = 15 * 60
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: r2Bucket(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client(), command, { expiresIn: expiresInSeconds });
}