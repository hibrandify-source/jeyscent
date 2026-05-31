// app/shop/page.tsx
"use client";

import Image from "next/image";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { products } from "@/data/products";
import ProductCard from "@/components/ProductCard";

const collectionVerses: Record<string, { verse: string; reference: string }> = {
  ruth: {
    verse: "\"...wherever you go, I will go; wherever you live, I will live...\"",
    reference: "Ruth 1:16",
  },
  proverbs: {
    verse: "\"She is strong and respected and not afraid of the future\"",
    reference: "Proverbs 31:25",
  },
};

const collectionBanners: Record<string, string> = {
  all: "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766382/ruth_fragrance_oitrdz.jpg",
  ruth: "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766382/ruth_fragrance_oitrdz.jpg",
  proverbs: "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766381/proverb_fragrance_h3ee7l.jpg",
};

export default function ShopPage() {
  const searchParams = useSearchParams();
  const initialFragrance = searchParams.get("fragrance") || "all";

  const [fragrance, setFragrance] = useState(initialFragrance);
  const [type, setType] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const filtered = useMemo(() => {
    let result = [...products];

    if (fragrance !== "all") {
      result = result.filter(
        (p) => p.fragrance.toLowerCase() === fragrance.toLowerCase()
      );
    }

    if (type !== "all") {
      result = result.filter(
        (p) => p.type.toLowerCase().replace(/\s/g, "-") === type
      );
    }

    if (sortBy === "price-low") {
      result.sort(
        (a, b) =>
          Math.min(...a.sizes.map((s) => s.price)) -
          Math.min(...b.sizes.map((s) => s.price))
      );
    } else if (sortBy === "price-high") {
      result.sort(
        (a, b) =>
          Math.max(...b.sizes.map((s) => s.price)) -
          Math.max(...a.sizes.map((s) => s.price))
      );
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [fragrance, type, sortBy]);

  const types = [
    { value: "all", label: "All Types" },
    { value: "reed-diffuser", label: "Reed Diffuser" },
    { value: "car-diffuser", label: "Car Diffuser" },
    { value: "room-spray", label: "Room Spray" },
    { value: "refill-bottle", label: "Refill Bottle" },
  ];

  const currentVerse = collectionVerses[fragrance.toLowerCase()];

  return (
    <div className="page-transition pt-24 lg:pt-28">
      {/* Header Banner */}
      <section className="relative bg-black text-white py-16 lg:py-24 text-center overflow-hidden">
        {/* Background Image */}
        {collectionBanners[fragrance] && (
          <div className="absolute inset-0">
            <Image
              src={collectionBanners[fragrance]}
              alt={fragrance === "all" ? "Shop collection" : `${fragrance} collection`}
              fill
              className="object-cover opacity-30"
              priority
              loading="eager"
              sizes="100vw"
            />
            {/* Dark overlay so text stays readable */}
            <div className="absolute inset-0 bg-black/60" />
          </div>
        )}

        {/* Text Content — must be relative to sit above the image */}
        <div className="relative z-10">
          <p className="text-[10px] uppercase tracking-[5px] text-white/60 mb-4">
            The Collection
          </p>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl tracking-wide mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {fragrance === "all"
              ? "Shop All"
              : fragrance.charAt(0).toUpperCase() + fragrance.slice(1)}
          </h1>
          <p className="text-white/60 text-sm max-w-md mx-auto">
            {fragrance === "all"
              ? "Explore our signature fragrances — Ruth & Proverbs — across reed diffusers, car diffusers, room sprays, and refill bottles."
              : fragrance.toLowerCase() === "ruth"
                ? "Discover the warm, devoted fragrance of Ruth across our full collection."
                : "Explore the bold, empowering fragrance of Proverbs across our full collection."}
          </p>
        </div>
      </section>

      {/* Bible Verse Banner */}
      {currentVerse && (
        <section className="bg-cream border-b border-light-gray">
          <div className="max-w-3xl mx-auto px-6 lg:px-12 py-10 lg:py-14 text-center">
            <p
              className="text-xl lg:text-2xl italic leading-relaxed text-charcoal"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {currentVerse.verse}
            </p>
            <div className="flex items-center justify-center gap-4 mt-5">
              <div className="w-8 h-[1px] bg-black/20" />
              <p className="text-[10px] uppercase tracking-[4px] text-muted">
                {currentVerse.reference}
              </p>
              <div className="w-8 h-[1px] bg-black/20" />
            </div>
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="border-b border-light-gray">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Fragrance Filter */}
            <div className="flex items-center gap-6 flex-wrap">
              <span className="text-[10px] uppercase tracking-[3px] text-muted">
                Fragrance:
              </span>
              {["all", "ruth", "proverbs"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFragrance(f)}
                  className={`text-[11px] uppercase tracking-[2px] pb-0.5 transition-all duration-300 ${fragrance === f
                    ? "text-black border-b border-black"
                    : "text-muted hover:text-black"
                    }`}
                >
                  {f === "all" ? "All" : f}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              {/* Type Filter */}
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="text-[11px] uppercase tracking-[2px] bg-transparent border border-light-gray px-4 py-2 focus:outline-none focus:border-black transition-colors cursor-pointer"
              >
                {types.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-[11px] uppercase tracking-[2px] bg-transparent border border-light-gray px-4 py-2 focus:outline-none focus:border-black transition-colors cursor-pointer"
              >
                <option value="name">Sort by Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* Results count */}
          <p className="text-[11px] uppercase tracking-[3px] text-muted mb-10">
            {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          </p>

          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p
                className="text-2xl mb-4"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                No products found
              </p>
              <p className="text-muted text-sm mb-6">
                Try adjusting your filters.
              </p>
              <button
                onClick={() => {
                  setFragrance("all");
                  setType("all");
                }}
                className="text-[11px] uppercase tracking-[3px] border-b border-black pb-1"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12 stagger-children">
              {filtered.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 4} 
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}