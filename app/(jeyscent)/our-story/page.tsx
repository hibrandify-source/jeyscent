// app/our-story/page.tsx
import Image from "next/image";
import Link from "next/link";

export default function OurStoryPage() {
  return (
    <div className="page-transition">
      {/* Hero */}
      <section className="relative pt-24 lg:pt-28">
        <div className="relative h-[60vh] lg:h-[75vh] min-h-[400px] overflow-hidden">
          <Image
            src="https://res.cloudinary.com/dkx1jje3g/image/upload/t_story_cover/story_page_cover_dcf3fa.jpg"
            alt="Mother and daughter moment"
            fill
            // Changed object-position to focus on the top/face on desktop
            className="object-cover object-[center_20%] lg:object-[center_15%]"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/40 lg:bg-black/50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-6">
              <p className="text-[10px] uppercase tracking-[6px] text-white/80 mb-5">
                How It All Started
              </p>
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl tracking-wide"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Our Story
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* Story Content */}
      <section className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-6 lg:px-12">
          {/* Opening */}
          <div className="text-center mb-16">
            <h2
              className="text-2xl lg:text-3xl tracking-wide mb-6 leading-relaxed"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Jeyscent started in a very funny way… 
            </h2>
            <div className="luxury-divider mx-auto" />
          </div>

          {/* The Pregnancy */}
          <div className="mb-16">
            <p className="text-lg text-charcoal leading-[1.9] mb-6">
              During my pregnancy, my nose became a full-time detective. I
              could smell <em>everything</em>.
            </p>
            <p className="text-lg text-charcoal leading-[1.9] mb-6">
              And not in a nice way. Everywhere just started smelling…
              somehow different.
            </p>
            <p className="text-lg text-charcoal leading-[1.9] mb-6">
              Scents I never noticed before became too strong, too harsh, or
              just uncomfortable. And all I wanted was something soft, calm,
              and beautiful; something that would make a space feel like
              peace again.
            </p>
            <p className="text-lg text-charcoal leading-[1.9] font-medium">
              That was the first spark.
            </p>
          </div>

          {/* Image Break */}
          <div className="relative aspect-[16/9] overflow-hidden mb-16">
            <Image
              src="https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776770669/ruth_banner_nu5jzv.jpg"
              alt="Peaceful ambiance"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 720px"
            />
          </div>

          {/* The Deeper Why */}
          <div className="mb-16">
            <p className="text-lg text-charcoal leading-[1.9] mb-6">
              But there was something deeper too… 
            </p>
            <p className="text-lg text-charcoal leading-[1.9] mb-6">
              I had always wanted to build something for my daughter.
              Something she could grow into. Something she could one day look
              at and say,
            </p>
            <blockquote className="border-l-2 border-black pl-8 py-4 my-10">
              <p
                className="text-2xl lg:text-3xl italic leading-relaxed"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                &ldquo;This is mine.&rdquo;
              </p>
            </blockquote>
          </div>

          {/* The Faith */}
          <div className="mb-16">
            <p className="text-lg text-charcoal leading-[1.9] mb-6">
              In fact, I chose the name Jeyscent before I even knew her
              gender 
            </p>
            <p className="text-lg text-charcoal leading-[1.9] mb-6">
              After having a baby boy first, I was like, &ldquo;God, this
              next one… must be a baby girl&rdquo; 
            </p>
            <p className="text-lg text-charcoal leading-[1.9] mb-6">
              And I held on to that with so much faith… because I just knew.
              
            </p>
            <p className="text-lg text-charcoal leading-[1.9] font-medium">
              Then she came… and a few months later, I started.
            </p>
          </div>

          {/* Image Break 2 */}
          <div className="grid grid-cols-2 gap-4 mb-16">
            <div className="relative aspect-[3/4] overflow-hidden">
              <Image
                src="https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766381/proverb_fragrance_h3ee7l.jpg"
                alt="Reed diffuser"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 50vw, 340px"
              />
            </div>
            <div className="relative aspect-[3/4] overflow-hidden">
              <Image
                src="https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766382/ruth_fragrance_oitrdz.jpg"
                alt="Diffuser collection"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 50vw, 340px"
              />
            </div>
          </div>

          {/* The Beginning */}
          <div className="mb-16">
            <p className="text-lg text-charcoal leading-[1.9] mb-6">
              Not perfectly. Not consistently. Just small small 
            </p>
            <p className="text-lg text-charcoal leading-[1.9] mb-6">
              But with love… and intention.
            </p>
            <p className="text-lg text-charcoal leading-[1.9] mb-6">
              Because for me, this is more than just selling fragrances.
            </p>
          </div>

          {/* The Belief */}
          <div className="bg-black text-white p-10 lg:p-14 mb-16 text-center">
            <p
              className="text-xl lg:text-2xl leading-relaxed italic"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              &ldquo;I believe when a woman is empowered, she shows up
              differently… she builds differently.&rdquo;
            </p>
            <div className="w-10 h-[1px] bg-white/30 mx-auto my-6" />
            <p className="text-white/50 text-sm">
              And I wanted that for myself. And even more, for my daughter.
            </p>
          </div>

          {/* Jeyscent Became */}
          <div className="mb-16">
            <p className="text-lg text-charcoal leading-[1.9] mb-6">
              So Jeyscent became a mix of purpose, faith, growth, and
              a little bit of &ldquo;let me try this and see&rdquo; 
            </p>
            <p className="text-lg text-charcoal leading-[1.9] mb-6">
              Today, we&apos;re creating scents that make your space feel
              calm, fresh, and a little bit luxurious… without breaking the
              bank 
            </p>
          </div>

          {/* Closing */}
          <div className="text-center mb-16">
            <div className="luxury-divider mx-auto mb-8" />
            <p
              className="text-2xl lg:text-3xl leading-relaxed italic mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              And this? This is just the beginning.
            </p>
            <p className="text-lg text-charcoal">
              From my baby girl… and her mum 🤍
            </p>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/shop"
              className="btn-luxury inline-block bg-black text-white px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-all duration-400"
            >
              Explore the Collection
            </Link>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 lg:py-28 bg-cream">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <p className="text-[10px] uppercase tracking-[5px] text-muted mb-4">
              What We Stand For
            </p>
            <h2
              className="text-3xl lg:text-4xl tracking-wide"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Built on These
            </h2>
            <div className="luxury-divider mx-auto mt-6" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
            {[
              {
                title: "Purpose",
                description:
                  "Every fragrance we create carries meaning. From Ruth's loyalty to Proverbs' wisdom — nothing is random.",
                icon: "",
              },
              {
                title: "Faith",
                description:
                  "Jeyscent was born from believing in something before seeing it. That faith continues to drive everything we do.",
                icon: "🤍",
              },
              {
                title: "Growth",
                description:
                  "We started small small. And we're growing — one beautiful scent at a time. This journey is ours.",
                icon: "🌱",
              },
              {
                title: "Empowerment",
                description:
                  "When a woman builds, she builds for generations. Jeyscent is that — a legacy in the making.",
                icon: "👑",
              },
            ].map((value) => (
              <div key={value.title} className="text-center">
                <span className="text-3xl mb-4 block">{value.icon}</span>
                <h3
                  className="text-xl mb-3 tracking-wide"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {value.title}
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}