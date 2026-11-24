import Link from "next/link";
import Image from "next/image";
import type { Hamper } from "@/lib/types";
import { formatPrice } from "@/data/products";

// `quoteOnly` is used on corporate pages: corporate gifts are sold by quote, so
// the card shows a "from" price and links to the hamper without a cart CTA.
export default function HamperCard({
  hamper,
  quoteOnly = false,
}: {
  hamper: Hamper;
  quoteOnly?: boolean;
}) {
  return (
    <Link href={`/hampers/${hamper.id}`} className="product-card group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-light-gray mb-5">
        <Image
          src={hamper.image}
          alt={hamper.name}
          fill
          className="product-img object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {hamper.seasonal === "christmas" && (
          <span className="absolute top-4 left-4 bg-white/90 px-3 py-1 text-[9px] uppercase tracking-[3px]">
            Christmas
          </span>
        )}
        {!hamper.inStock && (
          <span className="absolute top-4 right-4 bg-black text-white px-3 py-1 text-[9px] uppercase tracking-[3px]">
            Sold out
          </span>
        )}
      </div>
      <h3 className="font-serif text-lg tracking-wide mb-1 group-hover:underline underline-offset-4">
        {hamper.name}
      </h3>
      <p className="text-xs text-muted mb-2 line-clamp-2">{hamper.contents.join(" · ")}</p>
      <p className="text-sm">
        {quoteOnly ? (
          <span className="text-muted">
            From {formatPrice(hamper.price)} per gift
          </span>
        ) : (
          formatPrice(hamper.price)
        )}
      </p>
    </Link>
  );
}
