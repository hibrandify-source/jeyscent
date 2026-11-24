"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/data/products";

interface ClassInfo {
  id: string;
  title: string;
  kind: "video" | "pdf";
  singleEpisode?: boolean;
  hasPdf?: boolean;
  price: number;
  earlyBirdPrice: number;
  earlyBirdMax: number;
  // API returns `earlyBRemaining` (computed server-side). `earlyBirdUsed` is
  // intentionally withheld. We tolerate either field; `earlyBRemaining` wins.
  earlyBRemaining?: number;
  earlyBirdUsed?: number;
  episodeCount?: number;
}

export default function ClassCheckoutPage() {
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId");

  const [cls, setCls] = useState<ClassInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  // Load class info from the public catalog API. If `?classId=` is set we fetch
  // that single class via /api/classes/[id]; otherwise we grab the catalog
  // (/api/classes) and use the first published one. Both endpoints return only
  // public fields (no videoUrl / pdfUrl).
  useEffect(() => {
    (async () => {
      try {
        if (classId) {
          const res = await fetch(`/api/classes/${classId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.class) setCls(data.class as ClassInfo);
          }
        } else {
          const res = await fetch("/api/classes");
          if (res.ok) {
            const data = await res.json();
            const first = (data.classes as ClassInfo[])[0];
            if (first) setCls(first);
          }
        }
      } catch {
        // Non-fatal — page still usable
      } finally {
        setLoadingInfo(false);
      }
    })();
  }, [classId]);

  useEffect(() => {
    if (searchParams.get("payment") === "failed") {
      setError("Payment was not completed. Please try again.");
    }
  }, [searchParams]);

  const effectiveClassId = classId || cls?.id || "";
  // Prefer `earlyBRemaining` from the API; fall back to deriving from
  // `earlyBirdUsed` for older/legacy responses (and the catalog list, which
  // also withholds `earlyBirdUsed`).
  const earlyBirdsLeft = cls
    ? (cls.earlyBRemaining ?? Math.max(0, cls.earlyBirdMax - (cls.earlyBirdUsed ?? 0)))
    : 0;
  // Early-bird is "active" while slots remain AND the class actually has a
  // tier configured (earlyBirdMax > 0). When the admin disables early bird
  // (earlyBirdMax = 0), earlyBirdsLeft is 0 and isEarlyBird is false.
  const isEarlyBird = cls ? cls.earlyBirdMax > 0 && earlyBirdsLeft > 0 : false;
  const amount = cls ? (isEarlyBird ? cls.earlyBirdPrice : cls.price) : 0;

  const handleUpdate = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    if (!effectiveClassId) {
      setError("No class selected. Please go back and choose a class.");
      return false;
    }
    if (!form.name || !form.email || !form.phone) {
      setError("Please fill in your name, email and phone number.");
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError("Please enter a valid email.");
      return false;
    }
    if (form.phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid phone number.");
      return false;
    }
    return true;
  };

  const handlePay = async () => {
    setError("");
    if (!validate()) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/classes/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: effectiveClassId,
          name: form.name,
          email: form.email,
          phone: form.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start payment.");
        setProcessing(false);
        return;
      }
      // Stash context for the success page's UX (the success page itself
      // re-verifies with QorePay server-side, so this is advisory only).
      try {
        sessionStorage.setItem(
          "jeyscent_class_checkout",
          JSON.stringify({
            reference: data.reference,
            amount: data.amount,
            isEarlyBird: data.isEarlyBird,
            classId: effectiveClassId,
            email: form.email.toLowerCase(),
            name: form.name,
            savedAt: Date.now(),
          })
        );
      } catch {
        /* sessionStorage may be blocked; non-fatal */
      }
      // Redirect to QorePay hosted checkout
      window.location.href = data.authorization_url;
    } catch (err) {
      console.error("Class checkout error:", err);
      setError("Could not start payment. Please try again.");
      setProcessing(false);
    }
  };

  if (loadingInfo) {
    return (
      <div className="page-transition pt-24 lg:pt-28 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="page-transition pt-24 lg:pt-28 min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center px-6">
          <h1
            className="text-3xl mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            No Active Class
          </h1>
          <p className="text-muted mb-8">
            There&rsquo;s no published class to enroll in right now. Please check
            back later.
          </p>
          <Link
            href="/classes"
            className="bg-black text-white px-8 py-3 text-[11px] uppercase tracking-[3px]"
          >
            Back to Classes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition pt-24 lg:pt-28 min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12 lg:py-20">
        <Link
          href="/classes"
          className="text-[11px] uppercase tracking-[3px] text-muted hover:text-black border-b border-muted hover:border-black pb-0.5 transition-all inline-block mb-8"
        >
          ← Back to Class
        </Link>

        <h1
          className="text-3xl lg:text-4xl tracking-wide mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Join the Class
        </h1>
        <p className="text-muted mb-10">{cls.title}</p>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <div>
            <h2 className="text-sm uppercase tracking-[3px] mb-4">Your Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleUpdate("name", e.target.value)}
                  className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleUpdate("email", e.target.value)}
                  className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                  placeholder="jane@example.com"
                />
                <p className="text-xs text-muted mt-1">
                  Your access pin will be sent here. Use a stable email you check often.
                </p>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[2px] text-muted mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleUpdate("phone", e.target.value)}
                  className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                  placeholder="0801 234 5678"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 mt-6">{error}</p>
            )}

            <button
              onClick={handlePay}
              disabled={processing}
              className="mt-8 w-full bg-black text-white px-8 py-4 text-[11px] uppercase tracking-[3px] hover:bg-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? "Redirecting to Payment..." : `Pay ${formatPrice(amount)}`}
            </button>
          </div>

          {/* Summary */}
          <aside>
            <div className="bg-cream p-6">
              <h2 className="text-sm uppercase tracking-[3px] mb-4">Order Summary</h2>
              <div className="flex justify-between mb-3 text-sm">
                <span className="text-muted">{cls.title}</span>
              </div>
              <div className="flex justify-between mb-3">
                <span className="text-[10px] uppercase tracking-[2px] text-muted">
                  {isEarlyBird ? "Early Bird" : "Standard"}
                </span>
                <span className="font-semibold">{formatPrice(amount)}</span>
              </div>
              {isEarlyBird && (
                <p className="text-xs text-charcoal mt-4">
                  Only {earlyBirdsLeft} early-bird slot{earlyBirdsLeft !== 1 ? "s" : ""} left.
                  After that, the fee is {formatPrice(cls.price)}.
                </p>
              )}
              <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-muted">
                <p className="mb-2">After payment you&rsquo;ll receive:</p>
                <ul className="space-y-1">
                  <li>• A unique access pin by email</li>
                  <li>• Lifetime access on a single device</li>
                  <li>
                    • Device-locked{" "}
                    {cls.kind === "pdf"
                      ? "PDF download"
                      : cls.singleEpisode
                      ? "video playback"
                      : cls.episodeCount
                      ? `${cls.episodeCount} video module${cls.episodeCount !== 1 ? "s" : ""}`
                      : "video playback"}
                    {cls.hasPdf && cls.kind === "video" ? " + companion PDF" : ""}
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
