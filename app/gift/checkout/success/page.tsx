"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useGiftCart } from "@/context/GiftCartContext";
import { purchase } from "@/components/MetaPixel";
import { GIFT_CHECKOUT_KEY } from "@/components/gift/GiftCheckout";
import { MAIN_SITE_URL } from "@/lib/site";
import type { OrderPayload } from "@/lib/orders";

// Retry transient failures (network drops, 429, 5xx) with backoff — same
// policy as the main shop's success page.
async function fetchWithRetry(url: string, options: RequestInit, attempts = 3): Promise<Response> {
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

function GiftSuccess() {
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const { clearCart } = useGiftCart();
  const processedRef = useRef(false);

  const [status, setStatus] = useState<"creating" | "success" | "error">("creating");
  const [orderId, setOrderId] = useState("");
  const [newAccount, setNewAccount] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    (async () => {
      let checkoutData: (OrderPayload & { paymentRef?: string }) | null = null;
      try {
        const saved = localStorage.getItem(GIFT_CHECKOUT_KEY);
        checkoutData = saved ? JSON.parse(saved) : null;
      } catch {
        checkoutData = null;
      }

      // The QorePay reference drives order creation; the server-side
      // PendingOrder snapshot supplies the order data, so this works even if
      // localStorage was lost. The webhook creates the same order if this
      // page never loads.
      const reference = searchParams.get("reference") || checkoutData?.paymentRef;
      if (!reference) {
        setError("Payment reference not found. Please contact us.");
        setStatus("error");
        return;
      }

      try {
        const res = await fetchWithRetry("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference, ...(checkoutData ? { payload: checkoutData } : {}) }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(
            data.error ||
              `We couldn't confirm your order. Your payment was received — please contact us with reference: ${reference}`
          );
          setStatus("error");
          return;
        }

        setOrderId(data.orderId);
        setNewAccount(Boolean(data.newAccount));
        setStatus("success");

        if (checkoutData) {
          purchase({
            value: checkoutData.grandTotal,
            currency: "NGN",
            content_ids: checkoutData.items.map((i) => i.productId),
            content_type: "product",
            num_items: checkoutData.items.reduce((sum, i) => sum + i.quantity, 0),
          });
        }
        localStorage.removeItem(GIFT_CHECKOUT_KEY);
        clearCart();
        await refreshUser();
      } catch {
        setError("Something went wrong. If you were charged, please contact us.");
        setStatus("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "creating") {
    return (
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <p className="text-muted">Confirming your gift order…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center max-w-lg">
        <h1 className="font-serif text-3xl tracking-wide mb-4">We hit a snag</h1>
        <p className="text-muted mb-8">{error}</p>
        <Link
          href="/contact"
          className="inline-block bg-black text-white px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-colors"
        >
          Contact Us
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center max-w-lg">
      <p className="text-[10px] uppercase tracking-[5px] text-[#a8844a] mb-4">Order confirmed</p>
      <h1 className="font-serif text-3xl lg:text-4xl tracking-wide mb-4">Thank you 🤍</h1>
      <div className="luxury-divider mx-auto mb-6" />
      <p className="text-muted mb-2">
        Your gift is being prepared and wrapped by hand.
      </p>
      {orderId && (
        <p className="text-sm mb-8">
          Order <span className="font-semibold tracking-wider">#{orderId.slice(-8).toUpperCase()}</span>
        </p>
      )}
      {newAccount && (
        <p className="text-sm text-muted mb-8">
          We&apos;ve created an account for you — check your email for login details.
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a
          href={`${MAIN_SITE_URL}/dashboard`}
          className="btn-luxury bg-black text-white px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-colors"
        >
          Track Your Order
        </a>
        <Link
          href="/"
          className="border border-black px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-black hover:text-white transition-colors"
        >
          Keep Gifting
        </Link>
      </div>
    </div>
  );
}

export default function GiftCheckoutSuccessPage() {
  return (
    <div className="pt-32 pb-20 min-h-[70vh] flex items-center justify-center px-6">
      <Suspense fallback={null}>
        <GiftSuccess />
      </Suspense>
    </div>
  );
}
