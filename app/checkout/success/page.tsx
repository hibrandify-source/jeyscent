"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { formatPrice } from "@/data/products";
import { purchase } from "@/components/MetaPixel";

interface CheckoutData {
  form: {
    name: string;
    email: string;
    phone: string;
    address: string;
    area: string;
    city: string;
    state: string;
  };
  deliveryMethod: "delivery" | "pickup";
  isSubscription?: boolean;
  items: {
    productId: string;
    name: string;
    size: string;
    quantity: number;
    price: number;
    image: string;
  }[];
  totalPrice: number;
  grandTotal: number;
  shippingFee: number;
  isParkPickup: boolean;
  deliveryEstimate: string;
  createAccount: boolean;
  paymentRef?: string;
  savedAt: number;
}

// Retry transient failures (network drops, 429 rate limits, 5xx) with
// backoff. Non-transient errors (400 validation, 404, 401) return immediately.
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  attempts = 3
): Promise<Response> {
  let lastRes: Response | null = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.status !== 429 && res.status < 500) return res;
      lastRes = res;
    } catch (err) {
      if (attempt === attempts) throw err;
    }
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  return lastRes!;
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const { clearCart } = useCart();
  const processedRef = useRef(false);

  const [status, setStatus] = useState<"creating" | "success" | "error">("creating");
  const [orderId, setOrderId] = useState("");
  const [isNewAccount, setIsNewAccount] = useState(false);
  const [error, setError] = useState("");
  const [orderTotal, setOrderTotal] = useState(0);
  const [isSubscription, setIsSubscription] = useState(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;
    handlePaymentComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePaymentComplete = async () => {
    try {
      const existingOrderId = searchParams.get("orderId");
      if (existingOrderId) {
        setOrderId(existingOrderId);
        setIsNewAccount(searchParams.get("newAccount") === "true");
        setStatus("success");
        return;
      }

      let savedData: string | null = null;
      try {
        savedData = localStorage.getItem("jeyscent_checkout");
      } catch {
        savedData = null;
      }

      const checkoutData: CheckoutData | null = savedData
        ? JSON.parse(savedData)
        : null;

      // The QorePay reference is the source of truth for order creation —
      // order data also lives server-side (PendingOrder), so losing
      // localStorage no longer means losing the order.
      const reference = searchParams.get("reference") || checkoutData?.paymentRef;
      if (!reference) {
        setError("Payment reference not found. Please contact support.");
        setStatus("error");
        return;
      }

      // ── SUBSCRIPTION: confirm sub only, skip order creation ───────────────
      const subData = localStorage.getItem("jeyscent_subscription");
      const isSubCheckout = checkoutData?.isSubscription === true;

      if (isSubCheckout && subData) {
        setIsSubscription(true);
        try {
          // Server-side confirm re-verifies the payment with QorePay.
          await fetchWithRetry("/api/subscriptions/confirm", {
            method: "POST",
          });
        } catch (subErr) {
          console.error("Subscription confirm error:", subErr);
        }

        if (checkoutData) {
          purchase({
            value: checkoutData.grandTotal,
            currency: "NGN",
            content_ids: checkoutData.items.map((i) => i.productId),
            content_type: "product",
            num_items: checkoutData.items.reduce((sum, i) => sum + i.quantity, 0),
          });
        }

        localStorage.removeItem("jeyscent_subscription");
        sessionStorage.removeItem("jeyscent_sub_session");
        localStorage.removeItem("jeyscent_checkout");
        setStatus("success");
        return;
      }

      if (checkoutData) {
        // Leftover subscription data but this is a regular order — ignore it.
        localStorage.removeItem("jeyscent_subscription");
      }

      // ── REGULAR ORDER ─────────────────────────────────────────────────────
      // POST /api/checkout re-verifies the payment with QorePay server-side
      // (status SUCCESS + exact amount match) before creating the order, so
      // this is safe even if the browser previously died at the gateway —
      // the server snapshot (PendingOrder) supplies the order data.
      const orderRes = await fetchWithRetry("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          ...(checkoutData ? { payload: checkoutData } : {}),
        }),
      });

      const orderData = await orderRes.json();

      if (orderRes.ok) {
        setOrderId(orderData.orderId);
        setIsNewAccount(orderData.newAccount || false);
        setOrderTotal(checkoutData?.grandTotal ?? 0);
        setStatus("success");

        if (checkoutData && typeof window !== "undefined" && window.fbq) {
          window.fbq("track", "Purchase", {
            value: checkoutData.grandTotal,
            currency: "NGN",
            content_ids: checkoutData.items.map((i) => i.productId),
            content_type: "product",
            num_items: checkoutData.items.reduce((sum, i) => sum + i.quantity, 0),
          });
        }

        localStorage.removeItem("jeyscent_checkout");
        clearCart();
        await refreshUser();
      } else {
        setError(
          orderData.error ||
          "Failed to create order. Payment was successful — please contact support with reference: " + reference
        );
        setStatus("error");
      }
    } catch (err) {
      console.error("Checkout success error:", err);
      setError("Something went wrong. If you were charged, please contact support.");
      setStatus("error");
    }
  };

  if (status === "creating") {
    return (
      <div className="page-transition pt-24 lg:pt-28">
        <div className="max-w-lg mx-auto px-6 py-32 text-center">
          <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-8" />
          <h1 className="text-2xl mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Confirming Your Payment...
          </h1>
          <p className="text-muted text-sm">
            We&apos;re verifying your payment with QorePay and setting up your order.
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
    const waLink = "https://wa.me/" + waNumber;
    return (
      <div className="page-transition pt-24 lg:pt-28">
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 className="text-2xl mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Something Went Wrong
          </h1>
          <p className="text-muted text-sm mb-6 max-w-md mx-auto">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/checkout"
              className="bg-black text-white px-8 py-3 text-[11px] uppercase tracking-[3px] hover:bg-charcoal transition-colors"
            >
              Try Again
            </Link>
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="border border-black px-8 py-3 text-[11px] uppercase tracking-[3px] hover:bg-black hover:text-white transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition pt-24 lg:pt-28">
      <div className="max-w-lg mx-auto px-6 py-20 text-center">

        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-scale-up">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="text-3xl mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
          {isSubscription ? "Subscription Confirmed! 🤍" : "Order Confirmed 🤍"}
        </h1>

        <p className="text-muted mb-8">
          {isSubscription
            ? "Your bi-monthly delivery has been scheduled."
            : "Thank you for your order! We're preparing it with love."}
        </p>

        {!isSubscription && (
          <>
            <div className="bg-cream p-6 mb-8 text-left">
              <div className="flex justify-between mb-3">
                <span className="text-[10px] uppercase tracking-[3px] text-muted">Order Number</span>
                <span className="font-semibold tracking-[1px]">{"#" + orderId.slice(-8).toUpperCase()}</span>
              </div>
              {orderTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-[10px] uppercase tracking-[3px] text-muted">Total</span>
                  <span className="font-semibold">{formatPrice(orderTotal)}</span>
                </div>
              )}
            </div>

            {isNewAccount && (
              <div className="bg-blue-50 border border-blue-100 p-4 mb-8 text-left">
                <p className="text-sm text-blue-800 font-medium mb-1">Account Created!</p>
                <p className="text-xs text-blue-600">
                  We have sent your login details to your email. You can track your order from your dashboard.
                </p>
              </div>
            )}

            <p className="text-sm text-muted mb-8">
              A confirmation email has been sent to your inbox.
            </p>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="bg-black text-white px-8 py-3 text-[11px] uppercase tracking-[3px] hover:bg-charcoal transition-colors"
          >
            {isSubscription ? "View Dashboard" : "Track Order"}
          </Link>
          {!isSubscription && (
            <Link
              href="/shop"
              className="border border-black px-8 py-3 text-[11px] uppercase tracking-[3px] hover:bg-black hover:text-white transition-colors"
            >
              Continue Shopping
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}