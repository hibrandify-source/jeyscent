import Link from "next/link";

export default function QuoteBanner({
  occasion,
  title = "Let's plan your corporate gifts",
  text = "Share your occasion, quantity, budget and branding needs — we'll come back with curated options and a tailored quote within 1–2 business days.",
}: {
  occasion?: string;
  title?: string;
  text?: string;
}) {
  const href = occasion ? `/quote?occasion=${encodeURIComponent(occasion)}` : "/quote";
  return (
    <section className="bg-cream">
      <div className="max-w-4xl mx-auto px-6 py-16 lg:py-20 text-center">
        <h2 className="font-serif text-2xl lg:text-3xl tracking-wide mb-4">{title}</h2>
        <div className="luxury-divider mx-auto mb-6" />
        <p className="text-muted leading-relaxed mb-8 max-w-2xl mx-auto">{text}</p>
        <Link
          href={href}
          className="btn-luxury inline-block bg-black text-white px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-colors"
        >
          Request a Quote
        </Link>
      </div>
    </section>
  );
}
