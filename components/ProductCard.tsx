"use client";

import CloudinaryImage from "@/components/CloudinaryImage";
import Link from "next/link";
import { Product } from "@/lib/types";
import { formatPrice, getSalePrice, getOriginalDisplayPrice } from "@/data/products";

export default function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const inStockSizes = product.sizes.filter((s) => s.inStock);
  const lowestBase  = Math.min(...inStockSizes.map((s) => s.price));
  const highestBase = Math.max(...inStockSizes.map((s) => s.price));

  const lowestSale  = getSalePrice(lowestBase);
  const highestSale = getSalePrice(highestBase);

  return (
    <Link href={`/shop/${product.id}`} className="group product-card block">
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-light-gray">
        <CloudinaryImage
          publicId={product.image}
          alt={product.name}
          preset="card"
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500" />

        {/* Quick View */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
          <div className="bg-white text-center py-3 text-[11px] uppercase tracking-[3px]">
            View Details
          </div>
        </div>

        {/* Fragrance Tag */}
        <div className="absolute top-4 left-4">
          <span className="bg-white px-3 py-1.5 text-[9px] uppercase tracking-[3px]">
            {product.fragrance}
          </span>
        </div>

        {/* Discount Badge */}
        <div className="absolute top-4 right-4">
          <span className="bg-black text-white px-2 py-1 text-[9px] uppercase tracking-[2px]">
            10% off
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1.5 mt-4">
        <p className="text-[10px] uppercase tracking-[3px] text-muted">
          {product.type}
        </p>
        <h3
          className="text-lg tracking-wide group-hover:text-muted transition-colors duration-300"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {product.name}
        </h3>

        {/* Price row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sale price — what buyer pays */}
          <span className="text-sm font-semibold text-black">
            {lowestSale === highestSale
              ? formatPrice(lowestSale)
              : `${formatPrice(lowestSale)} — ${formatPrice(highestSale)}`}
          </span>

          {/* Original price — crossed out */}
          <span className="text-xs text-muted line-through">
            {lowestBase === highestBase
              ? formatPrice(getOriginalDisplayPrice(lowestBase))
              : `${formatPrice(getOriginalDisplayPrice(lowestBase))} — ${formatPrice(getOriginalDisplayPrice(highestBase))}`}
          </span>
        </div>

        <p className="text-xs text-muted mt-2 line-clamp-2">
          {product.description}
        </p>
      </div>
    </Link>
  );
}