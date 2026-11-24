import Link from "next/link";
import Image from "next/image";

export default function JeyCraftPage() {
  return (
    <div className="page-transition pt-24 lg:pt-28 min-h-screen flex items-center">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-light-gray">
            <Image
              src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80"
              alt="Jey Craft — Coming Soon"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span
                className="text-white text-4xl lg:text-5xl tracking-[8px] uppercase"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                JC
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="text-center lg:text-left">
            <p className="text-[10px] uppercase tracking-[5px] text-muted mb-4">
              From the Jey Scent Family
            </p>
            <h1
              className="text-4xl lg:text-5xl tracking-wide mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Jey Craft
            </h1>
            <div className="luxury-divider mx-auto lg:mx-0 mb-8" />

            <p className="text-muted leading-relaxed mb-4">
              Something beautiful is being crafted behind the scenes. Jey
              Craft is the next chapter in our story — extending the same
              love, intention, and quality you know from Jey Scent into a
              brand new world.
            </p>
            <p className="text-muted leading-relaxed mb-8">
              We can&apos;t wait to share it with you. 🤍
            </p>

            {/* Coming Soon Badge */}
            <div className="inline-block bg-black text-white px-8 py-4 mb-8">
              <p className="text-[11px] uppercase tracking-[5px]">
                Coming Soon
              </p>
            </div>

            {/* Notify Form */}
            <div>
              <p className="text-sm text-muted mb-4">
                Want to be the first to know?
              </p>
              <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto lg:mx-0">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                />
                <button
                  type="submit"
                  className="bg-black text-white px-6 py-3 text-[11px] uppercase tracking-[3px] hover:bg-charcoal transition-colors"
                >
                  Notify Me
                </button>
              </form>
            </div>

            {/* Back Link */}
            <div className="mt-10">
              <Link
                href="/"
                className="text-[11px] uppercase tracking-[3px] text-muted hover:text-black border-b border-muted hover:border-black pb-1 transition-all"
              >
                ← Back to Jey Scent
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}