import { notFound } from "next/navigation";

// Unmatched gift.jeyscent.com paths land here so they render the gifting
// 404 (app/gift/not-found.tsx, inside the gifting layout) instead of the
// main site's global one.
export default function GiftMissingPage() {
  notFound();
}
