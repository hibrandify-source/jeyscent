// components/CloudinaryImage.tsx
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
  const isFullUrl =
    publicId.startsWith("http://") || publicId.startsWith("https://");

  const src = isFullUrl ? publicId : cldImage[preset](publicId);

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        priority={priority}
        // FIXED: When priority=true, use eager loading for LCP images
        loading={priority ? "eager" : "lazy"}
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
      sizes={sizes}
    />
  );
}