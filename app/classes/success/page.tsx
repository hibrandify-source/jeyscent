"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/data/products";

interface SavedCheckout {
  reference?: string;
  amount?: number;
  isEarlyBird?: boolean;
  classId?: string;
  email?: string;
  name?: string;
  savedAt?: number;
}

function ClassSuccessContent() {
  const searchParams = useSearchParams();
  const processedRef = useRef(false);

  const [status, setStatus] = useState<"confirming" | "success" | "error">("confirming");
  const [error, setError] = useState("");
  const [pin, setPin] = useState("");
  const [className, setClassName] = useState("");
  const [email, setEmail] = useState("");
  const [amountPaid, setAmountPaid] = useState(0);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;
    handleConfirm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirm = async () => {
    try {
      // QorePay redirects to /classes/success WITHOUT appending the reference
      // to the URL, so `searchParams.get("reference")` is usually null. Recover
      // from the sessionStorage stash the checkout page wrote right before
      // redirecting to QorePay. (The confirm endpoint re-verifies with QorePay
      // server-side, so trusting the stashed value is safe.)
      let reference = searchParams.get("reference");
      let savedAmount = 0;

      if (!reference) {
        try {
          const savedRaw = sessionStorage.getItem("jeyscent_class_checkout");
          const saved: SavedCheckout = savedRaw ? JSON.parse(savedRaw) : {};
          reference = saved.reference || "";
          savedAmount = saved.amount || 0;
        } catch {
          /* sessionStorage may be blocked */
        }
      }

      if (!reference) {
        setError("Payment reference not found. Please contact support.");
        setStatus("error");
        return;
      }

      setStatus("confirming");
      const res = await fetch("/api/classes/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(
          (data && data.error) ||
            "We could not confirm your enrollment (Reference: " + reference + "). If you were charged, please contact support."
        );
        setStatus("error");
        return;
      }

      setPin(data.confirmed || "");
      if (data.className) setClassName(data.className);
      if (data.email) setEmail(data.email);
      // Prefer the amount from the sessionStorage stash (the confirm endpoint
      // doesn't echo it back); fall back to 0 if unavailable.
      if (savedAmount > 0) setAmountPaid(savedAmount);
      else {
        try {
          const savedRaw = sessionStorage.getItem("jeyscent_class_checkout");
          const saved: SavedCheckout = savedRaw ? JSON.parse(savedRaw) : {};
          if (saved.amount) setAmountPaid(saved.amount);
        } catch {
          /* ignore */
        }
      }

      // Clear the advisory session stash
      try {
        sessionStorage.removeItem("jeyscent_class_checkout");
      } catch {
        /* ignore */
      }

      setStatus("success");
    } catch (err) {
      console.error("Class confirm error:", err);
      setError("Something went wrong. If you were charged, please contact support.");
      setStatus("error");
    }
  };

  if (status === "confirming") {
    return (
      <div className="page-transition pt-24 lg:pt-28 min-h-screen flex items-center justify-center">
        <div className="max-w-lg text-center px-6 py-32">
          <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-8" />
          <h1
            className="text-2xl mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Confirming Your Enrollment...
          </h1>
          <p className="text-muted text-sm">
            We&rsquo;re verifying your payment with QorePay and issuing your access pin.
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
    const waLink = "https://wa.me/" + waNumber;
    return (
      <div className="page-transition pt-24 lg:pt-28 min-h-screen flex items-center justify-center">
        <div className="max-w-lg text-center px-6 py-20">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1
            className="text-2xl mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Something Went Wrong
          </h1>
          <p className="text-muted text-sm mb-6 max-w-md mx-auto">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/classes"
              className="bg-black text-white px-8 py-3 text-[11px] uppercase tracking-[3px]"
            >
              Back to Class
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
    <div className="page-transition pt-24 lg:pt-28 min-h-screen flex items-center justify-center">
      <div className="max-w-lg w-full mx-auto px-6 py-20 text-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1
          className="text-3xl mb-3"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          You&rsquo;re Enrolled! 🤍
        </h1>
        <p className="text-muted mb-4">
          {className
            ? `Your access pin for "${className}" has been sent to${email ? " " + email : " your email"}.`
            : "Your access pin has been sent to your email."}
        </p>
        <p className="text-xs text-muted mb-8 max-w-md mx-auto">
          Don&rsquo;t see the email? Check your <strong>spam</strong> or{" "}
          <strong>junk</strong> folder — Gmail sometimes routes automated
          messages there.
        </p>

        {pin && (
          <div className="bg-cream p-6 mb-8 text-left">
            <p className="text-[10px] uppercase tracking-[3px] text-muted mb-2 text-center">
              Your Access Pin
            </p>
            <p className="text-center text-2xl font-bold tracking-[4px] font-mono break-all">
              {pin}
            </p>
            {amountPaid > 0 && (
              <p className="text-center text-xs text-muted mt-4">
                Amount paid: {formatPrice(amountPaid)}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/classes/watch"
            className="bg-black text-white px-8 py-3 text-[11px] uppercase tracking-[3px]"
          >
            Watch The Class
          </Link>
          <Link
            href="/classes"
            className="border border-black px-8 py-3 text-[11px] uppercase tracking-[3px] hover:bg-black hover:text-white transition-colors"
          >
            Back to Classes
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ClassSuccessPage() {
  return (
    <Suspense fallback={
      <div className="page-transition pt-24 lg:pt-28 min-h-screen flex items-center justify-center">
        <div className="max-w-lg text-center px-6 py-32">
          <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-8" />
          <h1
            className="text-2xl mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Confirming Your Enrollment...
          </h1>
          <p className="text-muted text-sm">
            We&rsquo;re verifying your payment with QorePay and issuing your access pin.
          </p>
        </div>
      </div>
    }>
      <ClassSuccessContent />
    </Suspense>
  );
}
