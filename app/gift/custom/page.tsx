import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/gift/PageHero";

export const metadata: Metadata = {
  title: "Custom Hampers",
  description:
    "Build your own gift hamper or order in bulk. Every hamper includes a free personalised message card.",
};

const OPTIONS = [
  {
    href: "/custom/build",
    eyebrow: "Made by you",
    title: "Build Your Own Hamper",
    text: "Pick a box, fill it with Jey Scent fragrances, treats and keepsakes, and see your total as you go.",
    cta: "Start Building",
  },
  {
    href: "/quote",
    eyebrow: "10+ gifts",
    title: "Bulk Orders",
    text: "Gifting a whole team, guest list or client base? Get volume pricing, logo branding and multi-address delivery.",
    cta: "Request a Quote",
  },
];

const PERSONALISATION = [
  { title: "Recipient's name", text: "So the gift arrives addressed to the right person." },
  { title: "Handwritten message card", text: "Up to 200 characters, written by hand on a Jey Scent card." },
  { title: "Preferred delivery date", text: "Tell us when it should arrive and we'll plan around it." },
];

export default function CustomHampersPage() {
  return (
    <div className="page-transition">
      <PageHero
        eyebrow="Jey Scent Gifting"
        title="Custom Hampers"
        intro="When nothing off the shelf feels quite right — create a gift that's entirely theirs."
      />

      <section className="max-w-6xl mx-auto px-6 lg:px-12 py-20 lg:py-24">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {OPTIONS.map((o) => (
            <Link
              key={o.href}
              href={o.href}
              className="group border border-gray-200 hover:border-black transition-colors p-10 lg:p-12 flex flex-col"
            >
              <p className="text-[10px] uppercase tracking-[4px] text-[#a8844a] mb-3">{o.eyebrow}</p>
              <h2 className="font-serif text-2xl lg:text-3xl tracking-wide mb-4">{o.title}</h2>
              <p className="text-muted leading-relaxed mb-8 flex-1">{o.text}</p>
              <span className="text-[11px] uppercase tracking-[3px] border-b border-black pb-1 self-start">
                {o.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section id="personalise" className="bg-cream scroll-mt-24">
        <div className="max-w-5xl mx-auto px-6 lg:px-12 py-20 lg:py-24 text-center">
          <p className="text-[10px] uppercase tracking-[5px] text-muted mb-3">Included free</p>
          <h2 className="font-serif text-2xl lg:text-3xl tracking-wide mb-4">Personalise every gift</h2>
          <div className="luxury-divider mx-auto mb-6" />
          <p className="text-muted max-w-2xl mx-auto mb-12">
            Every hamper, whether ready-made or one you build, can be personalised at no extra cost
            — just fill in the details when you add it to your cart.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 text-left">
            {PERSONALISATION.map((p) => (
              <div key={p.title} className="bg-white p-8">
                <h3 className="font-serif text-lg tracking-wide mb-2">{p.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
