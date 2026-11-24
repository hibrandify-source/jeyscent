"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getOccasionsByGroup } from "@/data/gifting";

const inputClass =
  "w-full border border-gray-200 px-4 py-3.5 text-sm focus:outline-none focus:border-black transition-colors bg-white";
const labelClass = "block text-[10px] uppercase tracking-[3px] text-muted mb-2";

const OCCASION_OPTIONS = [
  ...getOccasionsByGroup("corporate").map((o) => o.title),
  "Wedding / Event Favours",
  "Other",
];

export default function QuoteForm() {
  const searchParams = useSearchParams();
  const presetOccasion = searchParams.get("occasion") || "";
  const presetHamper = searchParams.get("hamper") || "";

  const [form, setForm] = useState({
    company: "",
    contactName: "",
    email: "",
    phone: "",
    occasion: OCCASION_OPTIONS.includes(presetOccasion) ? presetOccasion : "",
    quantity: "",
    budgetPerGift: "",
    deliveryDate: "",
    brandingRequired: false,
    message: presetHamper ? `I'm interested in: ${presetHamper}` : "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const set = (field: keyof typeof form, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.company || !form.contactName || !form.email || !form.phone || !form.occasion || !form.quantity) {
      setError("Please fill in all required fields.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/gift/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
          budgetPerGift: form.budgetPerGift === "" ? null : Number(form.budgetPerGift),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("sent");
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="text-center py-12">
        <p className="font-serif text-3xl tracking-wide mb-4">Thank you 🤍</p>
        <p className="text-muted mb-2">We&apos;ve received your enquiry and sent a copy to {form.email}.</p>
        <p className="text-muted mb-10">Our gifting team will be in touch within 1–2 business days.</p>
        <Link
          href="/corporate"
          className="inline-block border border-black px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-black hover:text-white transition-colors"
        >
          Back to Corporate Gifting
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 text-sm" role="alert">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="q-company" className={labelClass}>Company / organisation *</label>
          <input id="q-company" className={inputClass} value={form.company} maxLength={150}
            onChange={(e) => set("company", e.target.value)} autoComplete="organization" required />
        </div>
        <div>
          <label htmlFor="q-name" className={labelClass}>Your name *</label>
          <input id="q-name" className={inputClass} value={form.contactName} maxLength={100}
            onChange={(e) => set("contactName", e.target.value)} autoComplete="name" required />
        </div>
        <div>
          <label htmlFor="q-email" className={labelClass}>Work email *</label>
          <input id="q-email" type="email" className={inputClass} value={form.email} maxLength={200}
            onChange={(e) => set("email", e.target.value)} autoComplete="email" required />
        </div>
        <div>
          <label htmlFor="q-phone" className={labelClass}>Phone *</label>
          <input id="q-phone" type="tel" className={inputClass} value={form.phone} maxLength={30}
            onChange={(e) => set("phone", e.target.value)} autoComplete="tel" required />
        </div>
        <div>
          <label htmlFor="q-occasion" className={labelClass}>Occasion *</label>
          <select id="q-occasion" className={inputClass} value={form.occasion}
            onChange={(e) => set("occasion", e.target.value)} required>
            <option value="">Select an occasion</option>
            {OCCASION_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="q-qty" className={labelClass}>Number of gifts *</label>
          <input id="q-qty" type="number" min={1} inputMode="numeric" className={inputClass} value={form.quantity}
            onChange={(e) => set("quantity", e.target.value)} placeholder="e.g. 50" required />
        </div>
        <div>
          <label htmlFor="q-budget" className={labelClass}>Budget per gift (₦)</label>
          <input id="q-budget" type="number" min={0} inputMode="numeric" className={inputClass} value={form.budgetPerGift}
            onChange={(e) => set("budgetPerGift", e.target.value)} placeholder="e.g. 30000" />
        </div>
        <div>
          <label htmlFor="q-date" className={labelClass}>Needed by</label>
          <input id="q-date" type="date" className={inputClass} value={form.deliveryDate}
            onChange={(e) => set("deliveryDate", e.target.value)} />
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer text-sm">
        <input
          type="checkbox"
          checked={form.brandingRequired}
          onChange={(e) => set("brandingRequired", e.target.checked)}
          className="w-4 h-4 accent-black"
        />
        I&apos;d like our logo / branding on the gifts or packaging
      </label>

      <div>
        <label htmlFor="q-message" className={labelClass}>Anything else we should know?</label>
        <textarea id="q-message" rows={5} maxLength={2000} className={`${inputClass} resize-none`} value={form.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="Recipients, delivery locations, items you'd love included, dietary needs…" />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-luxury w-full bg-black text-white py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-colors disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Request a Quote"}
      </button>
    </form>
  );
}
