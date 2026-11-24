"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useGiftCart } from "@/context/GiftCartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/data/products";
import { getShippingFee, nigerianStates } from "@/lib/shipping";
import { initiateCheckout, addPaymentInfo } from "@/components/MetaPixel";
import ShippingCalculator from "@/components/ShippingCalculator";
import { MAIN_SITE_URL } from "@/lib/site";
import type { OrderPayload } from "@/lib/orders";

type DeliveryMethod = "delivery" | "pickup";

// localStorage key for the in-flight gifting checkout (read by the gift
// success page). Separate from the main shop's "jeyscent_checkout".
export const GIFT_CHECKOUT_KEY = "gift_checkout";

const inputClass =
  "w-full border border-gray-200 px-4 py-3.5 text-sm focus:outline-none focus:border-black transition-colors bg-white";
const labelClass = "block text-[10px] uppercase tracking-[3px] text-muted mb-2";

export default function GiftCheckout() {
  const { items, totalPrice } = useGiftCart();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("delivery");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    area: "",
    city: "",
    state: "",
    recipientPhone: "",
  });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [createAccount, setCreateAccount] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time prefill once the session loads; fields stay editable
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.name,
        email: prev.email || user.email,
      }));
    }
  }, [user]);

  const paymentFailed = searchParams.get("payment") === "failed";
  const shownError =
    error || (paymentFailed ? "Payment was not completed. Please try again or contact us." : "");

  // The cart hydrates from localStorage after mount; give it one tick before
  // deciding the cart is genuinely empty.
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (ready && items.length === 0 && !processing) router.push("/cart");
  }, [ready, items.length, processing, router]);

  const shipping = useMemo(() => {
    if (deliveryMethod === "pickup") {
      return { fee: 0, freeShipping: false, isParkPickup: false, zone: null };
    }
    return getShippingFee(form.area, totalPrice);
  }, [form.area, totalPrice, deliveryMethod]);

  const grandTotal = totalPrice + (shipping?.fee ?? 0);

  const set = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = (): boolean => {
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
    if (deliveryMethod === "delivery" && (!form.address || !form.area || !form.city || !form.state)) {
      setError("Please fill in the recipient's delivery address");
      return false;
    }
    return true;
  };

  const handlePay = async () => {
    setError("");
    if (!validate()) return;
    setProcessing(true);

    const checkoutData: OrderPayload & { savedAt: number } = {
      brand: "gifting",
      form,
      deliveryMethod,
      isSubscription: false,
      items: items.map((i) => ({
        productId: i.kind === "hamper" ? `hamper:${i.hamperId}` : `custom:${i.boxId}`,
        name: i.name,
        size: i.kind === "hamper" ? "Gift hamper" : "Custom hamper",
        quantity: i.quantity,
        price: i.price,
        image: i.image,
        details: {
          kind: i.kind,
          hamperId: i.hamperId,
          boxId: i.boxId,
          itemIds: i.itemIds,
          personalisation: i.personalisation,
        },
      })),
      totalPrice,
      grandTotal,
      shippingFee: shipping.fee,
      isParkPickup: shipping.isParkPickup,
      deliveryEstimate:
        deliveryMethod === "pickup" ? "Customer arranges pickup" : shipping.zone?.estimatedDays || "",
      createAccount,
      savedAt: Date.now(),
    };

    try {
      localStorage.setItem(GIFT_CHECKOUT_KEY, JSON.stringify(checkoutData));

      const pixel = {
        content_ids: checkoutData.items.map((i) => i.productId),
        content_type: "product",
        num_items: checkoutData.items.reduce((sum, i) => sum + i.quantity, 0),
        value: grandTotal,
        currency: "NGN",
      };
      initiateCheckout(pixel);
      addPaymentInfo(pixel);

      const res = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: grandTotal,
          email: form.email,
          name: form.name,
          checkoutData,
          metadata: { customer_phone: form.phone, storefront: "gifting" },
        }),
      });
      const data = await res.json();

      if (res.ok && data.authorization_url) {
        localStorage.setItem(
          GIFT_CHECKOUT_KEY,
          JSON.stringify({ ...checkoutData, paymentRef: data.reference })
        );
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

  if (!ready || items.length === 0) {
    return (
      <div className="pt-40 pb-20 text-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const payButton = (className: string) => (
    <button
      type="button"
      onClick={handlePay}
      disabled={processing}
      className={`btn-luxury w-full bg-black text-white py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-all disabled:opacity-50 ${className}`}
    >
      {processing ? "Connecting..." : `Pay ${formatPrice(grandTotal)}`}
    </button>
  );

  return (
    <div className="page-transition pt-28 lg:pt-36">
      <div className="max-w-6xl mx-auto px-6 lg:px-12 pb-20">
        <h1 className="font-serif text-3xl lg:text-4xl tracking-wide mb-2">Checkout</h1>
        {!user && (
          <p className="text-sm text-muted mb-10">
            Already have a Jey Scent account?{" "}
            <a href={`${MAIN_SITE_URL}/auth/login`} className="underline underline-offset-4 hover:text-black">
              Sign in
            </a>
          </p>
        )}

        {shownError && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-700 text-sm text-center" role="alert">
            {shownError}
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 mt-8">
          <div className="lg:col-span-3 space-y-10">
            <section>
              <h2 className="font-serif text-lg tracking-wide mb-1">Your details</h2>
              <p className="text-xs text-muted mb-6">So we can send your confirmation and reach you about the order.</p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="c-name" className={labelClass}>Full name</label>
                  <input id="c-name" className={inputClass} value={form.name}
                    onChange={(e) => set("name", e.target.value)} autoComplete="name" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="c-email" className={labelClass}>Email</label>
                    <input id="c-email" type="email" className={inputClass} value={form.email}
                      onChange={(e) => set("email", e.target.value)} autoComplete="email" />
                  </div>
                  <div>
                    <label htmlFor="c-phone" className={labelClass}>Phone</label>
                    <input id="c-phone" type="tel" className={inputClass} value={form.phone}
                      onChange={(e) => set("phone", e.target.value)} autoComplete="tel" placeholder="08012345678" />
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-serif text-lg tracking-wide mb-6">Delivery</h2>
              <div className="grid grid-cols-2 gap-4">
                {([
                  ["delivery", "Deliver to recipient", "We deliver the gift. Fee calculated by area."],
                  ["pickup", "My rider / pickup", "Collect it yourself. No delivery fee."],
                ] as const).map(([value, title, text]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDeliveryMethod(value)}
                    aria-pressed={deliveryMethod === value}
                    className={`border p-5 text-left transition-all ${
                      deliveryMethod === value
                        ? "border-black bg-black text-white"
                        : "border-gray-200 hover:border-gray-400 bg-white"
                    }`}
                  >
                    <p className="text-sm font-semibold mb-1">{title}</p>
                    <p className={`text-xs leading-relaxed ${deliveryMethod === value ? "text-white/60" : "text-muted"}`}>
                      {text}
                    </p>
                  </button>
                ))}
              </div>

              {deliveryMethod === "pickup" ? (
                <p className="mt-4 p-4 bg-amber-50 border border-amber-100 text-amber-800 text-xs leading-relaxed">
                  After payment, we&apos;ll contact you on WhatsApp with the pickup address.
                </p>
              ) : (
                <div className="space-y-4 mt-6">
                  <div>
                    <label htmlFor="c-address" className={labelClass}>Recipient&apos;s street address</label>
                    <input id="c-address" className={inputClass} value={form.address}
                      onChange={(e) => set("address", e.target.value)} autoComplete="street-address" />
                  </div>
                  <ShippingCalculator area={form.area} onAreaChange={(v) => set("area", v)} cartTotal={totalPrice} />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="c-city" className={labelClass}>City</label>
                      <input id="c-city" className={inputClass} value={form.city}
                        onChange={(e) => set("city", e.target.value)} placeholder="Lagos" />
                    </div>
                    <div>
                      <label htmlFor="c-state" className={labelClass}>State</label>
                      <select id="c-state" className={inputClass} value={form.state}
                        onChange={(e) => set("state", e.target.value)}>
                        <option value="">Select State</option>
                        {nigerianStates.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="c-rphone" className={labelClass}>
                      Recipient&apos;s phone <span className="normal-case tracking-normal">(optional, for the courier)</span>
                    </label>
                    <input id="c-rphone" type="tel" className={inputClass} value={form.recipientPhone}
                      onChange={(e) => set("recipientPhone", e.target.value)} />
                  </div>
                </div>
              )}
            </section>

            {!user && (
              <label className="flex items-start gap-3 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={createAccount}
                  onChange={(e) => setCreateAccount(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-black"
                />
                <span>
                  Create an account to track my order
                  <span className="block text-xs text-muted">We&apos;ll email you login details.</span>
                </span>
              </label>
            )}

            <div className="lg:hidden">{payButton("")}</div>
          </div>

          <aside className="lg:col-span-2">
            <div className="bg-cream p-8 lg:sticky lg:top-32">
              <h2 className="font-serif text-lg tracking-wide mb-6">Order summary</h2>
              <ul className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                {items.map((item) => (
                  <li key={item.lineId} className="flex gap-4">
                    <div className="relative w-16 h-20 bg-light-gray flex-shrink-0 overflow-hidden">
                      <Image src={item.image} alt="" fill className="object-cover" sizes="64px" />
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-[10px] rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.name}</p>
                      {item.personalisation.recipientName && (
                        <p className="text-xs text-muted">For {item.personalisation.recipientName}</p>
                      )}
                    </div>
                    <p className="text-sm flex-shrink-0">{formatPrice(item.price * item.quantity)}</p>
                  </li>
                ))}
              </ul>
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Delivery</span>
                  <span>
                    {deliveryMethod === "pickup" ? (
                      <span className="text-green-700">Free — pickup</span>
                    ) : shipping.freeShipping ? (
                      <span className="text-green-700">Free</span>
                    ) : form.area ? (
                      formatPrice(shipping.fee)
                    ) : (
                      <span className="text-muted text-xs italic">Enter area</span>
                    )}
                  </span>
                </div>
                {deliveryMethod === "delivery" && shipping.zone && form.area && (
                  <p className="text-[10px] text-muted">📦 {shipping.zone.estimatedDays}</p>
                )}
              </div>
              <div className="flex justify-between items-center mb-8">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-semibold">{formatPrice(grandTotal)}</span>
              </div>
              {payButton("hidden lg:block")}
              <p className="mt-4 text-center text-[10px] uppercase tracking-[2px] text-muted">Secured by QorePay</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
