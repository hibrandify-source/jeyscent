// Black title band used at the top of gifting pages (mirrors the main shop's
// page headers).
export default function PageHero({
  eyebrow,
  title,
  intro,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
}) {
  return (
    <div className="bg-black text-white pt-36 lg:pt-44 pb-14 lg:pb-20 text-center px-6">
      {eyebrow && (
        <p className="text-[10px] uppercase tracking-[5px] text-[#c9a96e] mb-4">{eyebrow}</p>
      )}
      <h1 className="text-3xl lg:text-5xl tracking-wide font-serif">{title}</h1>
      {intro && (
        <p className="text-white/60 text-sm lg:text-base leading-relaxed max-w-2xl mx-auto mt-5">
          {intro}
        </p>
      )}
    </div>
  );
}
