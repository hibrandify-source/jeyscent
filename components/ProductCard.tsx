"use client";

import { useState, useRef } from "react";
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

  const allImages = [product.image, ...product.gallery];
  const images = [...new Set(allImages)].slice(0, 2);
  const hasMultiple = images.length > 1;

  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(0);
  const swiped = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    swiped.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const x = e.touches[0].clientX;
    const diff = touchStartX.current - x;
    if (Math.abs(diff) > 10) {
      swiped.current = true;
    }
    if (Math.abs(diff) > 20) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!swiped.current) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && current < images.length - 1) {
        setCurrent(current + 1);
      } else if (diff < 0 && current > 0) {
        setCurrent(current - 1);
      }
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (swiped.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <Link href={`/shop/${product.id}`} className="group product-card block">
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-light-gray">
        <div
          className="flex h-full cursor-grab active:cursor-grabbing"
          onTouchStart={hasMultiple ? handleTouchStart : undefined}
          onTouchMove={hasMultiple ? handleTouchMove : undefined}
          onTouchEnd={hasMultiple ? handleTouchEnd : undefined}
          onClick={hasMultiple ? handleClick : undefined}
          style={{
            transform: `translateX(-${current * 100}%)`,
            transition: "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            width: `${images.length * 100}%`,
          }}
        >
          {images.map((img, i) => (
            <div key={i} className="relative h-full" style={{ width: `${100 / images.length}%` }}>
              <CloudinaryImage
                publicId={img}
                alt={product.name}
                preset="card"
                fill
                priority={priority && i === 0}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>
          ))}
        </div>

        {/* Swipe arrows */}
        {hasMultiple && (
          <>
            {current > 0 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrent(current - 1);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white/70 hover:bg-white flex items-center justify-center shadow-sm transition-all"
                aria-label="Previous image"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            {current < images.length - 1 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrent(current + 1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white/70 hover:bg-white flex items-center justify-center shadow-sm transition-all"
                aria-label="Next image"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
          </>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500 pointer-events-none" />

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