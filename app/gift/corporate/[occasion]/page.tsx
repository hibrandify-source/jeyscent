import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import PageHero from "@/components/gift/PageHero";
import HamperCard from "@/components/gift/HamperCard";
import QuoteBanner from "@/components/gift/QuoteBanner";
import { getOccasion, getOccasionsByGroup, getHampersByOccasion } from "@/data/gifting";

export function generateStaticParams() {
  return getOccasionsByGroup("corporate").map((o) => ({ occasion: o.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ occasion: string }>;
}): Promise<Metadata> {
  const { occasion: slug } = await params;
  const occasion = getOccasion(slug, "corporate");
  return occasion ? { title: occasion.title, description: occasion.blurb } : {};
}

export default async function CorporateOccasionPage({
  params,
}: {
  params: Promise<{ occasion: string }>;
}) {
  const { occasion: slug } = await params;
  const occasion = getOccasion(slug, "corporate");
  if (!occasion) notFound();

  const hampers = getHampersByOccasion(occasion.slug);
  const others = getOccasionsByGroup("corporate").filter((o) => o.slug !== occasion.slug);

  return (
    <div className="page-transition">
      <PageHero eyebrow="Corporate Gifting" title={occasion.title} intro={occasion.blurb} />

      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-20">
        {hampers.length > 0 ? (
          <>
            <p className="text-center text-sm text-muted mb-12 max-w-2xl mx-auto">
              A few of our favourite {occasion.title.toLowerCase()} gifts. Every corporate order is
              tailored — contents, packaging and logo branding can all be adjusted to your brief and budget.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {hampers.map((h) => (
                <HamperCard key={h.id} hamper={h} quoteOnly />
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-muted">
            We curate {occasion.title.toLowerCase()} gifts to order — request a quote and we&apos;ll send you options.
          </p>
        )}
      </section>

      <QuoteBanner occasion={occasion.title} title={`Planning ${occasion.title.toLowerCase()} gifts?`} />

      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-14">
        <p className="text-[10px] uppercase tracking-[4px] text-muted mb-4 text-center">More corporate occasions</p>
        <div className="flex flex-wrap justify-center gap-3">
          {others.map((o) => (
            <Link
              key={o.slug}
              href={`/corporate/${o.slug}`}
              className="border border-gray-200 hover:border-black px-5 py-2.5 text-xs tracking-[2px] uppercase transition-colors"
            >
              {o.title}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
