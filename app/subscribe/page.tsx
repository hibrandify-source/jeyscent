"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import {
  products,
  formatPrice,
  getBasePrice,
} from "@/data/products";

// ── Subscription config ───────────────────────────────────────────────────────
const FREQUENCY_MONTHS = 2;
const SUBSCRIPTION_DISCOUNT = 0.90; // 10% off for subscribers

const getSubPrice = (storePrice: number) =>
  Math.round(getBasePrice(storePrice) * SUBSCRIPTION_DISCOUNT);
const FREQUENCY_LABEL = "Every 2 months";
const FREQUENCY_VALUE = "bimonthly";

// ── Product types available for subscription ──────────────────────────────────
const SUBSCRIPTION_TYPES = ["Reed Diffuser", "Refill Bottle"] as const;
type SubscriptionType = (typeof SUBSCRIPTION_TYPES)[number];

// ── Types ─────────────────────────────────────────────────────────────────────
interface SubscriptionLineItem {
  id: string;
  productId: string;
  productName: string;
  productType: string;
  fragrance: string;
  size: string;
  quantity: number;
  unitPrice: number;
  originalUnitPrice: number;
  image: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const lineItemId = (productId: string, size: string) =>
  `${productId}__${size}`;

export default function SubscribePage() {
  const { user } = useAuth();
  const router = useRouter();

  // ── State ─────────────────────────────────────────────────────────────────
  const [activeType, setActiveType] =
    useState<SubscriptionType>("Reed Diffuser");
  const [previewProductId, setPreviewProductId] = useState(
    () => products.find((p) => p.type === "Reed Diffuser")?.id || ""
  );
  const [previewSizeIndex, setPreviewSizeIndex] = useState(0);
  const [previewQty, setPreviewQty] = useState(1);
  const [basket, setBasket] = useState<SubscriptionLineItem[]>([]);

  // ── Clear stale subscription data on mount ────────────────────────────────
  useEffect(() => {
    // Always clear when user lands on subscribe page
    // sessionStorage is cleared automatically when tab/browser closes
    sessionStorage.removeItem("jeyscent_sub_session");
    localStorage.removeItem("jeyscent_subscription");
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const filteredProducts = products.filter((p) => p.type === activeType);
  const previewProduct = products.find((p) => p.id === previewProductId);
  const previewSize = previewProduct?.sizes[previewSizeIndex];
  const previewUnitPrice = previewSize
    ? getSubPrice(previewSize.price)
    : 0;
  const previewOriginalPrice = previewSize
    ? getBasePrice(previewSize.price)
    : 0;

  // ── Basket totals ─────────────────────────────────────────────────────────
  const basketTotal = basket.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const basketOriginalTotal = basket.reduce(
    (sum, item) => sum + item.originalUnitPrice * item.quantity,
    0
  );
  const basketSavings = basketOriginalTotal - basketTotal;
  const basketTotalUnits = basket.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleTypeChange = (type: SubscriptionType) => {
    setActiveType(type);
    const first = products.find((p) => p.type === type);
    if (first) {
      setPreviewProductId(first.id);
      setPreviewSizeIndex(0);
    }
    setPreviewQty(1);
  };

  const handleAddToSubscription = () => {
    if (!previewProduct || !previewSize) return;

    const id = lineItemId(previewProduct.id, previewSize.size);

    setBasket((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        return prev.map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity + previewQty }
            : item
        );
      }
      return [
        ...prev,
        {
          id,
          productId: previewProduct.id,
          productName: previewProduct.name,
          productType: previewProduct.type,
          fragrance: previewProduct.fragrance,
          size: previewSize.size,
          quantity: previewQty,
          unitPrice: previewUnitPrice,
          originalUnitPrice: previewOriginalPrice,
          image: previewProduct.sizeImages?.[previewSize.size]?.image ?? previewProduct.image,
        },
      ];
    });

    setPreviewQty(1);
  };

  const handleUpdateBasketQty = (id: string, delta: number) => {
    setBasket((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleSetBasketQty = (id: string, value: number) => {
    const qty = Math.max(1, value);
    setBasket((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: qty } : item
      )
    );
  };

  const handleRemoveFromBasket = (id: string) => {
    setBasket((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubscribe = () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (basket.length === 0) return;

    // ── Generate a unique session ID for this subscription attempt ──────────
    const sessionId = `sub_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    localStorage.setItem(
      "jeyscent_subscription",
      JSON.stringify({
        sessionId,                 // ← unique per "Start Subscription" click
        items: basket,
        frequency: FREQUENCY_VALUE,
        frequencyLabel: FREQUENCY_LABEL,
        frequencyMonths: FREQUENCY_MONTHS,
        totalPrice: basketTotal,
        totalUnits: basketTotalUnits,
        savedAt: Date.now(),
      })
    );

    // ── Write the active session ID separately ───────────────────────────────
    // Checkout page checks this matches before trusting the subscription data
    sessionStorage.setItem("jeyscent_sub_session", sessionId);

    router.push("/checkout/subscription");
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page-transition pt-24 lg:pt-28">
      {/* ── Hero ── */}
      <section className="relative py-20 lg:py-28 bg-black text-white overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <Image
            src="https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1780227723/IG2_ijxi4d.jpg"
            alt="Diffuser ambiance"
            fill
            className="object-cover"
            sizes="100vw"
            unoptimized
          />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <p className="text-[10px] uppercase tracking-[6px] text-white/50 mb-5">
            Never Run Out
          </p>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl tracking-wide mb-5"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Subscribe & Save 10%
          </h1>
          <p className="text-white/50 max-w-xl mx-auto leading-relaxed">
            Fresh fragrance delivered to your door every 2 months. Mix
            fragrances, sizes, and product types — all in one subscription.
          </p>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-16 lg:py-24 bg-cream">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <h2
              className="text-2xl lg:text-3xl tracking-wide mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              How It Works
            </h2>
            <div className="luxury-divider mx-auto mt-4" />
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                step: "01",
                title: "Build Your Box",
                desc: "Mix and match fragrances, product types, sizes, and quantities freely. Add as many as you like.",
              },
              {
                step: "02",
                title: "We Deliver Every 2 Months",
                desc: "Your full box arrives at your door every 2 months, right when your current ones finish.",
              },
              {
                step: "03",
                title: "Enjoy & Save 10%",
                desc: "Save 10% on every item in every delivery. Cancel or pause anytime — no commitments.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <span
                  className="text-4xl text-muted/20 block mb-4"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {item.step}
                </span>
                <h3
                  className="text-lg mb-3 tracking-wide"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {item.title}
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Subscription Builder ── */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <h2
              className="text-2xl lg:text-3xl tracking-wide mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Build Your Subscription
            </h2>
            <div className="luxury-divider mx-auto mt-4" />
          </div>

          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
            {/* ── Left col: product picker ── */}
            <div className="lg:col-span-3 space-y-10">

              {/* Step 1 — Product Type */}
              <div>
                <p className="text-[10px] uppercase tracking-[3px] text-muted mb-4">
                  Step 1 — Choose Product Type
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {SUBSCRIPTION_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleTypeChange(type)}
                      className={`border px-4 py-4 text-left transition-all duration-200 ${activeType === type
                        ? "border-black bg-black text-white"
                        : "border-gray-200 hover:border-gray-400"
                        }`}
                    >
                      <p className="text-sm font-semibold mb-1">{type}</p>
                      <p
                        className={`text-[10px] leading-relaxed ${activeType === type ? "text-white/60" : "text-muted"
                          }`}
                      >
                        {type === "Reed Diffuser"
                          ? "Full set with reeds & bottle."
                          : "Just the oil. Reuse your vessel."}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2 — Choose Fragrance */}
              <div>
                <p className="text-[10px] uppercase tracking-[3px] text-muted mb-4">
                  Step 2 — Choose Fragrance
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPreviewProductId(p.id);
                        setPreviewSizeIndex(0);
                      }}
                      className={`relative border p-4 text-left transition-all ${previewProductId === p.id
                        ? "border-black bg-cream"
                        : "border-gray-200 hover:border-gray-400"
                        }`}
                    >
                      <div className="relative aspect-square mb-3 overflow-hidden bg-light-gray">
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          className="object-cover"
                          sizes="200px"
                        />
                      </div>
                      <p
                        className="text-sm font-medium"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {p.fragrance}
                      </p>
                      <p className="text-xs text-muted mt-0.5">{p.type}</p>
                      {previewProductId === p.id && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3 — Choose Size */}
              {previewProduct && (
                <div>
                  <p className="text-[10px] uppercase tracking-[3px] text-muted mb-4">
                    Step 3 — Choose Size
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    {previewProduct.sizes.map((size, i) => (
                      <button
                        key={size.size}
                        onClick={() => setPreviewSizeIndex(i)}
                        className={`flex-1 min-w-[100px] px-4 py-4 border text-center transition-all ${previewSizeIndex === i
                          ? "bg-black text-white border-black"
                          : "border-gray-200 hover:border-black"
                          }`}
                      >
                        <span className="block font-medium text-sm">
                          {size.size}
                        </span>
                        <span className="block text-xs mt-1 opacity-60">
                          <s>
                            {formatPrice(getBasePrice(size.price))}
                          </s>
                        </span>
                        <span className="block text-xs mt-0.5 font-medium">
                          {formatPrice(getSubPrice(size.price))}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4 — Quantity + Add */}
              {previewProduct && previewSize && (
                <div>
                  <p className="text-[10px] uppercase tracking-[3px] text-muted mb-4">
                    Step 4 — Set Quantity & Add
                  </p>

                  <div className="flex items-center gap-4 mb-5">
                    <div className="flex items-center border border-gray-200">
                      <button
                        onClick={() =>
                          setPreviewQty((q) => Math.max(1, q - 1))
                        }
                        disabled={previewQty <= 1}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>

                      <input
                        type="number"
                        min={1}
                        value={previewQty}
                        onChange={(e) =>
                          setPreviewQty(
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        }
                        className="w-14 h-10 text-center text-sm font-semibold border-x border-gray-200 focus:outline-none appearance-none"
                      />

                      <button
                        onClick={() => setPreviewQty((q) => q + 1)}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                    </div>

                    <div className="text-sm text-muted">
                      <span className="font-medium text-black">
                        {formatPrice(previewUnitPrice * previewQty)}
                      </span>
                      {previewQty > 1 && (
                        <span className="text-xs ml-1">
                          ({formatPrice(previewUnitPrice)} × {previewQty})
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleAddToSubscription}
                    className="w-full border-2 border-black py-3.5 text-[11px] uppercase tracking-[4px] hover:bg-black hover:text-white transition-all duration-200 font-medium"
                  >
                    + Add to Subscription
                  </button>

                  {basket.some(
                    (item) =>
                      item.id ===
                      lineItemId(previewProduct.id, previewSize.size)
                  ) && (
                      <p className="text-[10px] text-green-700 text-center mt-2">
                        ✓ Already in your subscription — adding more will
                        increase the quantity.
                      </p>
                    )}
                </div>
              )}
            </div>

            {/* ── Right col: subscription basket ── */}
            <div className="lg:col-span-2">
              <div className="bg-cream p-8 sticky top-28">
                <div className="flex items-center justify-between mb-6">
                  <h3
                    className="text-lg tracking-wide"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Your Subscription
                  </h3>
                  {basket.length > 0 && (
                    <span className="text-[10px] uppercase tracking-[2px] text-muted">
                      {basketTotalUnits}{" "}
                      {basketTotalUnits === 1 ? "item" : "items"}
                    </span>
                  )}
                </div>

                {/* Empty state */}
                {basket.length === 0 && (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 border border-dashed border-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="text-gray-300"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </div>
                    <p className="text-sm text-muted">No items yet.</p>
                    <p className="text-xs text-muted mt-1">
                      Pick a product and click{" "}
                      <strong>Add to Subscription</strong>.
                    </p>
                  </div>
                )}

                {/* Basket line items */}
                {basket.length > 0 && (
                  <div className="space-y-4 mb-6 pb-6 border-b border-gray-200 max-h-[360px] overflow-y-auto pr-1">
                    {basket.map((item) => (
                      <div key={item.id} className="flex gap-3 items-start">
                        <div className="relative w-12 h-14 overflow-hidden bg-light-gray flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.productName}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {item.fragrance} {item.productType}
                          </p>
                          <p className="text-[10px] text-muted">{item.size}</p>

                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() =>
                                handleUpdateBasketQty(item.id, -1)
                              }
                              disabled={item.quantity <= 1}
                              className="w-6 h-6 border border-gray-200 flex items-center justify-center text-xs hover:border-black transition-colors disabled:opacity-30"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                handleSetBasketQty(
                                  item.id,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-10 h-6 text-center text-xs border border-gray-200 focus:outline-none focus:border-black appearance-none"
                            />
                            <button
                              onClick={() =>
                                handleUpdateBasketQty(item.id, 1)
                              }
                              className="w-6 h-6 border border-gray-200 flex items-center justify-center text-xs hover:border-black transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <p className="text-xs font-semibold">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </p>
                          <p className="text-[10px] text-muted line-through">
                            {formatPrice(
                              item.originalUnitPrice * item.quantity
                            )}
                          </p>
                          <button
                            onClick={() => handleRemoveFromBasket(item.id)}
                            className="text-[10px] text-red-400 hover:text-red-600 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Totals */}
                {basket.length > 0 && (
                  <>
                    <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Subtotal</span>
                        <span>{formatPrice(basketOriginalTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">
                          Subscription discount (10%)
                        </span>
                        <span className="text-green-700">
                          − {formatPrice(basketSavings)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Delivery</span>
                        <span className="italic text-muted">At checkout</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Frequency</span>
                        <span>{FREQUENCY_LABEL}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Per Delivery</span>
                      <span className="text-xl font-semibold">
                        {formatPrice(basketTotal)}
                      </span>
                    </div>

                    <p className="text-[10px] text-muted leading-relaxed mb-1">
                      + delivery fee calculated at checkout.{" "}
                      <span className="text-green-700">
                        Free delivery within Lagos on orders up to ₦200,000.
                      </span>
                    </p>

                    <p className="text-xs text-green-700 mb-6">
                      You save {formatPrice(basketSavings)} every{" "}
                      {FREQUENCY_MONTHS} months
                    </p>

                    {basket.some(
                      (item) => item.productType === "Refill Bottle"
                    ) && (
                        <div className="mb-5 p-3 bg-amber-50 border border-amber-100 text-amber-800 text-xs leading-relaxed">
                          💡 <strong>Refill tip:</strong> Compatible with all
                          JeyScent vessels. Just pour and reuse.
                        </div>
                      )}

                    <button
                      onClick={handleSubscribe}
                      className="btn-luxury w-full bg-black text-white py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-all"
                    >
                      {user ? "Start Subscription" : "Sign In to Subscribe"}
                    </button>

                    <p className="text-center text-[10px] text-muted mt-4">
                      Cancel anytime · No commitments
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 lg:py-24 bg-black text-white">
        <div className="max-w-3xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <h2
              className="text-2xl lg:text-3xl tracking-wide"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Common Questions
            </h2>
            <div className="luxury-divider-gold mx-auto mt-6" />
          </div>

          <div className="space-y-6">
            {[
              {
                q: "How often will I receive my order?",
                a: "Every 2 months (bi-monthly). Your full subscription box arrives right when your current ones run out.",
              },
              {
                q: "Can I mix different fragrances and product types?",
                a: "Absolutely. You can add Ruth and Proverbs, Reed Diffusers and Refill Bottles, different sizes — all in one subscription box.",
              },
              {
                q: "Is there a limit on how many items I can add?",
                a: "No limit at all. Add as many products and quantities as you need — the more you subscribe for, the more you save.",
              },
              {
                q: "What's the difference between a Reed Diffuser and Refill Bottle subscription?",
                a: "Reed Diffuser includes the glass bottle, reeds, and oil. Refill Bottle is just the oil — perfect if you already have a JeyScent vessel.",
              },
              {
                q: "Can I change my items, quantities or sizes later?",
                a: "Yes! Contact us via WhatsApp before your next delivery date and we'll update your subscription.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Absolutely. No commitments. Cancel, pause, or modify from your dashboard at any time.",
              },
              {
                q: "Is shipping included?",
                a: "Delivery is free within Lagos on subscription orders up to ₦200,000. For orders outside Lagos or above ₦200,000, a delivery fee will be calculated at checkout based on your location.",
              },
              {
                q: "How much do I save?",
                a: "10% off every unit in every delivery. The more items you subscribe for, the more you save each cycle.",
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group border-b border-white/10 pb-6"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="text-sm lg:text-base pr-8">{faq.q}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="flex-shrink-0 transition-transform duration-300 group-open:rotate-45"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </summary>
                <p className="mt-4 text-white/50 text-sm leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}