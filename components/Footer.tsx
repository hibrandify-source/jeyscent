// components/Footer.tsx
import Link from "next/link";
import NewsletterForm from './NewsletterForm';

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-20 text-center">
          <h3
            className="text-2xl lg:text-3xl mb-3 tracking-wide"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Stay in the Know
          </h3>
          <p className="text-white/50 text-sm mb-8 max-w-md mx-auto">
            Be the first to discover new fragrances, exclusive offers, and
            stories from the Jey Scent world.
          </p>
          <div className="max-w-md mx-auto">
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <h4
              className="text-xl tracking-[5px] uppercase mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Jey Scent
            </h4>
            <p className="text-white/40 text-sm leading-relaxed mb-6">
              Creating scents that make your space feel calm, fresh, and a
              little bit luxurious — without breaking the bank.
            </p>
            <div className="flex gap-5">
              <a
                href="https://instagram.com/jeyscent"
                target="_blank"
                rel="noreferrer"
                className="text-white/40 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a
                href="https://twitter.com/jeyscent"
                target="_blank"
                rel="noreferrer"
                className="text-white/40 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://tiktok.com/@jeyscent"
                target="_blank"
                rel="noreferrer"
                className="text-white/40 hover:text-white transition-colors"
                aria-label="TikTok"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.52a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.72a8.19 8.19 0 004.76 1.52V6.79a4.84 4.84 0 01-1-.1z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h5 className="text-[11px] uppercase tracking-[3px] mb-6 text-white/70">
              Shop
            </h5>
            <ul className="space-y-3">
              {[
                "Reed Diffusers",
                "Car Diffusers",
                "Refill Bottle",
                "Room Sprays",
                "Subscriptions",
              ].map((item) => (
                <li key={item}>
                  <Link
                    href="/shop"
                    className="text-white/40 text-sm hover:text-white transition-colors duration-300"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h5 className="text-[11px] uppercase tracking-[3px] mb-6 text-white/70">
              Company
            </h5>
            <ul className="space-y-3">
              {[
                { label: "Our Story", href: "/our-story" },
                { label: "Journal", href: "/blog" },
                { label: "My Account", href: "/dashboard" },
                { label: "Track Order", href: "/dashboard" },
                { label: "Jey Craft", href: "/jeycraft" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-white/40 text-sm hover:text-white transition-colors duration-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h5 className="text-[11px] uppercase tracking-[3px] mb-6 text-white/70">
              Get in Touch
            </h5>
            <ul className="space-y-3">
              <li className="text-white/40 text-sm">jeyscentng@gmail.com</li>
              <li className="text-white/40 text-sm">Lagos, Nigeria</li>
              <li>
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`}
                  className="text-white/40 text-sm hover:text-white transition-colors"
                >
                  Chat on WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-[11px] tracking-[2px] uppercase">
            © 2026 Jey Scent. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-white/30 text-[11px] tracking-[1px] hover:text-white/60 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="#"
              className="text-white/30 text-[11px] tracking-[1px] hover:text-white/60 transition-colors"
            >
              Terms
            </Link>
            <Link
              href="#"
              className="text-white/30 text-[11px] tracking-[1px] hover:text-white/60 transition-colors"
            >
              Shipping
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}