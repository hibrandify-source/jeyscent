import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/data/products";

// ── /classes/[id] ───────────────────────────────────────────────────────────
// Public detail page for a single class. Shows the cover image, description,
// module list (for multi-module video classes), pricing, and the Join / Watch
// CTAs. The /classes listing page links every card here.
export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cls = await prisma.class.findUnique({
    where: { id, published: true },
    include: {
      episodes: {
        orderBy: { episodeNumber: "asc" },
        select: {
          id: true,
          title: true,
          episodeNumber: true,
          duration: true,
        },
      },
    },
  });

  if (!cls) notFound();

  const earlyBirdsLeft = Math.max(0, cls.earlyBirdMax - cls.earlyBirdUsed);
  // earlyBirdMax = 0 ⇒ admin disabled early bird ⇒ never active, full price shown.
  const earlyBirdActive = cls.earlyBirdUsed < cls.earlyBirdMax;
  const isPdf = cls.kind === "pdf";
  const isSingleVideo = cls.kind === "video" && cls.singleEpisode;
  const hasCompanionPdf = cls.kind === "video" && !!cls.pdfUrl;
  const episodeCount = cls.episodes.length;

  return (
    <div className="page-transition pt-24 lg:pt-28 min-h-screen">
      <section className="max-w-6xl mx-auto px-6 lg:px-12 py-12 lg:py-20">
        {/* Back link */}
        <Link
          href="/classes"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[3px] text-muted hover:text-charcoal mb-8"
        >
          <span aria-hidden>←</span> All Classes
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Image */}
          <div className="relative aspect-[4/5] overflow-hidden bg-light-gray">
            {cls.imageUrl ? (
              <Image
                src={cls.imageUrl}
                alt={cls.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
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
              <div className="absolute top-6 left-6 bg-white px-5 py-3">
                <p className="text-[10px] uppercase tracking-[3px] text-charcoal">
                  Early Bird
                </p>
                <p className="text-sm font-medium">
                  {earlyBirdsLeft} of {cls.earlyBirdMax} slots left
                </p>
              </div>
            )}
          </div>

          {/* Content */}
          <div>
            <p className="text-[10px] uppercase tracking-[5px] text-muted mb-4">
              Masterclass by Jey Scent
            </p>
            <h1
              className="text-4xl lg:text-5xl tracking-wide mb-6"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {cls.title}
            </h1>
            <div className="luxury-divider mb-8" />

            <p className="text-muted leading-relaxed mb-8 whitespace-pre-line">
              {cls.description}
            </p>

            {/* What's included */}
            <div className="mb-10 grid grid-cols-1 gap-3">
              {(isPdf
                ? [
                    "Downloadable PDF, read at your own pace",
                    "Lifetime access on a single device",
                    "Personal access pin sent to your email",
                    "Secure device-locked download",
                  ]
                : isSingleVideo
                ? [
                    "Pre-recorded video, watch at your own pace",
                    "Lifetime access on a single device",
                    "Personal access pin sent to your email",
                    "Secure device-locked playback",
                    ...(hasCompanionPdf
                      ? ["Downloadable companion PDF included"]
                      : []),
                  ]
                : [
                    `Pre-recorded video, watch at your own pace • ${episodeCount} module${episodeCount !== 1 ? "s" : ""}`,
                    "Lifetime access on a single device",
                    "Personal access pin sent to your email",
                    "Secure device-locked playback",
                    ...(hasCompanionPdf
                      ? ["Downloadable companion PDF included"]
                      : []),
                  ]
              ).map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-charcoal mt-0.5 shrink-0"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <p className="text-sm text-muted">{item}</p>
                </div>
              ))}
            </div>

            {/* Curriculum preview — multi-module video classes only */}
            {!isPdf && !isSingleVideo && episodeCount > 0 && (
              <div className="mb-10 bg-cream p-6">
                <p className="text-[10px] uppercase tracking-[3px] text-muted mb-4">
                  What you&rsquo;ll learn
                </p>
                <ol className="space-y-3">
                  {cls.episodes.map((ep) => (
                    <li key={ep.id} className="flex items-start gap-3">
                      <span className="text-[10px] uppercase tracking-[2px] text-muted pt-1 shrink-0 min-w-[24px]">
                        {String(ep.episodeNumber).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-sm">{ep.title}</p>
                        {ep.duration && (
                          <p className="text-xs text-muted mt-0.5">{ep.duration}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Pricing */}
            <div className="bg-cream p-6 mb-8">
              <div className="flex items-baseline justify-between mb-4">
                <span className="text-[10px] uppercase tracking-[3px] text-muted">
                  Class Fee
                </span>
                <span className="text-2xl font-semibold">
                  {formatPrice(earlyBirdActive ? cls.earlyBirdPrice : cls.price)}
                </span>
              </div>
              {earlyBirdActive && (
                <div className="flex items-baseline justify-between text-muted">
                  <span className="text-[10px] uppercase tracking-[3px]">
                    After Early Bird
                  </span>
                  <span className="text-sm line-through">
                    {formatPrice(cls.price)}
                  </span>
                </div>
              )}
              {earlyBirdActive && (
                <p className="mt-4 text-xs text-charcoal">
                  First {cls.earlyBirdMax} students pay{" "}
                  {formatPrice(cls.earlyBirdPrice)}. Only {earlyBirdsLeft} early-bird
                  slot{earlyBirdsLeft !== 1 ? "s" : ""} left.
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/classes/checkout?classId=${cls.id}`}
                className="bg-black text-white px-10 py-4 text-[11px] uppercase tracking-[3px] hover:bg-charcoal transition-colors text-center"
              >
                Join Class
              </Link>
              <Link
                href="/classes/watch"
                className="border border-black px-10 py-4 text-[11px] uppercase tracking-[3px] hover:bg-black hover:text-white transition-colors text-center"
              >
                {isPdf ? "Already Enrolled? Open" : "Already Enrolled? Watch"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
