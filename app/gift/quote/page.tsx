import type { Metadata } from "next";
import { Suspense } from "react";
import PageHero from "@/components/gift/PageHero";
import QuoteForm from "@/components/gift/QuoteForm";

export const metadata: Metadata = {
  title: "Request a Quote",
  description:
    "Corporate and bulk gifting enquiries — tell us your occasion, quantity and budget and we'll send a tailored quote.",
};

const PROMISES = [
  "Tailored hamper options for your budget",
  "Logo branding and custom packaging",
  "Delivery to one office or many addresses",
  "Invoicing for your finance team",
];

export default function QuotePage() {
  return (
    <div className="page-transition">
      <PageHero
        eyebrow="Corporate & Bulk Orders"
        title="Request a Quote"
        intro="Tell us a little about what you need — we'll respond within 1–2 business days with curated options and pricing."
      />

      <section className="max-w-6xl mx-auto px-6 lg:px-12 py-16 lg:py-20 grid lg:grid-cols-3 gap-12 lg:gap-16">
        <div className="lg:col-span-2">
          <Suspense fallback={null}>
            <QuoteForm />
          </Suspense>
        </div>
        <aside className="bg-cream p-8 h-fit">
          <h2 className="font-serif text-lg tracking-wide mb-6">What to expect</h2>
          <ul className="space-y-4">
            {PROMISES.map((p) => (
              <li key={p} className="flex gap-3 text-sm">
                <span className="text-[#a8844a]" aria-hidden="true">✦</span>
                {p}
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </div>
  );
}
