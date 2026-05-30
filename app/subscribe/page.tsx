"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { products } from "@/data/products";
import { formatPrice, getSalePrice, getOriginalDisplayPrice } from "@/data/products";
import Link from "next/link";

export default function SubscribePage() {
  const { user } = useAuth();
  const router = useRouter();

  const roomDiffusers = products.filter((p) => p.type === "Reed Diffuser");

  const [selectedProduct, setSelectedProduct] = useState(roomDiffusers[0]?.id || "");
  const [selectedSize, setSelectedSize] = useState(0);
  const [subscribing, setSubscribing] = useState(false);
  const [success, setSuccess] = useState(false);

  const currentProduct = roomDiffusers.find((p) => p.id === selectedProduct);
  const currentPrice = currentProduct?.sizes[selectedSize]?.price || 0;
  const discountedPrice = getSalePrice(currentPrice);   // uses your central helper
  const originalPrice = getOriginalDisplayPrice(currentPrice); // slashed price

  const handleSubscribe = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (!currentProduct) return;

    setSubscribing(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: currentProduct.id,
          productName: currentProduct.name,
          size: currentProduct.sizes[selectedSize].size,
          frequency: "quarterly",
          price: discountedPrice,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/dashboard"), 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubscribing(false);
    }
  };

  if (success) {
    return (
      <div className="page-transition pt-24 lg:pt-28 min-h-screen flex items-center">
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-8 animate-scale-in">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2
            className="text-2xl mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Subscription Active 🤍
          </h2>
          <p className="text-muted">
            Your quarterly subscription has been created. Redirecting to your
            dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition pt-24 lg:pt-28">
      {/* Hero */}
      <section className="relative py-20 lg:py-28 bg-black text-white overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <Image
            src="https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=1800&q=80"
            alt="Diffuser ambiance"
            fill
            className="object-cover"
            sizes="100vw"
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
            Fresh room diffuser delivered to your door every 3 months. No
            thinking, no running out — just a space that always smells
            beautiful.
          </p>
        </div>
      </section>

      {/* How It Works */}
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
                title: "Choose Your Scent",
                desc: "Pick your favourite room diffuser — Ruth or Proverbs — and your preferred size.",
              },
              {
                step: "02",
                title: "We Deliver Every 3 Months",
                desc: "A fresh room diffuser arrives at your door quarterly, right when your current one finishes.",
              },
              {
                step: "03",
                title: "Enjoy & Save 10%",
                desc: "Save 10% on every delivery. Cancel or pause anytime — no commitments.",
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

      {/* Subscription Builder */}
      <section className="py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <h2
              className="text-2xl lg:text-3xl tracking-wide mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Build Your Subscription
            </h2>
            <div className="luxury-divider mx-auto mt-4" />
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left: Selection */}
            <div>
              {/* Choose Product */}
              <div className="mb-8">
                <p className="text-[10px] uppercase tracking-[3px] text-muted mb-4">
                  Step 1 — Choose Your Fragrance
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {roomDiffusers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedProduct(p.id);
                        setSelectedSize(0);
                      }}
                      className={`relative border p-4 text-left transition-all ${selectedProduct === p.id
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
                      <p className="text-xs text-muted mt-0.5">Room Diffuser</p>
                      {selectedProduct === p.id && (
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

              {/* Choose Size */}
              {currentProduct && (
                <div>
                  <p className="text-[10px] uppercase tracking-[3px] text-muted mb-4">
                    Step 2 — Choose Your Size
                  </p>
                  <div className="flex gap-3">
                    {currentProduct.sizes.map((size, i) => (
                      <button
                        key={size.size}
                        onClick={() => setSelectedSize(i)}
                        className={`flex-1 px-4 py-4 border text-center transition-all ${selectedSize === i
                          ? "bg-black text-white border-black"
                          : "border-gray-200 hover:border-black"
                          }`}
                      >
                        <span className="block font-medium text-sm">
                          {size.size}
                        </span>
                        <span className="block text-xs mt-1 opacity-60">
                          <s>{formatPrice(getOriginalDisplayPrice(size.price))}</s>
                        </span>
                        <span className="block text-xs mt-0.5 font-medium">
                          {formatPrice(getSalePrice(size.price))}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Summary */}
            <div>
              <div className="bg-cream p-8 sticky top-28">
                <h3
                  className="text-lg tracking-wide mb-6"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Subscription Summary
                </h3>

                {currentProduct && (
                  <>
                    <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Product</span>
                        <span>{currentProduct.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Size</span>
                        <span>
                          {currentProduct.sizes[selectedSize].size}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Frequency</span>
                        <span>Every 3 months</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Regular Price</span>
                        <span className="line-through text-muted">
                          {formatPrice(originalPrice)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold">Per Delivery</span>
                      <span className="text-xl font-semibold">
                        {formatPrice(discountedPrice)}
                      </span>
                    </div>
                    <p className="text-xs text-green-700 mb-8">
                      You save {formatPrice(originalPrice - discountedPrice)}{" "}
                      every quarter
                    </p>

                    <button
                      onClick={handleSubscribe}
                      disabled={subscribing}
                      className="btn-luxury w-full bg-black text-white py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-all disabled:opacity-50"
                    >
                      {subscribing
                        ? "Setting Up..."
                        : user
                          ? "Start Subscription"
                          : "Sign In to Subscribe"}
                    </button>

                    <p className="text-center text-[10px] text-muted mt-4">
                      Cancel anytime · Free shipping included
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
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
                q: "How often will I receive my diffuser?",
                a: "Every 3 months (quarterly). Our room diffusers are designed to last exactly 3 months, so your new one arrives right when you need it.",
              },
              {
                q: "Can I change my fragrance?",
                a: "Yes! Contact us via WhatsApp before your next delivery date and we'll switch it for you.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Absolutely. There are no commitments. Cancel, pause, or modify your subscription at any time from your dashboard.",
              },
              {
                q: "Is shipping included?",
                a: "Yes, all subscription deliveries include free shipping anywhere in Nigeria.",
              },
              {
                q: "How much do I save?",
                a: "You save 10% on every delivery compared to one-time purchases. The savings add up beautifully over the year.",
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