"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

function SubscribeSuccessContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  const verifyAndCreate = async () => {
    try {
      const res = await fetch("/api/subscriptions/confirm", {
        method: "POST",
      });
      const data = await res.json();
      console.log("Confirm response:", data);

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot fetch on mount; status set from async response
    verifyAndCreate();
  }, []);

  if (status === "loading") return (
    <div className="pt-40 text-center">
      <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-sm text-muted">Confirming your subscription...</p>
    </div>
  );

  if (status === "error") return (
    <div className="pt-40 text-center">
      <h2 className="text-2xl font-serif mb-4">Something went wrong</h2>
      <p className="text-muted text-sm mb-6">Please contact support.</p>
      <Link href="/dashboard" className="bg-black text-white px-8 py-3 text-[11px] uppercase tracking-[3px]">
        Go to Dashboard
      </Link>
    </div>
  );

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

export default function SubscribeSuccessPage() {
  return (
    <Suspense>
      <SubscribeSuccessContent />
    </Suspense>
  );
}