import type { Metadata } from "next";
import PageHero from "@/components/gift/PageHero";
import OccasionCard from "@/components/gift/OccasionCard";
import HamperCard from "@/components/gift/HamperCard";
import QuoteBanner from "@/components/gift/QuoteBanner";
import { getOccasionsByGroup, getHampersByAudience } from "@/data/gifting";

export const metadata: Metadata = {
  title: "Corporate Gifting",
  description:
    "Corporate gift hampers for employee onboarding, appreciation, executives, clients, events and Christmas — branded and delivered at scale.",
};

const STEPS = [
  { title: "Tell us the brief", text: "Occasion, number of gifts, budget per gift and when you need them." },
  { title: "Get curated options", text: "We send hamper ideas and a tailored quote, including logo branding if you need it." },
  { title: "Approve & we deliver", text: "We pack, brand and deliver — to one office or to every recipient's door." },
];

export default function CorporateGiftingPage() {
  const corporate = getOccasionsByGroup("corporate");
  const samples = getHampersByAudience("corporate").slice(0, 3);

  return (
    <div className="page-transition">
      <PageHero
        eyebrow="Jey Scent Gifting"
        title="Corporate Gifting"
        intro="Gifts that strengthen relationships — for your team, your clients and your partners, throughout the year."
      />

      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-24">
        <div className="text-center mb-12">
          <h2 className="font-serif text-2xl lg:text-3xl tracking-wide mb-4">Find the right gift for every reason</h2>
          <div className="luxury-divider mx-auto" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {corporate.map((o) => (
            <OccasionCard key={o.slug} occasion={o} />
          ))}
        </div>
      </section>

      <section className="bg-cream">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 py-20 lg:py-24">
          <div className="text-center mb-12">
            <h2 className="font-serif text-2xl lg:text-3xl tracking-wide mb-4">How corporate gifting works</h2>
            <div className="luxury-divider mx-auto" />
          </div>
          <ol className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <li key={step.title} className="bg-white p-8">
                <p className="font-serif text-3xl text-[#a8844a] mb-4">0{i + 1}</p>
                <h3 className="font-serif text-lg tracking-wide mb-2">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {samples.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-24">
          <div className="text-center mb-12">
            <p className="text-[10px] uppercase tracking-[5px] text-muted mb-3">For inspiration</p>
            <h2 className="font-serif text-2xl lg:text-3xl tracking-wide mb-4">Sample corporate hampers</h2>
            <div className="luxury-divider mx-auto" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {samples.map((h) => (
              <HamperCard key={h.id} hamper={h} quoteOnly />
            ))}
          </div>
        </section>
      )}

      <QuoteBanner />
    </div>
  );
}
