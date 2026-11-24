import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import PageHero from "@/components/gift/PageHero";
import HamperCard from "@/components/gift/HamperCard";
import { getOccasion, getOccasionsByGroup, getHampersByOccasion } from "@/data/gifting";

export function generateStaticParams() {
  return getOccasionsByGroup("personal").map((o) => ({ occasion: o.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ occasion: string }>;
}): Promise<Metadata> {
  const { occasion: slug } = await params;
  const occasion = getOccasion(slug, "personal");
  return occasion ? { title: `${occasion.title} Gifts`, description: occasion.blurb } : {};
}

export default async function PersonalOccasionPage({
  params,
}: {
  params: Promise<{ occasion: string }>;
}) {
  const { occasion: slug } = await params;
  const occasion = getOccasion(slug, "personal");
  if (!occasion) notFound();

  const hampers = getHampersByOccasion(occasion.slug);
  const others = getOccasionsByGroup("personal").filter((o) => o.slug !== occasion.slug);

  return (
    <div className="page-transition">
      <PageHero eyebrow="Personal Gifting" title={`${occasion.title} Gifts`} intro={occasion.blurb} />

      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-20">
        {hampers.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {hampers.map((h) => (
              <HamperCard key={h.id} hamper={h} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted">New {occasion.title.toLowerCase()} gifts are on their way.</p>
        )}

        <div className="mt-16 text-center bg-cream p-10">
          <h2 className="font-serif text-2xl tracking-wide mb-3">Can&apos;t find the one?</h2>
          <p className="text-sm text-muted mb-6">Build a hamper around exactly what they love.</p>
          <Link
            href="/custom/build"
            className="btn-luxury inline-block bg-black text-white px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-colors"
          >
            Build Your Own
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-12 pb-16">
        <p className="text-[10px] uppercase tracking-[4px] text-muted mb-4 text-center">More occasions</p>
        <div className="flex flex-wrap justify-center gap-3">
          {others.map((o) => (
            <Link
              key={o.slug}
              href={`/personal/${o.slug}`}
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
