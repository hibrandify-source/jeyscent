import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/data/products";
import ExpandableText from "@/components/ExpandableText";

// Avoid prerendering at build time (DB may not be reachable during Vercel
// build's static page collection). Always server-render on demand.
export const dynamic = "force-dynamic";

// ── /classes ────────────────────────────────────────────────────────────────
// Public catalog. Lists every published class as a card. Click a card → the
// per-class detail page at /classes/[id] (module list, full description,
// pricing tiers). The "Join Class" button on each card links straight to
// checkout for that class.
export default async function ClassesPage() {
  const classes = await prisma.class.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      kind: true,
      singleEpisode: true,
      price: true,
      earlyBirdPrice: true,
      earlyBirdMax: true,
      earlyBirdUsed: true,
      imageUrl: true,
      pdfUrl: true,
      episodes: {
        orderBy: { episodeNumber: "asc" },
        select: { id: true },
      },
    },
  });

  return (
    <div className="page-transition pt-24 lg:pt-28 min-h-screen">
      <section className="max-w-6xl mx-auto px-6 lg:px-12 py-12 lg:py-20">
        <p className="text-[10px] uppercase tracking-[5px] text-muted mb-4">
          Masterclasses by Jey Scent
        </p>
        <h1
          className="text-4xl lg:text-5xl tracking-wide mb-6"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          All Classes
        </h1>
        <div className="luxury-divider mb-12" />

        {classes.length === 0 ? (
          <p className="text-muted leading-relaxed">
            We&rsquo;re putting the finishing touches on our next masterclass.
            Please check back soon. 🤍
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {classes.map((c) => {
              const earlyBirdsLeft = Math.max(
                0,
                c.earlyBirdMax - c.earlyBirdUsed
              );
              // earlyBirdMax = 0 ⇒ admin disabled early bird ⇒ show full price.
              const earlyBirdActive = c.earlyBirdUsed < c.earlyBirdMax;
              const isPdf = c.kind === "pdf";
              const isSingleVideo = c.kind === "video" && c.singleEpisode;
              const hasCompanionPdf = c.kind === "video" && !!c.pdfUrl;
              const moduleCount = c.episodes.length;

              const blurb =
                isPdf
                  ? "PDF resource"
                  : isSingleVideo
                  ? "Single video module"
                  : `${moduleCount} module${moduleCount !== 1 ? "s" : ""}`;
              const extras = hasCompanionPdf ? " + companion PDF" : "";

              return (
                <article key={c.id} className="group flex flex-col">
                  <Link
                    href={`/classes/${c.id}`}
                    className="relative aspect-[4/5] overflow-hidden bg-light-gray mb-5 block"
                  >
                    {c.imageUrl ? (
                      <Image
                        src={c.imageUrl}
                        alt={c.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span
                          className="text-charcoal text-6xl tracking-[8px] uppercase"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          JS
                        </span>
                      </div>
                    )}
                    {earlyBirdActive && (
                      <div className="absolute top-4 left-4 bg-white px-3 py-2">
                        <p className="text-[9px] uppercase tracking-[2px] text-charcoal">
                          Early Bird
                        </p>
                        <p className="text-xs font-medium">
                          {earlyBirdsLeft} of {c.earlyBirdMax} left
                        </p>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-1 text-[9px] uppercase tracking-[2px]">
                      {isPdf ? "PDF" : "Video"}
                    </div>
                  </Link>

                  <div className="flex flex-col flex-1">
                    <h3
                      className="text-xl tracking-wide mb-2"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      <Link
                        href={`/classes/${c.id}`}
                        className="hover:underline"
                      >
                        {c.title}
                      </Link>
                    </h3>
                    <p className="text-[10px] uppercase tracking-[3px] text-muted mb-3">
                      {blurb}
                      {extras}
                    </p>

                    {c.description && (
                      <div className="mb-4">
                        <ExpandableText
                          text={c.description}
                          maxLength={140}
                          className="text-sm text-muted leading-relaxed"
                        />
                      </div>
                    )}

                    <div className="mt-auto flex items-baseline justify-between mb-4">
                      <span className="text-[10px] uppercase tracking-[3px] text-muted">
                        Class Fee
                      </span>
                      <div className="text-right">
                        <span className="text-lg font-semibold">
                          {formatPrice(
                            earlyBirdActive ? c.earlyBirdPrice : c.price
                          )}
                        </span>
                        {earlyBirdActive && (
                          <span className="block text-xs text-muted line-through">
                            {formatPrice(c.price)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/classes/checkout?classId=${c.id}`}
                        className="flex-1 bg-black text-white px-4 py-3 text-[10px] uppercase tracking-[2px] hover:bg-charcoal transition-colors text-center"
                      >
                        Join Class
                      </Link>
                      <Link
                        href={`/classes/${c.id}`}
                        className="flex-1 border border-black px-4 py-3 text-[10px] uppercase tracking-[2px] hover:bg-black hover:text-white transition-colors text-center"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
