export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p
          className="text-lg tracking-[4px] uppercase text-muted"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Jey Scent
        </p>
      </div>
    </div>
  );
}