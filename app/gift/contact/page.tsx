import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/gift/PageHero";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Jey Scent Gifting team by WhatsApp or email.",
};

const CONTACT_EMAIL = "jeyscentng@gmail.com";

export default function GiftContactPage() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const whatsappText = encodeURIComponent("Hi! I'd like some help choosing a gift 🎁");

  const cards = [
    {
      title: "WhatsApp",
      text: "The quickest way to reach us — for gift ideas, order questions or delivery updates.",
      cta: "Chat on WhatsApp",
      href: `https://wa.me/${whatsapp}?text=${whatsappText}`,
      external: true,
    },
    {
      title: "Email",
      text: CONTACT_EMAIL,
      cta: "Send an email",
      href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Jey Scent Gifting enquiry")}`,
      external: true,
    },
    {
      title: "Corporate & bulk",
      text: "Gifting for a team, event or client list? Send us your brief for a tailored quote.",
      cta: "Request a Quote",
      href: "/quote",
      external: false,
    },
  ];

  return (
    <div className="page-transition">
      <PageHero
        eyebrow="We'd love to help"
        title="Contact Us"
        intro="Questions about a gift, a delivery date or something custom? Our team is happy to help."
      />

      <section className="max-w-6xl mx-auto px-6 lg:px-12 py-20 grid md:grid-cols-3 gap-6">
        {cards.map((c) => {
          const inner = (
            <>
              <h2 className="font-serif text-xl tracking-wide mb-3">{c.title}</h2>
              <p className="text-sm text-muted leading-relaxed mb-8 flex-1 break-words">{c.text}</p>
              <span className="text-[11px] uppercase tracking-[3px] border-b border-black pb-1 self-start">
                {c.cta} →
              </span>
            </>
          );
          const className =
            "border border-gray-200 hover:border-black transition-colors p-8 lg:p-10 flex flex-col";
          return c.external ? (
            <a key={c.title} href={c.href} className={className} target="_blank" rel="noopener noreferrer">
              {inner}
            </a>
          ) : (
            <Link key={c.title} href={c.href} className={className}>
              {inner}
            </Link>
          );
        })}
      </section>

      <section className="bg-cream">
        <div className="max-w-3xl mx-auto px-6 py-14 text-center">
          <p className="text-[10px] uppercase tracking-[4px] text-muted mb-2">Studio</p>
          <p className="text-sm">Abijo GRA, Lagos, Nigeria</p>
        </div>
      </section>
    </div>
  );
}
