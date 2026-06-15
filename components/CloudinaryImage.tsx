import Image from "next/image";
import { cldImage } from "@/lib/cloudinary";

interface CloudinaryImageProps {
  publicId: string;
  alt: string;
  preset?: "product" | "thumbnail" | "card" | "hero" | "blog" | "square";
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

const presetDims: Record<keyof typeof cldImage, string> = {
  product:   "w_800,h_1067,c_fill,g_auto",
  thumbnail: "w_200,h_267,c_fill,g_auto",
  card:      "w_600,h_800,c_fill,g_auto",
  hero:      "w_1920,h_1080,c_fill,g_auto",
  blog:      "w_1200,h_630,c_fill,g_auto",
  square:    "w_200,h_200,c_fill,g_auto",
};

function resolveSrc(publicId: string, preset: keyof typeof cldImage): string {
  if (!publicId.startsWith("http")) return cldImage[preset](publicId);
  const dims = presetDims[preset];
  if (dims && publicId.includes("res.cloudinary.com")) {
    const idx = publicId.indexOf("/upload/");
    if (idx !== -1) {
      const before = publicId.slice(0, idx + 8);
      const after  = publicId.slice(idx + 8);
      return `${before}${dims}/${after}`;
    }
  }
  return publicId;
}

export default function CloudinaryImage({
  publicId,
  alt,
  preset = "product",
  fill = false,
  width,
  height,
  className = "object-cover",
  priority = false,
  sizes,
}: CloudinaryImageProps) {
  const src = resolveSrc(publicId, preset);

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        unoptimized
        sizes={
          sizes ||
          "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        }
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 800}
      height={height || 1067}
      className={className}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      unoptimized
      sizes={sizes}
    />
  );
}