import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import AddHamperToCart from "@/components/gift/AddHamperToCart";
import HamperCard from "@/components/gift/HamperCard";
import { hampers, getHamper, getOccasion } from "@/data/gifting";
import { formatPrice } from "@/data/products";

export function generateStaticParams() {
  return hampers.map((h) => ({ id: h.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const hamper = getHamper(id);
  return hamper
    ? { title: hamper.name, description: hamper.description, openGraph: { images: [hamper.image] } }
    : {};
}

export default async function HamperPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hamper = getHamper(id);
  if (!hamper) notFound();

  const occasionLinks = hamper.occasions
    .map((slug) => getOccasion(slug))
    .filter((o) => o !== undefined);
  const related = hampers
    .filter((h) => h.id !== hamper.id && h.occasions.some((o) => hamper.occasions.includes(o)))
    .slice(0, 3);
  const corporateOnly = hamper.audience === "corporate";

  return (
    <div className="page-transition pt-28 lg:pt-36">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pb-20">
        <nav className="text-[11px] uppercase tracking-[2px] text-muted mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-black">Gifting</Link>
          <span className="mx-2">/</span>
          <Link href={corporateOnly ? "/corporate" : "/personal"} className="hover:text-black">
            {corporateOnly ? "Corporate" : "Gifts"}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-black">{hamper.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          <div className="space-y-4">
            <div className="relative aspect-[4/5] overflow-hidden bg-light-gray">
              <Image
                src={hamper.image}
                alt={hamper.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            {hamper.gallery.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {hamper.gallery.slice(1, 5).map((src) => (
                  <div key={src} className="relative aspect-square overflow-hidden bg-light-gray">
                    <Image src={src} alt="" fill className="object-cover" sizes="25vw" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h1 className="font-serif text-3xl lg:text-4xl tracking-wide mb-3">{hamper.name}</h1>
            <p className="text-xl mb-6">
              {corporateOnly && <span className="text-muted text-sm mr-2">From</span>}
              {formatPrice(hamper.price)}
            </p>
            <div className="luxury-divider mb-6" />
            <p className="text-muted leading-relaxed mb-8">{hamper.description}</p>

            <h2 className="text-[10px] uppercase tracking-[3px] text-muted mb-3">What&apos;s inside</h2>
            <ul className="mb-8 space-y-2">
              {hamper.contents.map((c) => (
                <li key={c} className="flex gap-3 text-sm">
                  <span className="text-[#a8844a]" aria-hidden="true">✦</span>
                  {c}
                </li>
              ))}
            </ul>

            {occasionLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-10">
                {occasionLinks.map((o) => (
                  <Link
                    key={o.slug}
                    href={`/${o.group}/${o.slug}`}
                    className="text-[10px] uppercase tracking-[2px] border border-gray-200 hover:border-black px-3 py-1.5 transition-colors"
                  >
                    {o.title}
                  </Link>
                ))}
              </div>
            )}

            {corporateOnly ? (
              <div className="bg-cream p-8">
                <h2 className="font-serif text-lg tracking-wide mb-2">Ordering for your organisation?</h2>
                <p className="text-sm text-muted mb-6">
                  Corporate gifts are tailored to your brief — quantity, branding and delivery.
                  Request a quote and we&apos;ll be in touch within 1–2 business days.
                </p>
                <Link
                  href={`/quote?hamper=${encodeURIComponent(hamper.name)}`}
                  className="btn-luxury inline-block bg-black text-white px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-colors"
                >
                  Request a Quote
                </Link>
              </div>
            ) : (
              <AddHamperToCart hamper={hamper} />
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-24">
            <h2 className="font-serif text-2xl tracking-wide mb-10 text-center">You may also love</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {related.map((h) => (
                <HamperCard key={h.id} hamper={h} quoteOnly={h.audience === "corporate"} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
