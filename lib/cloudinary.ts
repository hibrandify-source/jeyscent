const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/**
 * Build a Cloudinary URL with optional transformations
 */
export function cloudinaryUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "auto" | "webp" | "jpg" | "png";
    crop?: "fill" | "fit" | "scale" | "thumb";
    gravity?: "auto" | "face" | "center";
  }
): string {
  if (!CLOUD_NAME) {
    console.warn("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set");
    return publicId;
  }

  const {
    width,
    height,
    quality = "auto",
    format = "auto",
    crop = "fill",
    gravity = "auto",
  } = options || {};

  // ✅ Fix: explicitly type as (string | false)[] then filter to string[]
  const transforms = (
    [
      `f_${format}`,
      `q_${quality}`,
      crop     ? `c_${crop}`     : false,
      gravity  ? `g_${gravity}`  : false,
      width    ? `w_${width}`    : false,
      height   ? `h_${height}`   : false,
    ] as (string | false)[]
  )
    .filter((t): t is string => Boolean(t))
    .join(",");

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${publicId}`;
}

/**
 * Inject sizing transforms into an existing Cloudinary full URL.
 * Turns a full-res URL into a properly sized one.
 */
export function cldResize(url: string, w: number, h: number): string {
  if (!url.includes("res.cloudinary.com")) return url;
  const idx = url.indexOf("/upload/");
  if (idx === -1) return url;
  const before = url.slice(0, idx + 8);
  const after  = url.slice(idx + 8);
  return `${before}w_${w},h_${h},c_fill,g_auto/${after}`;
}

/**
 * Pre-built image presets for common use cases
 */
export const cldImage = {
  // Product main image — 3:4 portrait
  product: (publicId: string) =>
    cloudinaryUrl(publicId, {
      width: 800,
      height: 1067,
      crop: "fill",
      gravity: "auto",
    }),

  // Product thumbnail
  thumbnail: (publicId: string) =>
    cloudinaryUrl(publicId, {
      width: 200,
      height: 267,
      crop: "fill",
      gravity: "auto",
    }),

  // Product card grid image
  card: (publicId: string) =>
    cloudinaryUrl(publicId, {
      width: 600,
      height: 800,
      crop: "fill",
      gravity: "auto",
    }),

  // Hero / banner — wide
  hero: (publicId: string) =>
    cloudinaryUrl(publicId, {
      width: 1920,
      height: 1080,
      crop: "fill",
      gravity: "auto",
    }),

  // Blog post cover
  blog: (publicId: string) =>
    cloudinaryUrl(publicId, {
      width: 1200,
      height: 630,
      crop: "fill",
      gravity: "auto",
    }),

  // Square (for cart thumbnails)
  square: (publicId: string) =>
    cloudinaryUrl(publicId, {
      width: 200,
      height: 200,
      crop: "fill",
      gravity: "auto",
    }),
};