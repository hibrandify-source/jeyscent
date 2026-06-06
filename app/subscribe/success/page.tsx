"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function SubscribeSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const reference = searchParams.get("reference") || searchParams.get("ref");
    if (!reference) {
      setStatus("error");
      return;
    }
    verifyAndCreate(reference);
  }, []);

  const verifyAndCreate = async (reference: string) => {
    try {
      // 1. Verify payment
      const verifyRes = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyData.verified) {
        setStatus("error");
        return;
      }

      // 2. Extract subscription data from metadata
      const meta = verifyData.metadata?.subscriptionData;
      if (!meta) {
        setStatus("error");
        return;
      }

      // 3. Create subscription
      const subRes = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId:   meta.productId,
          productName: meta.productName,
          size:        meta.size,
          frequency:   meta.frequency || "quarterly",
          price:       meta.price,
        }),
      });

      if (subRes.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "loading") {
    return (
      <div className="pt-40 text-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-muted">Confirming your subscription...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="pt-40 text-center">
        <h2 className="text-2xl font-serif mb-4">Something went wrong</h2>
        <p className="text-muted text-sm mb-6">We couldn't confirm your subscription. Please contact support.</p>
        <Link href="/dashboard" className="bg-black text-white px-8 py-3 text-[11px] uppercase tracking-[3px]">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-40 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 className="text-2xl font-serif mb-3">Subscription Confirmed!</h2>
      <p className="text-muted text-sm mb-8">Your quarterly delivery has been scheduled.</p>
      <Link href="/dashboard" className="bg-black text-white px-8 py-3 text-[11px] uppercase tracking-[3px]">
        View Dashboard
      </Link>
    </div>
  );
}