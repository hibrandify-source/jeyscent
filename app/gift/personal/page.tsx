import type { Metadata } from "next";
import PageHero from "@/components/gift/PageHero";
import OccasionCard from "@/components/gift/OccasionCard";
import HamperCard from "@/components/gift/HamperCard";
import { getOccasionsByGroup, getHampersByAudience } from "@/data/gifting";

export const metadata: Metadata = {
  title: "Personal & Occasion Gifting",
  description:
    "Gift hampers for birthdays, Valentine's, Mother's and Father's Day, weddings, new babies, housewarmings — or just because.",
};

export default function PersonalGiftingPage() {
  const personal = getOccasionsByGroup("personal");
  const hampers = getHampersByAudience("personal");

  return (
    <div className="page-transition">
      <PageHero
        eyebrow="Jey Scent Gifting"
        title="Personal & Occasion Gifting"
        intro="For the people who matter most — gifts for life's big moments and the quiet ones in between."
      />

      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-24">
        <div className="text-center mb-12">
          <h2 className="font-serif text-2xl lg:text-3xl tracking-wide mb-4">Shop by occasion</h2>
          <div className="luxury-divider mx-auto" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {personal.map((o) => (
            <OccasionCard key={o.slug} occasion={o} />
          ))}
        </div>
      </section>

      <section className="bg-cream">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-24">
          <div className="text-center mb-12">
            <h2 className="font-serif text-2xl lg:text-3xl tracking-wide mb-4">All gift hampers</h2>
            <div className="luxury-divider mx-auto mb-4" />
            <p className="text-sm text-muted">Every hamper includes a free personalised message card.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {hampers.map((h) => (
              <HamperCard key={h.id} hamper={h} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
