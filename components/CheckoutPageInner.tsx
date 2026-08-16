"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/data/products";
import { getShippingFee, shippingZones } from "@/lib/shipping";
import { initiateCheckout, addPaymentInfo } from "@/components/MetaPixel";
import ShippingCalculator from "@/components/ShippingCalculator";
import Image from "next/image";

type DeliveryMethod = "delivery" | "pickup";

interface SubscriptionData {
  sessionId?: string;
  items?: {
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
  }[];
  totalPrice?: number;
  totalUnits?: number;
  frequency?: string;
  frequencyLabel?: string;
  frequencyMonths?: number;
  savedAt?: number;
  // legacy
  productId?: string;
  productName?: string;
  productType?: string;
  fragrance?: string;
  size?: string;
  quantity?: number;
  price?: number;
  unitPrice?: number;
  image?: string;
}

interface CheckoutItem {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  image: string;
}

interface Props {
  isSubscription: boolean; // ← passed as prop, no URL parsing
}

const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti",
  "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

export default function CheckoutPageInner({ isSubscription }: Props) {
  const { items, totalPrice: cartTotal } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── State ─────────────────────────────────────────────────────────────────
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("delivery");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    area: "",
    city: "",
    state: "",
  });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [createAccount, setCreateAccount] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  // ── Load subscription data on mount ──────────────────────────────────────
  useEffect(() => {
    if (isSubscription) {
      const raw = localStorage.getItem("jeyscent_subscription");
      const activeSession = sessionStorage.getItem("jeyscent_sub_session");

      if (!raw) {
        router.push("/subscribe");
        return;
      }

      try {
        const parsed = JSON.parse(raw);

        // Validate session ID
        if (!activeSession || parsed.sessionId !== activeSession) {
          localStorage.removeItem("jeyscent_subscription");
          router.push("/subscribe");
          return;
        }

        // Validate age (2 hours)
        if (parsed.savedAt && Date.now() - parsed.savedAt > 7_200_000) {
          localStorage.removeItem("jeyscent_subscription");
          sessionStorage.removeItem("jeyscent_sub_session");
          router.push("/subscribe");
          return;
        }

        setSubscriptionData(parsed);
      } catch {
        localStorage.removeItem("jeyscent_subscription");
        router.push("/subscribe");
        return;
      }
    } else {
      // Regular checkout — always wipe stale subscription data
      localStorage.removeItem("jeyscent_subscription");
      sessionStorage.removeItem("jeyscent_sub_session");
    }

    setIsChecking(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Pre-fill from logged-in user ──────────────────────────────────────────
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.name,
        email: prev.email || user.email,
      }));
    }
  }, [user]);

  // ── Failed payment banner ─────────────────────────────────────────────────
  useEffect(() => {
    if (searchParams.get("payment") === "failed") {
      setError(
        "Payment was not completed. Please try again or contact support."
      );
    }
  }, [searchParams]);

  // ── Redirect to cart if no items (regular only) ───────────────────────────
  useEffect(() => {
    if (!isSubscription) {
      if (items.length === 0 && !processing) {
        const saved = localStorage.getItem("jeyscent_checkout");
        if (!saved) {
          router.push("/cart");
          return;
        }
      }
      setIsChecking(false);
    }
  }, [isSubscription, items, router, processing]);

  // ── Checkout items ────────────────────────────────────────────────────────
  const checkoutItems: CheckoutItem[] = useMemo(() => {
    if (isSubscription && subscriptionData) {
      if (Array.isArray(subscriptionData.items)) {
        return subscriptionData.items.map((item) => ({
          productId: item.productId,
          name: item.productName,
          size: item.size,
          quantity: item.quantity ?? 1,
          price: item.unitPrice ?? 0,
          image: item.image || "",
        }));
      }
      return [
        {
          productId: subscriptionData.productId || "",
          name: subscriptionData.productName || "",
          size: subscriptionData.size || "",
          quantity: subscriptionData.quantity ?? 1,
          price: subscriptionData.unitPrice ?? subscriptionData.price ?? 0,
          image: subscriptionData.image || "",
        },
      ];
    }
    return items.map((item) => ({
      productId: item.productId,
      name: item.name,
      size: item.size,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
    }));
  }, [isSubscription, subscriptionData, items]);

  // ── Total price ───────────────────────────────────────────────────────────
  const totalPrice = useMemo(() => {
    if (isSubscription && subscriptionData) {
      if (Array.isArray(subscriptionData.items)) {
        return subscriptionData.items.reduce(
          (sum, item) => sum + (item.unitPrice ?? 0) * (item.quantity ?? 1),
          0
        );
      }
      return subscriptionData.totalPrice ?? subscriptionData.price ?? 0;
    }
    return cartTotal ?? 0;
  }, [isSubscription, subscriptionData, cartTotal]);

  // ── Shipping ──────────────────────────────────────────────────────────────
  const shipping = useMemo(() => {
    if (deliveryMethod === "pickup") {
      return { fee: 0, freeShipping: false, isParkPickup: false, zone: null };
    }
    return getShippingFee(form.area, totalPrice);
  }, [form.area, totalPrice, deliveryMethod]);

  // ── Grand total ───────────────────────────────────────────────────────────
  const grandTotal = (totalPrice ?? 0) + (shipping?.fee ?? 0);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleUpdate = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!form.name || !form.email || !form.phone) {
      setError("Please fill in your name, email and phone number");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError("Please enter a valid email");
      return false;
    }
    if (form.phone.length < 10) {
      setError("Please enter a valid phone number");
      return false;
    }
    if (deliveryMethod === "delivery") {
      if (!isSubscription) {
        if (!form.address || !form.area || !form.city || !form.state) {
          setError("Please fill in all delivery address fields");
          return false;
        }
      } else {
        if (!form.address || !form.city || !form.state) {
          setError("Please fill in your delivery address");
          return false;
        }
      }
    }
    return true;
  };

  const handleProceedToPayment = async () => {
    setError("");
    if (!validateForm()) return;
    setProcessing(true);

    try {
      const checkoutData = {
        form,
        deliveryMethod,
        isSubscription,
        items: checkoutItems,
        totalPrice,
        grandTotal,
        shippingFee: shipping.fee,
        isParkPickup: shipping.isParkPickup,
        deliveryEstimate:
          deliveryMethod === "pickup"
            ? "Customer arranges pickup"
            : shipping.zone?.estimatedDays || "",
        createAccount,
        savedAt: Date.now(),
      };

      localStorage.setItem("jeyscent_checkout", JSON.stringify(checkoutData));

      const numItems = checkoutItems.reduce((sum, i) => sum + i.quantity, 0);

      initiateCheckout({
        content_ids: checkoutItems.map((i) => i.productId),
        content_type: "product",
        num_items: numItems,
        value: grandTotal,
        currency: "NGN",
      });

      addPaymentInfo({
        content_ids: checkoutItems.map((i) => i.productId),
        content_type: "product",
        num_items: numItems,
        value: grandTotal,
        currency: "NGN",
      });

      const res = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: grandTotal,
          email: form.email,
          name: form.name,
          checkoutData,
          metadata: {
            customer_phone: form.phone,
            ...(isSubscription && subscriptionData && { subscriptionData }),
          },
        }),
      });

      const data = await res.json();

      if (res.ok && data.authorization_url) {
        const updated = { ...checkoutData, paymentRef: data.reference };
        localStorage.setItem("jeyscent_checkout", JSON.stringify(updated));
        window.location.href = data.authorization_url;
      } else {
        setError(data.error || "Failed to initialize payment. Please try again.");
        setProcessing(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setProcessing(false);
    }
  };

  // ── Loading guard ─────────────────────────────────────────────────────────
  if (isChecking || (isSubscription && !subscriptionData)) {
    return (
      <div className="pt-32 pb-20 text-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page-transition pt-24 lg:pt-28">
      {/* Header */}
      <div className="bg-black text-white py-10 lg:py-14 text-center">
        <h1
          className="text-3xl lg:text-4xl tracking-wide"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {isSubscription ? "Subscribe & Save" : "Checkout"}
        </h1>
        {!user && (
          <p className="text-white/40 text-sm mt-2">
            Already have an account?{" "}
            <a
              href="/auth/login"
              className="text-white/70 underline underline-offset-4 hover:text-white transition-colors"
            >
              Sign in
            </a>
          </p>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-12 lg:py-16">
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-700 text-sm text-center">
            {error}
          </div>
        )}
        {processing && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-100 text-blue-700 text-sm text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Connecting to payment gateway...
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
          {/* ── Left: Form ── */}
          <div className="lg:col-span-3">

            {/* Personal Info */}
            <div className="mb-10">
              <h3
                className="text-lg tracking-wide mb-6"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Your Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[3px] text-muted mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleUpdate("name", e.target.value)}
                    className="w-full border border-gray-200 px-4 py-3.5 text-sm focus:outline-none focus:border-black transition-colors"
                    placeholder="Your full name"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[3px] text-muted mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleUpdate("email", e.target.value)}
                      className="w-full border border-gray-200 px-4 py-3.5 text-sm focus:outline-none focus:border-black transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[3px] text-muted mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleUpdate("phone", e.target.value)}
                      className="w-full border border-gray-200 px-4 py-3.5 text-sm focus:outline-none focus:border-black transition-colors"
                      placeholder="08012345678"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Method */}
            <div className="mb-10">
              <h3
                className="text-lg tracking-wide mb-6"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Delivery Method
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("delivery")}
                  className={`relative border p-5 text-left transition-all duration-200 ${
                    deliveryMethod === "delivery"
                      ? "border-black bg-black text-white"
                      : "border-gray-200 hover:border-gray-400 bg-white"
                  }`}
                >
                  {deliveryMethod === "delivery" && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                  <p className="text-sm font-semibold mb-1">We Deliver</p>
                  <p className={`text-xs leading-relaxed ${deliveryMethod === "delivery" ? "text-white/60" : "text-muted"}`}>
                    We bring it to your door. Fee calculated by area.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMethod("pickup")}
                  className={`relative border p-5 text-left transition-all duration-200 ${
                    deliveryMethod === "pickup"
                      ? "border-black bg-black text-white"
                      : "border-gray-200 hover:border-gray-400 bg-white"
                  }`}
                >
                  {deliveryMethod === "pickup" && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <p className="text-sm font-semibold mb-1">My Rider / Pickup</p>
                  <p className={`text-xs leading-relaxed ${deliveryMethod === "pickup" ? "text-white/60" : "text-muted"}`}>
                    Send your rider or pick up yourself. No delivery fee.
                  </p>
                </button>
              </div>

              {deliveryMethod === "pickup" && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-100 text-amber-800 text-xs leading-relaxed">
                  <strong>Pickup Note:</strong> After payment, we&apos;ll contact you via WhatsApp with the pickup address.
                </div>
              )}
            </div>

            {/* Delivery Address */}
            {deliveryMethod === "delivery" && (
              <div className="mb-10">
                <h3
                  className="text-lg tracking-wide mb-6"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Delivery Address
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[3px] text-muted mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => handleUpdate("address", e.target.value)}
                      className="w-full border border-gray-200 px-4 py-3.5 text-sm focus:outline-none focus:border-black transition-colors"
                      placeholder="123 Your Street"
                    />
                  </div>

                  <ShippingCalculator
                    area={form.area}
                    onAreaChange={(val) => handleUpdate("area", val)}
                    cartTotal={totalPrice}
                  />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[3px] text-muted mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => handleUpdate("city", e.target.value)}
                        className="w-full border border-gray-200 px-4 py-3.5 text-sm focus:outline-none focus:border-black transition-colors"
                        placeholder="Lagos"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[3px] text-muted mb-2">
                        State
                      </label>
                      <select
                        value={form.state}
                        onChange={(e) => handleUpdate("state", e.target.value)}
                        className="w-full border border-gray-200 px-4 py-3.5 text-sm focus:outline-none focus:border-black transition-colors bg-white"
                      >
                        <option value="">Select State</option>
                        {nigerianStates.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Create Account */}
            {!user && (
              <div className="mb-8">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={createAccount}
                      onChange={(e) => setCreateAccount(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 border transition-colors duration-200 flex items-center justify-center ${
                      createAccount ? "bg-black border-black" : "bg-white border-gray-300 group-hover:border-gray-400"
                    }`}>
                      {createAccount && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-charcoal font-medium mb-0.5">
                      Create an account to track my order
                    </p>
                    <p className="text-xs text-muted leading-relaxed">
                      {createAccount
                        ? "We'll email you login details so you can track your order anytime."
                        : "You'll receive order updates via email only."}
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Mobile Pay Button */}
            <div className="mt-10 lg:hidden">
              <button
                onClick={handleProceedToPayment}
                disabled={processing}
                className="btn-luxury w-full bg-black text-white py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-all disabled:opacity-50"
              >
                {processing ? "Connecting..." : `Pay ${formatPrice(grandTotal)}`}
              </button>
            </div>
          </div>

          {/* ── Right: Order Summary ── */}
          <div className="lg:col-span-2">
            <div className="bg-cream p-8 sticky top-28">
              <h3
                className="text-lg tracking-wide mb-6"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Order Summary
              </h3>

              {/* Items */}
              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                {checkoutItems.map((item) => (
                  <div key={`${item.productId}-${item.size}`} className="flex gap-4">
                    {item.image && (
                      <div className="relative w-16 h-20 overflow-hidden bg-light-gray flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-[10px] rounded-full flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted">{item.size}</p>
                      {isSubscription && (
                        <p className="text-xs text-green-700 mt-0.5">
                          Every 2 months · 10% off
                        </p>
                      )}
                    </div>
                    <p className="text-sm flex-shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Delivery</span>
                  <span>
                    {deliveryMethod === "pickup" ? (
                      <span className="text-green-700 font-medium">Free — My Rider</span>
                    ) : shipping.freeShipping ? (
                      <span className="text-green-700">Free</span>
                    ) : shipping.isParkPickup ? (
                      <span className="text-amber-700">₦3,500</span>
                    ) : form.area ? (
                      formatPrice(shipping.fee)
                    ) : (
                      <span className="text-muted text-xs italic">Enter area</span>
                    )}
                  </span>
                </div>
                {deliveryMethod === "delivery" && shipping.isParkPickup && form.area && (
                  <p className="text-[10px] text-amber-700">
                    🚌 ₦3,500 logistics to bus park + driver fee at pickup
                  </p>
                )}
                {deliveryMethod === "delivery" && shipping.zone && form.area && (
                  <p className="text-[10px] text-muted">📦 {shipping.zone.estimatedDays}</p>
                )}
                {deliveryMethod === "pickup" && (
                  <p className="text-[10px] text-amber-700">
                    📍 Pickup address will be sent via WhatsApp after payment
                  </p>
                )}
                {isSubscription && deliveryMethod === "delivery" && (
                  <p className="text-[10px] text-muted">
                    Free within Lagos on orders up to ₦200,000
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center mb-8">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-semibold">{formatPrice(grandTotal)}</span>
              </div>

              {/* Desktop Pay Button */}
              <button
                onClick={handleProceedToPayment}
                disabled={processing}
                className="btn-luxury hidden lg:block w-full bg-black text-white py-4 text-[11px] uppercase tracking-[4px] text-center hover:bg-charcoal transition-all disabled:opacity-50"
              >
                {processing ? "Connecting..." : `Pay ${formatPrice(grandTotal)}`}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-muted">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <span className="text-[10px] uppercase tracking-[2px]">Secured by QorePay</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Zones — regular only */}
        {!isSubscription && deliveryMethod === "delivery" && (
          <div className="mt-16 pt-12 border-t border-gray-100">
            <h3
              className="text-lg tracking-wide mb-8 text-center"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Delivery Rates
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shippingZones.map((zone) => (
                <div key={zone.name} className="p-4 bg-gray-50 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">{zone.name}</h4>
                    <span className="text-sm font-semibold">
                      {zone.isParkPickup ? (
                        <span className="text-amber-700 text-xs">Park pickup</span>
                      ) : (
                        `₦${zone.fee.toLocaleString()}`
                      )}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted mb-2">
                    {zone.isParkPickup ? "🚌" : ""} {zone.estimatedDays}
                  </p>
                  {zone.isParkPickup && (
                    <p className="text-[10px] text-amber-700 mb-2">
                      Fee negotiated with bus driver
                    </p>
                  )}
                  <p className="text-[10px] text-muted leading-relaxed">
                    {zone.areas.slice(0, 5).join(", ")}
                    {zone.areas.length > 5 && ` +${zone.areas.length - 5} more`}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-muted mt-6">
              Free shipping on orders above ₦200,000 (within Lagos)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}