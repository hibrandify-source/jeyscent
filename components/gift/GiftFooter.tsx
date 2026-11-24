import Link from "next/link";
import { MAIN_SITE_URL } from "@/lib/site";
import { getOccasionsByGroup } from "@/data/gifting";

const linkClass = "text-white/40 text-sm hover:text-white transition-colors duration-300";

export default function GiftFooter() {
  const corporate = getOccasionsByGroup("corporate");
  const personal = getOccasionsByGroup("personal").slice(0, 6);

  return (
    <footer className="bg-black text-white">
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-14 lg:py-16 flex flex-col lg:flex-row items-center justify-between gap-6 text-center lg:text-left">
          <div>
            <h3 className="text-2xl lg:text-3xl tracking-wide font-serif mb-2">
              Gifting for your whole team?
            </h3>
            <p className="text-white/50 text-sm">
              Tell us about your occasion, quantity and budget — we&apos;ll put together a tailored quote.
            </p>
          </div>
          <Link
            href="/quote"
            className="btn-luxury inline-block bg-white text-black px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-cream transition-colors flex-shrink-0"
          >
            Request a Quote
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          <div>
            <h4 className="text-xl tracking-[5px] uppercase font-serif">Jey Scent</h4>
            <p className="text-[10px] tracking-[6px] uppercase text-[#c9a96e] mb-4">Gifting</p>
            <p className="text-white/40 text-sm leading-relaxed">
              Thoughtfully curated. Beautifully gifted. Hampers and gifts for
              companies, families and the people who matter.
            </p>
          </div>

          <div>
            <h5 className="text-[11px] uppercase tracking-[3px] mb-6 text-white/70">Corporate</h5>
            <ul className="space-y-3">
              {corporate.map((o) => (
                <li key={o.slug}>
                  <Link href={`/corporate/${o.slug}`} className={linkClass}>{o.title}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-[11px] uppercase tracking-[3px] mb-6 text-white/70">Personal</h5>
            <ul className="space-y-3">
              {personal.map((o) => (
                <li key={o.slug}>
                  <Link href={`/personal/${o.slug}`} className={linkClass}>{o.title}</Link>
                </li>
              ))}
              <li>
                <Link href="/personal" className={linkClass}>All occasions →</Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-[11px] uppercase tracking-[3px] mb-6 text-white/70">Jey Scent Gifting</h5>
            <ul className="space-y-3">
              <li><Link href="/custom/build" className={linkClass}>Build Your Own Hamper</Link></li>
              <li><Link href="/christmas" className={linkClass}>Christmas Collection</Link></li>
              <li><Link href="/about" className={linkClass}>About</Link></li>
              <li><Link href="/contact" className={linkClass}>Contact Us</Link></li>
              <li><a href={`${MAIN_SITE_URL}/dashboard`} className={linkClass}>My Account</a></li>
              <li><a href={MAIN_SITE_URL} className={linkClass}>← Jey Scent</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 text-center">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Jey Scent Gifting. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
