import type {
  Occasion,
  OccasionGroup,
  Hamper,
  HamperBox,
  BuilderItem,
} from "@/lib/types";
import { products, getSalePrice } from "@/data/products";

// ── Jey Scent Gifting catalogue (gift.jeyscent.com) ─────────────────────────
// Prices here are FINAL selling prices in naira — unlike data/products.ts, no
// 2% gateway fee is added on top. (Jey Scent products inside the builder are
// priced with getSalePrice so they cost the same as in the shop.)
//
// Images are placeholders — replace with Cloudinary URLs before launch.

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=80";

// ── Occasions ────────────────────────────────────────────────────────────────

export const occasions: Occasion[] = [
  // Corporate
  {
    slug: "employee-onboarding",
    title: "Employee Onboarding",
    group: "corporate",
    blurb:
      "Welcome new hires with a thoughtful first-day gift that says they belong.",
    image: PLACEHOLDER_IMAGE,
  },
  {
    slug: "employee-appreciation",
    title: "Employee Appreciation",
    group: "corporate",
    blurb:
      "Celebrate milestones, wins and long service with gifts your team will remember.",
    image: PLACEHOLDER_IMAGE,
  },
  {
    slug: "executive",
    title: "Executive Gifting",
    group: "corporate",
    blurb:
      "Refined, premium hampers for directors, board members and senior leaders.",
    image: PLACEHOLDER_IMAGE,
  },
  {
    slug: "client-appreciation",
    title: "Client Appreciation",
    group: "corporate",
    blurb:
      "Strengthen relationships with clients and partners through considered gifting.",
    image: PLACEHOLDER_IMAGE,
  },
  {
    slug: "corporate-events",
    title: "Corporate Events",
    group: "corporate",
    blurb:
      "Conference, launch and retreat gifts — branded, packed and delivered at scale.",
    image: PLACEHOLDER_IMAGE,
  },
  {
    slug: "corporate-christmas",
    title: "Corporate Christmas",
    group: "corporate",
    blurb:
      "End-of-year hampers for staff, clients and partners, delivered before the holidays.",
    image: PLACEHOLDER_IMAGE,
  },
  // Personal
  {
    slug: "birthday",
    title: "Birthday",
    group: "personal",
    blurb: "Make their day feel special with a gift curated just for them.",
    image: PLACEHOLDER_IMAGE,
  },
  {
    slug: "valentines",
    title: "Valentine's Day",
    group: "personal",
    blurb: "Romantic, indulgent gifts for the one who has your heart.",
    image: PLACEHOLDER_IMAGE,
  },
  {
    slug: "mothers-day",
    title: "Mother's Day",
    group: "personal",
    blurb: "Calm, comfort and a little luxury for the women who raised us.",
    image: PLACEHOLDER_IMAGE,
  },
  {
    slug: "fathers-day",
    title: "Father's Day",
    group: "personal",
    blurb: "Understated, considered gifts for the men who show up.",
    image: PLACEHOLDER_IMAGE,
  },
  {
    slug: "wedding-anniversary",
    title: "Wedding & Anniversary",
    group: "personal",
    blurb: "Celebrate love and new beginnings with a gift for their home.",
    image: PLACEHOLDER_IMAGE,
  },
  {
    slug: "new-baby",
    title: "New Baby",
    group: "personal",
    blurb: "Gentle, soothing gifts to welcome a little one and pamper the parents.",
    image: PLACEHOLDER_IMAGE,
  },
  {
    slug: "housewarming",
    title: "Housewarming",
    group: "personal",
    blurb: "Help a new house feel like home from the very first day.",
    image: PLACEHOLDER_IMAGE,
  },
  {
    slug: "just-because",
    title: "Just Because",
    group: "personal",
    blurb: "No occasion needed — sometimes the best gifts are unexpected.",
    image: PLACEHOLDER_IMAGE,
  },
];

// ── Ready-made hampers ───────────────────────────────────────────────────────

export const hampers: Hamper[] = [
  {
    id: "essentials-box",
    name: "The Essentials Box",
    price: 40000,
    description:
      "A thoughtful everyday gift — a Jey Scent room spray, a notepad and pen, and a mug, presented in our signature gift box. Perfect for welcoming and thanking your people.",
    contents: [
      "Jey Scent Room Spray (50ml)",
      "Notepad & pen",
      "Mug",
      "Signature gift box",
    ],
    image: PLACEHOLDER_IMAGE,
    gallery: [PLACEHOLDER_IMAGE],
    occasions: [
      "employee-onboarding",
      "employee-appreciation",
      "corporate-events",
      "corporate-christmas",
      "birthday",
      "housewarming",
      "just-because",
    ],
    audience: "both",
    featured: true,
    inStock: true,
  },
  {
    id: "signature-box",
    name: "The Signature Box",
    price: 60000,
    description:
      "Our most-loved gift: a Jey Scent room spray with a vacuum flask, power bank, and notepad and pen — practical, beautiful and made to be used every day.",
    contents: [
      "Jey Scent Room Spray (100ml)",
      "Vacuum flask",
      "Power bank",
      "Notepad & pen",
      "Signature gift box",
    ],
    image: PLACEHOLDER_IMAGE,
    gallery: [PLACEHOLDER_IMAGE],
    occasions: [
      "employee-appreciation",
      "client-appreciation",
      "corporate-christmas",
      "birthday",
      "mothers-day",
      "fathers-day",
      "wedding-anniversary",
      "just-because",
    ],
    audience: "both",
    featured: true,
    inStock: true,
  },
  {
    id: "executive-box",
    name: "The Executive Box",
    price: 100000,
    description:
      "A premium statement gift for leaders and valued clients — headphones, a power bank, a vacuum flask, a notepad and pen set and a Jey Scent reed diffuser, in premium packaging.",
    contents: [
      "Jey Scent Reed Diffuser",
      "Headphones",
      "Power bank",
      "Vacuum flask",
      "Notepad & pen set",
      "Premium packaging",
    ],
    image: PLACEHOLDER_IMAGE,
    gallery: [PLACEHOLDER_IMAGE],
    occasions: [
      "executive",
      "client-appreciation",
      "corporate-christmas",
      "fathers-day",
      "birthday",
    ],
    audience: "both",
    featured: true,
    inStock: true,
  },
];

// ── Build-your-own hamper ────────────────────────────────────────────────────
// Prices are roughly cost + 40% (rounded to the nearest ₦500), in line with
// the margin on the ready-made boxes.

export const hamperBoxes: HamperBox[] = [
  {
    id: "signature-gift-box",
    name: "Signature Gift Box",
    description: "Our signature box with tissue and ribbon, up to 5 items.",
    basePrice: 14000,
    capacity: 5,
    image: PLACEHOLDER_IMAGE,
  },
  {
    id: "executive-packaging",
    name: "Executive Packaging",
    description: "Premium rigid packaging for up to 7 items.",
    basePrice: 18000,
    capacity: 7,
    image: PLACEHOLDER_IMAGE,
  },
];

/** Jey Scent products offered in the builder, at the same price as the shop. */
const SCENT_PICKS: { productId: string; size: string }[] = [
  { productId: "ruth-room-spray", size: "50ml" },
  { productId: "proverbs-room-spray", size: "50ml" },
  { productId: "ruth-room-spray", size: "100ml" },
  { productId: "proverbs-room-spray", size: "100ml" },
  { productId: "ruth-reed-diffuser", size: "100ml" },
  { productId: "proverbs-reed-diffuser", size: "100ml" },
  { productId: "ruth-car-diffuser", size: "10ml" },
  { productId: "proverbs-car-diffuser", size: "10ml" },
];

const scentItems: BuilderItem[] = SCENT_PICKS.flatMap(({ productId, size }) => {
  const product = products.find((p) => p.id === productId);
  const sizeInfo = product?.sizes.find((s) => s.size === size);
  if (!product || !sizeInfo) return [];
  return [
    {
      id: `${productId}-${size}`,
      name: `${product.name} (${size})`,
      category: "scent" as const,
      price: getSalePrice(sizeInfo.price),
      image: product.image,
      inStock: sizeInfo.inStock,
    },
  ];
});

export const builderItems: BuilderItem[] = [
  ...scentItems,
  {
    id: "power-bank",
    name: "Power Bank",
    category: "tech",
    price: 21500,
    image: PLACEHOLDER_IMAGE,
    inStock: true,
  },
  {
    id: "headphones",
    name: "Headphones",
    category: "tech",
    price: 40500,
    image: PLACEHOLDER_IMAGE,
    inStock: true,
  },
  {
    id: "vacuum-flask",
    name: "Vacuum Flask",
    category: "keepsake",
    price: 11000,
    image: PLACEHOLDER_IMAGE,
    inStock: true,
  },
  {
    id: "notepad-pen",
    name: "Notepad & Pen Set",
    category: "keepsake",
    price: 9000,
    image: PLACEHOLDER_IMAGE,
    inStock: true,
  },
  {
    id: "mug",
    name: "Mug",
    category: "keepsake",
    price: 7500,
    image: PLACEHOLDER_IMAGE,
    inStock: true,
  },
];

export const BUILDER_CATEGORY_LABELS: Record<BuilderItem["category"], string> = {
  scent: "Jey Scent",
  tech: "Tech",
  keepsake: "Keepsakes",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

export const GIFT_MESSAGE_MAX = 200;

export function getOccasion(slug: string, group?: OccasionGroup) {
  return occasions.find((o) => o.slug === slug && (!group || o.group === group));
}

export function getOccasionsByGroup(group: OccasionGroup) {
  return occasions.filter((o) => o.group === group);
}

export function getHamper(id: string) {
  return hampers.find((h) => h.id === id);
}

export function getHampersByOccasion(slug: string) {
  return hampers.filter((h) => h.occasions.includes(slug));
}

export function getHampersByAudience(group: OccasionGroup) {
  return hampers.filter((h) => h.audience === group || h.audience === "both");
}

/**
 * The Christmas collection: Christmas specials (seasonal: "christmas", which
 * also shows a badge on the card) plus every hamper suited to corporate
 * Christmas gifting.
 */
export function getChristmasHampers() {
  return hampers.filter(
    (h) => h.seasonal === "christmas" || h.occasions.includes("corporate-christmas")
  );
}

export function getFeaturedHampers() {
  return hampers.filter((h) => h.featured);
}

export function getHamperBox(id: string) {
  return hamperBoxes.find((b) => b.id === id);
}

export function getBuilderItem(id: string) {
  return builderItems.find((i) => i.id === id);
}

/**
 * Server-trusted price of a custom hamper (final selling price), or an error
 * when the selection is invalid. Item ids may repeat (two of the same item).
 */
export function priceCustomHamper(
  boxId: string,
  itemIds: string[]
): { ok: true; price: number; box: HamperBox; items: BuilderItem[] } | { ok: false; error: string } {
  const box = getHamperBox(boxId);
  if (!box) return { ok: false, error: "Invalid hamper box" };
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return { ok: false, error: "Your custom hamper is empty" };
  }
  if (itemIds.length > box.capacity) {
    return { ok: false, error: `The ${box.name} holds up to ${box.capacity} items` };
  }
  const items: BuilderItem[] = [];
  for (const id of itemIds) {
    const item = getBuilderItem(id);
    if (!item) return { ok: false, error: "Invalid hamper item" };
    if (!item.inStock) return { ok: false, error: `${item.name} is out of stock` };
    items.push(item);
  }
  const price = box.basePrice + items.reduce((sum, i) => sum + i.price, 0);
  return { ok: true, price, box, items };
}

/** Lowest charged price across a set of hampers, for "from ₦X" labels. */
export function fromPrice(list: Hamper[]): number | null {
  if (list.length === 0) return null;
  return Math.min(...list.map((h) => h.price));
}
