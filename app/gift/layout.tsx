import type { Metadata } from "next";
import { GiftCartProvider } from "@/context/GiftCartContext";
import GiftHeader from "@/components/gift/GiftHeader";
import GiftFooter from "@/components/gift/GiftFooter";
import { GIFT_SITE_URL } from "@/lib/site";

// Jey Scent Gifting storefront, served at gift.jeyscent.com (proxy.ts rewrites
// that host onto this segment).
export const metadata: Metadata = {
  metadataBase: new URL(GIFT_SITE_URL),
  title: {
    default: "Jey Scent Gifting — Thoughtfully Curated. Beautifully Gifted.",
    template: "%s | Jey Scent Gifting",
  },
  description:
    "Curated gift hampers for companies, families and every occasion — corporate gifting, birthdays, weddings, Christmas and build-your-own hampers from Jey Scent.",
  openGraph: {
    title: "Jey Scent Gifting",
    description: "Thoughtfully curated. Beautifully gifted.",
    type: "website",
    url: "/",
  },
};

export default function GiftLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GiftCartProvider>
      <GiftHeader />
      <main className="flex-1">{children}</main>
      <GiftFooter />
    </GiftCartProvider>
  );
}
