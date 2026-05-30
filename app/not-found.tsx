import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <p
          className="text-8xl lg:text-9xl font-light text-light-gray mb-6"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          404
        </p>
        <h1
          className="text-2xl lg:text-3xl mb-4 tracking-wide"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Page Not Found
        </h1>
        <p className="text-muted text-sm mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been
          moved. Let&apos;s get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-black text-white px-8 py-3.5 text-[11px] uppercase tracking-[4px] hover:bg-charcoal transition-all"
          >
            Go Home
          </Link>
          <Link
            href="/shop"
            className="border border-black px-8 py-3.5 text-[11px] uppercase tracking-[4px] hover:bg-black hover:text-white transition-all"
          >
            Shop Now
          </Link>
        </div>
      </div>
    </div>
  );
}