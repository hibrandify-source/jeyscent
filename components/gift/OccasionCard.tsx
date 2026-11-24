import Link from "next/link";
import Image from "next/image";
import type { Occasion } from "@/lib/types";

export default function OccasionCard({ occasion }: { occasion: Occasion }) {
  return (
    <Link
      href={`/${occasion.group}/${occasion.slug}`}
      className="group relative block aspect-[4/3] overflow-hidden bg-light-gray"
    >
      <Image
        src={occasion.image}
        alt=""
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <h3 className="font-serif text-xl tracking-wide mb-1">{occasion.title}</h3>
        <p className="text-xs text-white/75 leading-relaxed line-clamp-2">{occasion.blurb}</p>
      </div>
    </Link>
  );
}
