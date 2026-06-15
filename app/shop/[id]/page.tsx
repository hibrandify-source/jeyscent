"use client";

import CloudinaryImage from "@/components/CloudinaryImage";
import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getProduct,
  formatPrice,
  getSalePrice,
  getOriginalDisplayPrice,
  products,
} from "@/data/products";
import { useCart } from "@/context/CartContext";
import ProductCard from "@/components/ProductCard";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const product = getProduct(params.id as string);
  const { addItem } = useCart();

  const [selectedSize, setSelectedSize] = useState(() => {
    if (!product) return 0;
    const firstInStock = product.sizes.findIndex((s) => s.inStock);
    return firstInStock >= 0 ? firstInStock : 0;
  });
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <div className="pt-32 pb-20 text-center page-transition">
        <h1
          className="text-3xl mb-4"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Product Not Found
        </h1>
        <p className="text-muted mb-8">
          The product you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/shop"
          className="inline-block bg-black text-white px-8 py-3 text-[11px] uppercase tracking-[3px]"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  const currentSize  = product.sizes[selectedSize];
  const basePrice    = currentSize.price;
  const salePrice    = getSalePrice(basePrice);
  const slashedPrice = getOriginalDisplayPrice(basePrice);

  const allDetailImages = [product.image, ...product.gallery];
  const detailImages = [...new Set(allDetailImages)];
  const hasMultipleDetail = detailImages.length > 1;

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
      if (diff > 0 && activeImage < detailImages.length - 1) {
        setActiveImage(activeImage + 1);
      } else if (diff < 0 && activeImage > 0) {
        setActiveImage(activeImage - 1);
      }
    }
  };

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      fragrance: product.fragrance,
      type: product.type,
      size: currentSize.size,
      price: basePrice,
      quantity,
      image: product.image,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const related = products
    .filter((p) => p.id !== product.id && p.fragrance === product.fragrance)
    .slice(0, 4);

  return (
    <div className="page-transition pt-24 lg:pt-28 bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[2px] text-muted">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-black transition-colors">
            Shop
          </Link>
          <span>/</span>
          <span className="text-black">{product.name}</span>
        </div>
      </div>

      {/* Product Detail */}
      <section className="max-w-7xl mx-auto px-0 lg:px-12 py-0 lg:py-16">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-0 lg:gap-20">

          {/* Images Column */}
          <div className="relative w-full h-[50vh] lg:h-auto flex-shrink-0 bg-gray-50 overflow-hidden">
            <div
              className="flex h-full"
              onTouchStart={hasMultipleDetail ? handleTouchStart : undefined}
              onTouchMove={hasMultipleDetail ? handleTouchMove : undefined}
              onTouchEnd={hasMultipleDetail ? handleTouchEnd : undefined}
              style={{
                transform: `translateX(-${activeImage * 100}%)`,
                transition: "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                width: `${detailImages.length * 100}%`,
              }}
            >
              {detailImages.map((img, i) => (
                <div key={i} className="relative h-full" style={{ width: `${100 / detailImages.length}%` }}>
                  <CloudinaryImage
                    publicId={img}
                    alt={product.name}
                    preset="product"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover object-center"
                  />
                </div>
              ))}
            </div>
            {/* Swipe arrows */}
            {hasMultipleDetail && (
              <>
                {activeImage > 0 && (
                  <button
                    onClick={() => setActiveImage(activeImage - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-sm transition-all"
                    aria-label="Previous image"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                )}
                {activeImage < detailImages.length - 1 && (
                  <button
                    onClick={() => setActiveImage(activeImage + 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-sm transition-all"
                    aria-label="Next image"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                )}
              </>
            )}
            {/* Dots */}
            {hasMultipleDetail && (
              <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-1.5 z-10">
                {detailImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      i === activeImage ? "bg-white w-3" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
            {/* Fragrance Badge */}
            <div className="absolute top-5 left-5 z-10">
              <span className="bg-white/90 backdrop-blur-sm px-4 py-2 text-[10px] uppercase tracking-[3px] shadow-sm">
                {product.fragrance}
              </span>
            </div>
            {/* Discount Badge */}
            <div className="absolute top-5 right-5 z-10">
              <span className="bg-black text-white px-3 py-1.5 text-[10px] uppercase tracking-[2px]">
                10% off
              </span>
            </div>
          </div>

          {/* Info Column */}
          <div className="relative z-10 w-full bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] -mt-10 px-6 pt-12 pb-12 lg:mt-0 lg:rounded-none lg:shadow-none lg:px-0 lg:pt-8 lg:pb-0 lg:bg-transparent">

            <p className="text-[10px] uppercase tracking-[5px] text-muted mb-3">
              {product.type} · {product.fragrance}
            </p>

            <h1
              className="text-3xl lg:text-4xl tracking-wide mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {product.name}
            </h1>

            {/* Price block */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-2xl font-semibold text-black">
                {formatPrice(salePrice)}
              </span>
              <span className="text-base text-muted line-through">
                {formatPrice(slashedPrice)}
              </span>
              <span className="text-[10px] bg-black text-white px-2 py-1 uppercase tracking-[2px]">
                10% off
              </span>
            </div>

            <div className="luxury-divider mb-6" />

            <p className="text-muted leading-relaxed mb-8">
              {product.longDescription}
            </p>

            {/* Size Selector */}
            <div className="mb-8">
              <p className="text-[10px] uppercase tracking-[3px] text-muted mb-4">
                Size
              </p>
              <div className="flex gap-3 flex-wrap">
                {product.sizes.map((size, i) => {
                  const sizeSale = getSalePrice(size.price);
                  return (
                    <button
                      key={size.size}
                      onClick={() => size.inStock && setSelectedSize(i)}
                      disabled={!size.inStock}
                      className={`px-6 py-3 border text-sm transition-all duration-300 min-w-[100px]
                        ${!size.inStock
                          ? "border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50 relative"
                          : selectedSize === i
                            ? "bg-black text-white border-black shadow-md"
                            : "border-gray-200 text-charcoal hover:border-black bg-white"
                        }`}
                    >
                      <span className="block font-medium">{size.size}</span>
                      <span className="block text-[10px] mt-0.5 opacity-70">
                        {size.inStock ? formatPrice(sizeSale) : "Sold Out"}
                      </span>
                      {!size.inStock && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-full h-[1px] bg-gray-300 rotate-[-20deg]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-8">
              <p className="text-[10px] uppercase tracking-[3px] text-muted mb-4">
                Quantity
              </p>
              <div className="flex items-center border border-gray-200 w-fit bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <span className="w-14 h-12 flex items-center justify-center text-sm border-x border-gray-200">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={!currentSize?.inStock}
              className={`btn-luxury w-full py-4 text-[11px] uppercase tracking-[4px] transition-all duration-500 mb-3
                ${!currentSize?.inStock
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : added
                    ? "bg-green-800 text-white"
                    : "bg-black text-white hover:bg-charcoal"
                }`}
            >
              {!currentSize?.inStock
                ? "Sold Out"
                : added
                  ? "✓ Added to Bag"
                  : "Add to Bag"}
            </button>

            {/* Buy Now */}
            <button
              onClick={() => {
                handleAddToCart();
                router.push("/cart");
              }}
              className="w-full py-4 border border-black text-[11px] uppercase tracking-[4px] hover:bg-black hover:text-white transition-all duration-500 bg-white"
            >
              Buy Now
            </button>

            {/* Features */}
            <div className="mt-10 pt-8 border-t border-light-gray">
              <div className="grid grid-cols-2 gap-4">
                {product.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0 text-black">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-sm text-muted">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="mt-6 p-4 bg-cream/50 rounded-lg">
              <div className="flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-black">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="text-sm text-gray-800">{product.duration}</span>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="mt-8 space-y-3 text-sm text-muted">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <span>Free shipping on Lagos orders above ₦{FREE_SHIPPING_THRESHOLD.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Lagos delivery: Same day – 1 business day</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Outside Lagos: Shipped to nearest bus park (₦3,500)</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Exact fee calculated at checkout based on your area</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Thumbnail Gallery */}
      {detailImages.length > 1 && (
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
          <div className="flex gap-3">
            {detailImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`relative w-16 h-20 overflow-hidden border-2 transition-all ${
                  activeImage === i ? "border-black" : "border-transparent"
                }`}
              >
                <CloudinaryImage
                  publicId={img}
                  alt={`${product.name} view ${i + 1}`}
                  preset="card"
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Related Products */}
      {related.length > 0 && (
        <section className="py-16 lg:py-24 bg-cream">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-[10px] uppercase tracking-[5px] text-muted mb-3">
                  You May Also Like
                </p>
                <h2
                  className="text-2xl lg:text-3xl tracking-wide"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  More from {product.fragrance}
                </h2>
              </div>
              <Link
                href="/shop"
                className="hidden sm:block text-[11px] uppercase tracking-[3px] border-b border-charcoal pb-1 hover:text-muted transition-colors"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
