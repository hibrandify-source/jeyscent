import type { Metadata } from "next";
import PageHero from "@/components/gift/PageHero";
import HamperCard from "@/components/gift/HamperCard";
import QuoteBanner from "@/components/gift/QuoteBanner";
import { getChristmasHampers } from "@/data/gifting";

export const metadata: Metadata = {
  title: "Christmas Collection",
  description:
    "Festive gift hampers for family, friends, staff and clients — order early for delivery before the holidays.",
};

export default function ChristmasPage() {
  const hampers = getChristmasHampers();

  return (
    <div className="page-transition">
      <PageHero
        eyebrow="Seasonal Collection"
        title="The Christmas Collection"
        intro="Festive hampers for the people you love and the teams and clients who made your year. Order early — Christmas delivery slots fill quickly."
      />

      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-20">
        {hampers.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {hampers.map((h) => (
              <HamperCard key={h.id} hamper={h} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted">This year&apos;s Christmas collection is coming soon.</p>
        )}
      </section>

      <QuoteBanner
        occasion="Corporate Christmas"
        title="Christmas gifts for your team or clients?"
        text="We handle end-of-year gifting at any scale — branded packaging, a message from your leadership and delivery to every address on your list."
      />
    </div>
  );
}
