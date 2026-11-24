import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/gift/PageHero";
import { MAIN_SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Jey Scent Gifting brings the love, intention and quality of Jey Scent to thoughtfully curated gifts for companies and individuals.",
};

const VALUES = [
  { title: "Curated with intention", text: "Every item earns its place — nothing is filler, everything means something." },
  { title: "Beautifully presented", text: "Hand-wrapped, ribboned and finished with a handwritten card." },
  { title: "Delivered with care", text: "Packed to arrive perfect, on the date that matters to you." },
];

export default function GiftAboutPage() {
  return (
    <div className="page-transition">
      <PageHero eyebrow="Our Story" title="About Jey Scent Gifting" />

      <section className="max-w-3xl mx-auto px-6 py-20 lg:py-24 text-center">
        <p className="font-serif text-2xl lg:text-3xl leading-relaxed tracking-wide mb-10">
          Thoughtfully curated. Beautifully gifted.
        </p>
        <div className="space-y-6 text-muted leading-relaxed text-left sm:text-center">
          <p>
            Jey Scent began with a simple belief: that the way a space smells can change
            the way it feels. Jey Scent Gifting carries that same love and intention into
            the gifts we give one another.
          </p>
          <p>
            We create hampers for companies who want to thank their people, welcome new
            hires and honour their clients — and for individuals marking birthdays,
            weddings, new babies, new homes, or simply wanting someone to know
            they&apos;re thought of.
          </p>
          <p>
            Every gift is built around our signature Ruth and Proverbs fragrances, paired
            with carefully chosen treats and keepsakes, and finished by hand.
          </p>
        </div>
      </section>

      <section className="bg-cream">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 py-20 grid sm:grid-cols-3 gap-6">
          {VALUES.map((v) => (
            <div key={v.title} className="bg-white p-8 text-center">
              <h2 className="font-serif text-lg tracking-wide mb-3">{v.title}</h2>
              <p className="text-sm text-muted leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-16 text-center flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/personal"
          className="btn-luxury bg-black text-white px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-colors"
        >
          Shop Gifts
        </Link>
        <a
          href={`${MAIN_SITE_URL}/our-story`}
          className="border border-black px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-black hover:text-white transition-colors"
        >
          The Jey Scent Story
        </a>
      </section>
    </div>
  );
}
