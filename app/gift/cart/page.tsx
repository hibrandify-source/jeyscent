"use client";

import Link from "next/link";
import Image from "next/image";
import { useGiftCart } from "@/context/GiftCartContext";
import { getBuilderItem } from "@/data/gifting";
import { formatPrice } from "@/data/products";

export default function GiftCartPage() {
  const { items, updateQuantity, removeItem, totalPrice } = useGiftCart();

  return (
    <div className="page-transition pt-28 lg:pt-36 min-h-[70vh]">
      <div className="max-w-6xl mx-auto px-6 lg:px-12 pb-20">
        <h1 className="font-serif text-3xl lg:text-4xl tracking-wide mb-10">Your Gift Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-20 border border-gray-100">
            <p className="text-muted mb-8">Your gift cart is empty.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/personal"
                className="btn-luxury bg-black text-white px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-colors"
              >
                Shop Gifts
              </Link>
              <Link
                href="/custom/build"
                className="border border-black px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-black hover:text-white transition-colors"
              >
                Build a Hamper
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12">
            <ul className="lg:col-span-2 divide-y divide-gray-100 border-y border-gray-100">
              {items.map((item) => {
                const p = item.personalisation;
                const contents =
                  item.kind === "custom"
                    ? (item.itemIds ?? []).map((id) => getBuilderItem(id)?.name).filter(Boolean)
                    : [];
                return (
                  <li key={item.lineId} className="py-6 flex gap-5">
                    <div className="relative w-24 h-28 bg-light-gray flex-shrink-0 overflow-hidden">
                      <Image src={item.image} alt="" fill className="object-cover" sizes="96px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-4">
                        <h2 className="font-serif text-lg leading-snug">
                          {item.kind === "hamper" && item.hamperId ? (
                            <Link href={`/hampers/${item.hamperId}`} className="hover:underline underline-offset-4">
                              {item.name}
                            </Link>
                          ) : (
                            item.name
                          )}
                        </h2>
                        <p className="text-sm flex-shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                      {contents.length > 0 && (
                        <p className="text-xs text-muted mt-1">{contents.join(" · ")}</p>
                      )}
                      <div className="text-xs text-muted mt-2 space-y-0.5">
                        {p.recipientName && <p>For: {p.recipientName}</p>}
                        {p.message && <p className="italic">&ldquo;{p.message}&rdquo;</p>}
                        {p.deliveryDate && <p>Preferred delivery: {p.deliveryDate}</p>}
                        {!p.recipientName && !p.message && <p>No message card</p>}
                      </div>
                      <div className="flex items-center gap-6 mt-4">
                        <div className="flex items-center border border-gray-200">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                            className="px-3 py-1.5"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.lineId, Math.min(20, item.quantity + 1))}
                            className="px-3 py-1.5"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.lineId)}
                          className="text-[10px] uppercase tracking-[2px] text-muted hover:text-black underline underline-offset-4"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <aside className="bg-cream p-8 h-fit lg:sticky lg:top-32">
              <h2 className="font-serif text-lg tracking-wide mb-6">Summary</h2>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">Subtotal</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <p className="text-[10px] text-muted mb-8">Delivery calculated at checkout.</p>
              <Link
                href="/checkout"
                className="btn-luxury block text-center bg-black text-white py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-colors"
              >
                Checkout
              </Link>
              <Link
                href="/personal"
                className="block text-center text-[11px] uppercase tracking-[3px] text-muted hover:text-black mt-5"
              >
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
