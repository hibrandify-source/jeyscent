import Link from "next/link";

export default function GiftNotFound() {
  return (
    <div className="min-h-[70vh] pt-24 flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-8xl font-light text-light-gray mb-6 font-serif">404</p>
        <h1 className="text-2xl lg:text-3xl mb-4 tracking-wide font-serif">
          We couldn&apos;t find that gift
        </h1>
        <p className="text-muted text-sm mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link
          href="/"
          className="inline-block bg-black text-white px-10 py-4 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-colors"
        >
          Back to Gifting
        </Link>
      </div>
    </div>
  );
}
