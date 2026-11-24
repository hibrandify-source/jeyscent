import { getOccasionsByGroup } from "@/data/gifting";

// Gifting storefront navigation. Hrefs are gift.jeyscent.com paths (proxy.ts
// maps them onto app/gift/*).

export interface GiftNavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

export const giftNav: GiftNavItem[] = [
  {
    label: "Corporate Gifting",
    href: "/corporate",
    children: getOccasionsByGroup("corporate").map((o) => ({
      label: o.title,
      href: `/corporate/${o.slug}`,
    })),
  },
  {
    label: "Personal Gifting",
    href: "/personal",
    children: getOccasionsByGroup("personal").map((o) => ({
      label: o.title,
      href: `/personal/${o.slug}`,
    })),
  },
  { label: "Christmas", href: "/christmas" },
  {
    label: "Custom Hampers",
    href: "/custom",
    children: [
      { label: "Build Your Own Hamper", href: "/custom/build" },
      { label: "Personalise Your Gift", href: "/custom#personalise" },
      { label: "Bulk Orders", href: "/quote" },
    ],
  },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];
