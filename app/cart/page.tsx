"use client";

import { useCart } from "@/context/CartContext";
import { formatPrice, getSalePrice } from "@/data/products";
import Image from "next/image";
import Link from "next/link";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="page-transition pt-24 lg:pt-28">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 py-20 lg:py-32 text-center">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="mx-auto mb-8 text-muted"
          >
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          <h1
            className="text-3xl mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Your Bag is Empty
          </h1>
          <p className="text-muted mb-8 max-w-md mx-auto">
            Looks like you haven&apos;t added anything to your bag yet.
            Explore our collection and find something beautiful.
          </p>
          <Link
            href="/shop"
            className="btn-luxury inline-block bg-black text-white px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-all"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // ✅ Free shipping threshold for the incentive bar only — not added to total
  const FREE_SHIPPING_THRESHOLD = 200000;
  const qualifiesForFreeShipping = totalPrice >= FREE_SHIPPING_THRESHOLD;
  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - totalPrice;
  const progressPercent = Math.min((totalPrice / FREE_SHIPPING_THRESHOLD) * 100, 100);

  return (
    <div className="page-transition pt-24 lg:pt-28">
      {/* Header */}
      <div className="bg-black text-white py-10 lg:py-14 text-center">
        <h1
          className="text-3xl lg:text-4xl tracking-wide"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Your Bag
        </h1>
        <p className="text-white/40 text-sm mt-2">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-12 lg:py-16">
        <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">

          {/* Cart Items */}
          <div className="lg:col-span-2">

            {/* ✅ Free Shipping Bar — incentive only, not calculated in total */}
            <div className="mb-8 p-4 bg-cream text-center">
              {qualifiesForFreeShipping ? (
                <p className="text-sm text-green-700 font-medium">
                  🎉 You qualify for free shipping within Lagos!
                </p>
              ) : (
                <p className="text-sm text-muted">
                  Add{" "}
                  <span className="font-semibold text-black">
                    {formatPrice(amountToFreeShipping)}
                  </span>{" "}
                  more to qualify for free shipping within Lagos
                </p>
              )}
              <div className="mt-2 bg-gray-200 h-1 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    qualifiesForFreeShipping ? "bg-green-600" : "bg-black"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Table Header */}
            <div className="hidden lg:grid grid-cols-[2fr,1fr,1fr,auto] gap-6 pb-4 border-b border-light-gray text-[10px] uppercase tracking-[3px] text-muted">
              <span>Product</span>
              <span className="text-center">Quantity</span>
              <span className="text-right">Total</span>
              <span className="w-8" />
            </div>

            {/* Items */}
            <div className="divide-y divide-light-gray">
              {items.map((item) => {
                const itemSalePrice = getSalePrice(item.price);

                return (
                  <div
                    key={`${item.productId}-${item.size}`}
                    className="py-6 grid grid-cols-[80px,1fr] lg:grid-cols-[2fr,1fr,1fr,auto] gap-4 lg:gap-6 items-center"
                  >
                    {/* Product Info */}
                    <div className="flex gap-4 col-span-1 lg:col-span-1">
                      <div className="relative w-20 h-24 lg:w-24 lg:h-28 overflow-hidden bg-light-gray flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </div>
                      <div className="hidden lg:block">
                        <Link
                          href={`/shop/${item.productId}`}
                          className="text-sm font-medium hover:text-muted transition-colors"
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs text-muted mt-1">{item.size}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-medium">
                            {formatPrice(itemSalePrice)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mobile info + Qty + Total */}
                    <div className="lg:contents space-y-3 lg:space-y-0">
                      {/* Mobile product name */}
                      <div className="lg:hidden">
                        <Link
                          href={`/shop/${item.productId}`}
                          className="text-sm font-medium"
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs text-muted mt-0.5">{item.size}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-medium">
                            {formatPrice(itemSalePrice)}
                          </span>
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center justify-start lg:justify-center">
                        <div className="flex items-center border border-gray-200">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.size,
                                item.quantity - 1
                              )
                            }
                            className="w-9 h-9 flex items-center justify-center hover:bg-light-gray transition-colors text-sm"
                          >
                            −
                          </button>
                          <span className="w-10 h-9 flex items-center justify-center text-sm border-x border-gray-200">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.size,
                                item.quantity + 1
                              )
                            }
                            className="w-9 h-9 flex items-center justify-center hover:bg-light-gray transition-colors text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Line total at sale price */}
                      <p className="text-sm text-right font-medium">
                        {formatPrice(itemSalePrice * item.quantity)}
                      </p>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.productId, item.size)}
                        className="w-8 h-8 flex items-center justify-center text-muted hover:text-red-500 transition-colors"
                        aria-label="Remove item"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Continue Shopping */}
            <div className="mt-8">
              <Link
                href="/shop"
                className="text-[11px] uppercase tracking-[3px] text-muted hover:text-black border-b border-muted hover:border-black pb-1 transition-all"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-cream p-8 sticky top-28">
              <h3
                className="text-lg tracking-wide mb-6"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Order Summary
              </h3>

              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                {/* ✅ Show delivery as pending — not calculated yet */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Delivery</span>
                  <span className="text-xs text-muted italic">
                    {qualifiesForFreeShipping
                      ? "Free (Lagos)"
                      : "At checkout"}
                  </span>
                </div>
              </div>

              {/* ✅ Total = subtotal only — no shipping added */}
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-semibold">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <p className="text-[10px] text-muted mb-8">
                + delivery (calculated at checkout)
              </p>

              <Link
                href="/checkout"
                className="btn-luxury block w-full bg-black text-white text-center py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-all"
              >
                Proceed to Checkout
              </Link>

              <p className="text-center text-[10px] text-muted mt-4 leading-relaxed">
                Secure checkout powered by QorePay.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}