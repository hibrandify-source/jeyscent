import Link from "next/link";
import Image from "next/image";
import HamperCard from "@/components/gift/HamperCard";
import {
  getFeaturedHampers,
  getChristmasHampers,
  getOccasionsByGroup,
  occasions,
} from "@/data/gifting";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1600&q=80";

export default function GiftHomePage() {
  const featured = getFeaturedHampers().slice(0, 3);
  const christmas = getChristmasHampers();
  const personalOccasions = getOccasionsByGroup("personal").slice(0, 4);
  const corporateImage = occasions.find((o) => o.group === "corporate")?.image ?? HERO_IMAGE;
  const personalImage = occasions.find((o) => o.group === "personal")?.image ?? HERO_IMAGE;

  return (
    <div className="page-transition">
      {/* Hero */}
      <section className="relative min-h-[88vh] flex items-center justify-center text-center text-white">
        <Image src={HERO_IMAGE} alt="" fill priority className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative px-6 pt-24 max-w-3xl">
          <p className="text-[10px] uppercase tracking-[6px] text-[#e3c995] mb-5">
            Jey Scent Gifting
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-wide leading-tight mb-6">
            Thoughtfully Curated.
            <br />
            Beautifully Gifted.
          </h1>
          <p className="text-white/75 leading-relaxed mb-10 max-w-xl mx-auto">
            Hampers and gifts for companies, families and every occasion in
            between — wrapped with care and delivered with intention.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/personal"
              className="btn-luxury bg-white text-black px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-cream transition-colors"
            >
              Shop Gifts
            </Link>
            <Link
              href="/corporate"
              className="border border-white/70 px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-white hover:text-black transition-colors"
            >
              Corporate Gifting
            </Link>
          </div>
        </div>
      </section>

      {/* Two arms */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-28">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {[
            {
              href: "/corporate",
              eyebrow: "For businesses",
              title: "Corporate Gifting",
              text: "Onboarding, appreciation, client and executive gifts, events and end-of-year hampers — branded and delivered at scale.",
              cta: "Explore corporate",
              image: corporateImage,
            },
            {
              href: "/personal",
              eyebrow: "For the people you love",
              title: "Personal & Occasion Gifting",
              text: "Birthdays, anniversaries, new babies, new homes, or just because — gifts that say exactly what you mean.",
              cta: "Shop by occasion",
              image: personalImage,
            },
          ].map((arm) => (
            <Link key={arm.href} href={arm.href} className="group relative block aspect-[4/3] lg:aspect-[5/4] overflow-hidden">
              <Image
                src={arm.image}
                alt=""
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-8 lg:p-10 text-white">
                <p className="text-[10px] uppercase tracking-[4px] text-white/70 mb-2">{arm.eyebrow}</p>
                <h2 className="font-serif text-2xl lg:text-3xl tracking-wide mb-3">{arm.title}</h2>
                <p className="text-sm text-white/75 leading-relaxed mb-5 max-w-md">{arm.text}</p>
                <span className="text-[11px] uppercase tracking-[3px] border-b border-white/60 pb-1">
                  {arm.cta} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="bg-cream">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-28">
          <div className="text-center mb-14">
            <p className="text-[10px] uppercase tracking-[5px] text-muted mb-3">Most loved</p>
            <h2 className="font-serif text-3xl lg:text-4xl tracking-wide mb-4">Signature Hampers</h2>
            <div className="luxury-divider mx-auto" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {featured.map((h) => (
              <HamperCard key={h.id} hamper={h} />
            ))}
          </div>
        </div>
      </section>

      {/* Occasions */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-28">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[10px] uppercase tracking-[5px] text-muted mb-3">Shop by occasion</p>
            <h2 className="font-serif text-3xl lg:text-4xl tracking-wide">A gift for every moment</h2>
          </div>
          <Link href="/personal" className="text-[11px] uppercase tracking-[3px] border-b border-black pb-1 self-start sm:self-auto">
            All occasions
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {personalOccasions.map((o) => (
            <Link
              key={o.slug}
              href={`/personal/${o.slug}`}
              className="border border-gray-200 hover:border-black transition-colors p-6 lg:p-8 text-center"
            >
              <h3 className="font-serif text-lg lg:text-xl tracking-wide mb-2">{o.title}</h3>
              <p className="text-xs text-muted leading-relaxed hidden sm:block">{o.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Builder CTA */}
      <section className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[5px] text-[#c9a96e] mb-4">Custom hampers</p>
            <h2 className="font-serif text-3xl lg:text-4xl tracking-wide mb-5">Build your own hamper</h2>
            <p className="text-white/60 leading-relaxed mb-8 max-w-lg">
              Choose a box, fill it with Jey Scent fragrances, treats and keepsakes,
              then add a personal message. We&apos;ll wrap it beautifully and deliver it for you.
            </p>
            <Link
              href="/custom/build"
              className="btn-luxury inline-block bg-white text-black px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-cream transition-colors"
            >
              Start Building
            </Link>
          </div>
          <ol className="grid sm:grid-cols-3 gap-6">
            {["Pick your box", "Fill it with favourites", "Add your message"].map((step, i) => (
              <li key={step} className="border border-white/15 p-6">
                <p className="font-serif text-3xl text-[#c9a96e] mb-3">0{i + 1}</p>
                <p className="text-sm text-white/80">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Christmas */}
      {christmas.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-28">
          <div className="text-center mb-14">
            <p className="text-[10px] uppercase tracking-[5px] text-muted mb-3">Seasonal</p>
            <h2 className="font-serif text-3xl lg:text-4xl tracking-wide mb-4">The Christmas Collection</h2>
            <div className="luxury-divider mx-auto mb-6" />
            <Link href="/christmas" className="text-[11px] uppercase tracking-[3px] border-b border-black pb-1">
              Shop Christmas
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {christmas.slice(0, 3).map((h) => (
              <HamperCard key={h.id} hamper={h} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
