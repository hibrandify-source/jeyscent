"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSent(true);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="page-transition pt-24 lg:pt-28 min-h-screen flex items-center">
        <div className="max-w-md w-full mx-auto px-6 py-16 text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </div>

          <h1 className="text-2xl tracking-wide font-serif mb-4">
            Check Your Email
          </h1>
          <p className="text-muted text-sm leading-relaxed mb-8">
            If an account exists with <strong>{email}</strong>, we&apos;ve
            sent you a temporary password. Please check your inbox and spam
            folder.
          </p>

          <Link
            href="/auth/login"
            className="inline-block bg-black text-white px-8 py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-all"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition pt-24 lg:pt-28 min-h-screen flex items-center">
      <div className="max-w-md w-full mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[10px] uppercase tracking-[5px] text-muted mb-4">
            Reset Access
          </p>
          <h1 className="text-3xl tracking-wide font-serif">
            Forgot Password
          </h1>
          <div className="luxury-divider mx-auto mt-4 mb-6" />
          <p className="text-sm text-muted leading-relaxed">
            Enter your email address and we&apos;ll send you a temporary
            password to regain access to your account.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 text-sm text-center animate-slide-down">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] uppercase tracking-[3px] text-muted mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 px-4 py-3.5 text-sm focus:outline-none focus:border-black transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-luxury w-full bg-black text-white py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Reset Email"}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-8">
          Remember your password?{" "}
          <Link
            href="/auth/login"
            className="text-black border-b border-black pb-0.5 hover:text-muted transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}