// app/page.tsx
import Image from "next/image";
import Link from "next/link";
import { products } from "@/data/products";
import ProductCard from "@/components/ProductCard";

export default function HomePage() {
  const featured = products.filter((p) => p.type === "Reed Diffuser");

  return (
    <div className="page-transition">
      {/* ============ HERO ============ */}
      <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
        <Image
          src="https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776770669/ruth_banner_nu5jzv.jpg"
          alt="Luxury diffuser ambiance"
          fill
          className="object-cover"
          priority
          loading="eager"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 text-center text-white px-6 max-w-3xl mx-auto">
          <div className="animate-fade-in-up">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[6px] mb-6 text-white/70">
              Fragrance with Intention
            </p>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] mb-6 tracking-wide"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Scents That
              <br />
              <em className="italic font-normal">Speak Softly</em>
            </h1>
            <p className="text-sm sm:text-base text-white/60 max-w-lg mx-auto mb-10 leading-relaxed">
              Calm, fresh, and a little bit luxurious. Our signature
              fragrances transform your everyday spaces into something
              beautiful.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/shop"
                className="btn-luxury bg-white text-black px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-white/90 transition-all duration-400"
              >
                Explore the Collection
              </Link>
              <Link
                href="/our-story"
                className="border border-white/30 px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-white/10 transition-all duration-400"
              >
                Our Story
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-[1px] h-12 bg-white/30 mx-auto mb-2" />
          <p className="text-[9px] uppercase tracking-[3px] text-white/40">
            Scroll
          </p>
        </div>
      </section>

      {/* ============ INTRO STRIP ============ */}
      <section className="bg-charcoal text-white py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-2 text-[10px] uppercase tracking-[4px] text-white/50">
          <span>Hand-Crafted</span>
          <span className="hidden sm:inline">·</span>
          <span>Long-Lasting</span>
          <span className="hidden sm:inline">·</span>
          <span>Two Signature Scents</span>
          <span className="hidden sm:inline">·</span>
          <span>Made with Love</span>
        </div>
      </section>

      {/* ============ TWO FRAGRANCES ============ */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16 lg:mb-20">
            <p className="text-[10px] uppercase tracking-[5px] text-muted mb-4">
              The Collection
            </p>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl tracking-wide mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Two Fragrances, One Story
            </h2>
            <div className="luxury-divider mx-auto mt-6" />
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
            {/* Ruth */}
            <Link href="/shop?fragrance=ruth" className="group block">
              <div className="relative aspect-[4/5] overflow-hidden bg-light-gray">
                <Image
                  src="https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776770669/ruth_banner_nu5jzv.jpg"
                  alt="Ruth fragrance collection"
                  fill
                  className="object-cover transition-transform duration-[1.2s] group-hover:scale-105"
                  priority
                  loading="eager"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                  <p className="text-[10px] uppercase tracking-[4px] text-white/60 mb-3">
                    Fragrance I
                  </p>
                  <h3
                    className="text-3xl lg:text-4xl text-white mb-3 tracking-wide"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Ruth
                  </h3>
                  <p className="text-white/60 text-sm max-w-sm leading-relaxed mb-5">
                    Soft florals and subtle musk. Loyalty bottled — steady,
                    graceful, and unforgettable.
                  </p>
                  <span className="inline-block text-[11px] uppercase tracking-[3px] text-white border-b border-white/30 pb-1 group-hover:border-white transition-colors duration-500">
                    Discover Ruth
                  </span>
                </div>
              </div>
            </Link>

            {/* Proverbs */}
            <Link href="/shop?fragrance=proverbs" className="group block">
              <div className="relative aspect-[4/5] overflow-hidden bg-light-gray">
                <Image
                  src="https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776770669/proverbs_banner_r6uaew.jpg"
                  alt="Proverbs fragrance collection"
                  fill
                  className="object-cover transition-transform duration-[1.2s] group-hover:scale-105"
                  priority
                  loading="eager"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
                  <p className="text-[10px] uppercase tracking-[4px] text-white/60 mb-3">
                    Fragrance II
                  </p>
                  <h3
                    className="text-3xl lg:text-4xl text-white mb-3 tracking-wide"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Proverbs
                  </h3>
                  <p className="text-white/60 text-sm max-w-sm leading-relaxed mb-5">
                    Bold, grounding, and wise. Earthy undertones wrapped in
                    quiet confidence.
                  </p>
                  <span className="inline-block text-[11px] uppercase tracking-[3px] text-white border-b border-white/30 pb-1 group-hover:border-white transition-colors duration-500">
                    Discover Proverbs
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FEATURED PRODUCTS ============ */}
      <section className="py-20 lg:py-28 bg-cream">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-14">
            <div>
              <p className="text-[10px] uppercase tracking-[5px] text-muted mb-4">
                Best Sellers
              </p>
              <h2
                className="text-3xl lg:text-4xl tracking-wide"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Reed Diffusers
              </h2>
            </div>
            <Link
              href="/shop"
              className="mt-4 sm:mt-0 text-[11px] uppercase tracking-[3px] border-b border-charcoal pb-1 hover:text-muted transition-colors"
            >
              View All Products
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12 stagger-children">
            {featured.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 2}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRODUCT TYPES ============ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <p className="text-[10px] uppercase tracking-[5px] text-muted mb-4">
              For Every Space
            </p>
            <h2
              className="text-3xl lg:text-4xl tracking-wide"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Find Your Format
            </h2>
            <div className="luxury-divider mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            {[
              {
                title: "Reed Diffusers",
                subtitle: "Lasts up to 3 months",
                href: "/shop?type=reed-diffuser",
                image:
                  "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766380/reed_diffuser-3_bskomi.jpg",
              },
              {
                title: "Car Diffusers",
                subtitle: "Lasts 4–6 weeks",
                href: "/shop?type=car-diffuser",
                image:
                  "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766381/car_diffuser_wswkto.jpg",
              },
              {
                title: "Refill Bottles",
                subtitle: "Lasts up to 3 months",
                href: "/shop?type=refill-bottle",
                image:
                  "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766380/refill_bottle_b2ic8h.jpg",
              },
              {
                title: "Room Sprays",
                subtitle: "Instant fragrance",
                href: "/shop?type=room-spray",
                image:
                  "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766380/room_spray_ajb3n5.jpg",
              },
            ].map((type) => (
              <Link
                href={type.href}
                key={type.title}
                className="group relative aspect-[3/4] overflow-hidden bg-light-gray"
              >
                <Image
                  src={type.image}
                  alt={type.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-6">
                  <h3
                    className="text-white text-base lg:text-lg tracking-wide mb-1"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {type.title}
                  </h3>
                  <p className="text-white/50 text-xs">{type.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ BRAND STORY PREVIEW ============ */}
      <section className="py-20 lg:py-28 bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src="https://res.cloudinary.com/dkx1jje3g/image/upload/t_story_cover/story_page_cover_dcf3fa.jpg"
                alt="Mother and daughter"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[5px] text-white/40 mb-6">
                Our Story
              </p>
              <h2
                className="text-3xl lg:text-4xl tracking-wide mb-6 leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Born from Love,
                <br />
                <em className="italic font-normal">Built with Intention</em>
              </h2>
              <div className="luxury-divider-gold mb-8" />
              <p className="text-white/50 leading-relaxed mb-4">
                Jeyscent started during a pregnancy when every scent became
                too much. All I wanted was something soft, calm, and
                beautiful; something that would make a space feel like peace
                again.
              </p>
              <p className="text-white/50 leading-relaxed mb-4">
                But there was something deeper too… I had always wanted to
                build something for my daughter. Something she could grow
                into. Something she could one day look at and say, &ldquo;This is
                mine.&rdquo;
              </p>
              <p className="text-white/50 leading-relaxed mb-8">
                So Jeyscent became a mix of purpose, faith, growth,
                and a little bit of &ldquo;let me try this and see.&rdquo;
              </p>
              <Link
                href="/our-story"
                className="inline-block border border-white/30 px-8 py-3.5 text-[11px] uppercase tracking-[3px] hover:bg-white hover:text-black transition-all duration-500"
              >
                Read the Full Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SUBSCRIPTION CTA ============ */}
      <section className="py-20 lg:py-28 bg-cream">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <p className="text-[10px] uppercase tracking-[5px] text-muted mb-4">
            Never Run Out
          </p>
          <h2
            className="text-3xl lg:text-4xl tracking-wide mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Subscribe & Save
          </h2>
          <div className="luxury-divider mx-auto mt-4 mb-8" />
          <p className="text-muted leading-relaxed max-w-xl mx-auto mb-10">
            Set it and forget it. Our quarterly subscription delivers a fresh
            reed diffuser to your door every 3 months — so your space always
            smells like intention.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-10">
            {[
              { label: "Auto-Delivery", desc: "Every 3 months" },
              { label: "Save 10%", desc: "On every delivery" },
              { label: "Cancel Anytime", desc: "No commitments" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className="font-semibold text-sm mb-1">{item.label}</p>
                <p className="text-xs text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
          <Link
            href="/subscribe"
            className="btn-luxury inline-block bg-black text-white px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-all duration-400"
          >
            Start Your Subscription
          </Link>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <p className="text-[10px] uppercase tracking-[5px] text-muted mb-4">
              Kind Words
            </p>
            <h2
              className="text-3xl lg:text-4xl tracking-wide"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              What Our Customers Say
            </h2>
            <div className="luxury-divider mx-auto mt-6" />
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                text: "My living room has never smelled this good. The Ruth reed diffuser is everything, it is soft, warm, and so calming. I get compliments every time someone walks in.",
                name: "Adaeze O.",
                location: "Lagos",
              },
              {
                text: "I bought Proverbs for my office and now I can't work without it. It's grounding and sophisticated. Exactly what I needed for my creative space.",
                name: "Temi A.",
                location: "Abuja",
              },
              {
                text: "The quarterly subscription is genius. I never have to think about it because my fresh diffuser just arrives and my home stays beautiful. Thank you, Jey Scent!",
                name: "Blessing E.",
                location: "Port Harcourt",
              },
            ].map((testimonial, i) => (
              <div key={i} className="text-center lg:text-left">
                <div className="flex justify-center lg:justify-start gap-1 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <svg
                      key={j}
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="#1a1a1a"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="text-charcoal leading-relaxed mb-6 italic">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                <div>
                  <p className="font-semibold text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted">{testimonial.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ INSTAGRAM SECTION ============ */}
      <section className="py-16 bg-light-gray">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-10">
            <p className="text-[10px] uppercase tracking-[5px] text-muted mb-2">
              @jeyscent
            </p>
            <h3
              className="text-xl tracking-wide"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Follow the Journey
            </h3>
          </div>

          {/* Grid using your Cloudinary images — each links to exact IG post */}
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-1">
            {[
              {
                image: "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1780227732/IG1_wwaimi.jpg",
                href: "https://www.instagram.com/p/DUh5h-WjcPS/?igsh=MTVqY3VqN2c3ODJ5NA==",
              },
              {
                image: "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1780227723/IG2_ijxi4d.jpg",
                href: "https://www.instagram.com/p/DXJ2PXwjayg/?igsh=NjM3NjVtY2ZldGw2",
              },
              {
                image: "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1780227712/IG3_ynco7y.jpg",
                href: "https://instagram.com/p/DXHHk7kjRmZ/",
              },
              {
                image: "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1780227700/IG4_hkrqit.jpg",
                href: "https://www.instagram.com/p/DWRt_TuDWD_/?igsh=NWgwdzg1NGd4bzh1",
              },
              {
                image: "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1780227687/IG5_hsxpyr.jpg",
                href: "https://www.instagram.com/p/DO1WCWrjc29/?igsh=MWhyNTQzNjcza243Zg==",
              },
              {
                image: "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1780227671/IG6_xf1p5i.jpg",
                href: "https://www.instagram.com/p/DNvmCl6WhQ-/?img_index=1&igsh=M3h0amZ3N2E3eXls",
              },
            ].map((post, i) => (
              <a
                key={i}
                href={post.href}
                target="_blank"
                rel="noreferrer"
                className="group relative aspect-square overflow-hidden bg-light-gray"
              >
                <Image
                  src={post.image}
                  alt="JeyScent on Instagram"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 33vw, 16vw"
                />
                {/* Dark overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-500" />

                {/* Instagram icon appears on hover */}
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="white"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                  <span className="text-white text-[9px] uppercase tracking-[3px] mt-2">
                    View Post
                  </span>
                </div>
              </a>
            ))}
          </div>

          {/* Follow button */}
          <div className="text-center mt-8">
            <a
              href="https://www.instagram.com/jeyscent"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-3 border border-black px-8 py-3 text-[11px] uppercase tracking-[4px] hover:bg-black hover:text-white transition-all duration-300"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
              Follow @jeyscent
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}