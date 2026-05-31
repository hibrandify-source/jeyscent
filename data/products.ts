import { Product } from "@/lib/types";

// ── Price Config ─────────────────────────────────────────────────────────────
const FEE_MULTIPLIER = 1.02; // 2% baked in to cover gateway fees silently
const DISCOUNT_MULTIPLIER = 0.90; // 10% off for buyer

// ── Price Helpers ─────────────────────────────────────────────────────────────

/**
 * Internal base price after fee buffer is applied.
 * This is what gets shown SLASHED (crossed out).
 * e.g. 15000 → 15300
 */
export const getBasePrice = (storePrice: number) =>
  Math.round(storePrice * FEE_MULTIPLIER);

/**
 * Sale price — 10% off the fee-buffered base.
 * This is what buyer SEES and what gets CHARGED at checkout.
 * e.g. 15000 → 15300 × 0.90 = 13770
 */
export const getSalePrice = (storePrice: number) =>
  Math.round(getBasePrice(storePrice) * DISCOUNT_MULTIPLIER);

/**
 * Slashed / "was" price shown crossed out on product pages.
 * Same as getBasePrice — just a semantic alias for clarity.
 * e.g. 15000 → 15300
 */
export const getOriginalDisplayPrice = (storePrice: number) =>
  getBasePrice(storePrice);

/** Formatted price string */
export function formatPrice(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

// ── Products ──────────────────────────────────────────────────────────────────
// Store prices as clean originals — helpers above handle all calculations.
// To add a new product, just enter the raw price you want. No math needed.

export const products: Product[] = [
  // ===== RUTH COLLECTION =====
  {
    id: "ruth-reed-diffuser",
    name: "Ruth Reed Diffuser",
    fragrance: "Ruth",
    type: "Reed Diffuser",
    sizes: [
      { size: "50ml", price: 10100, inStock: true },
      { size: "100ml", price: 14500, inStock: true },
      { size: "200ml", price: 20700, inStock: true },
    ],
    description:
      "A soft, comforting blend that fills your space with warmth, calm, and gentle sweetness. Delicate yet memorable — like home in a bottle.",
    longDescription:
      "Inspired by the story of Ruth — loyalty, gentleness, and quiet strength — this fragrance was created to bring comfort into everyday spaces. Ruth blends creamy strawberry notes with soft vanilla and delicate florals, creating a scent that feels warm, peaceful, and inviting. Designed for bedrooms, cozy corners, and intimate spaces, the reed diffuser slowly releases fragrance for a continuous scent experience that feels calm and effortless.",
    image:
      "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766380/reed_diffuser-3_bskomi.jpg",
    gallery: [
      "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766380/reed_diffuser-3_bskomi.jpg",
      "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766380/reed_diffusser-1_yzqx0u.jpg",
      "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766381/reed_diffuser-2_rushfx.jpg",
    ],
    duration: "Lasts up to 2-3 months",
    features: [
      "Natural reed sticks included",
      "Alcohol-free formula",
      "Long-lasting fragrance",
      "Elegant glass bottle",
      "Perfect for bedrooms and cozy spaces",
    ],
  },
  {
    id: "ruth-car-diffuser",
    name: "Ruth Car Diffuser",
    fragrance: "Ruth",
    type: "Car Diffuser",
    sizes: [
      { size: "10ml", price: 4000, inStock: true },
    ],
    description:
      "A sweet, calming fragrance that keeps your car feeling fresh, cozy, and beautifully inviting.",
    longDescription:
      "The Ruth Car Diffuser was created for those who love soft, comforting scents even while on the move. Inspired by warmth, gentleness, and everyday elegance, this fragrance combines creamy sweetness with subtle floral notes to create a relaxing atmosphere inside your vehicle. Compact yet effective, it delivers a continuous scent experience without being overwhelming.",
    image:
      "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766381/car_diffuser_wswkto.jpg",
    gallery: [
      "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766381/car_diffuser_wswkto.jpg",
      "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776767140/car-diffuser-2_bwfwwn.jpg",
    ],
    duration: "Lasts 4–6 weeks depending on car usage",
    features: [
      "Alcohol-free formula",
      "Long-lasting scent diffusion",
      "Vent clip included",
      "Leak-proof design",
      "Compact & elegant",
      "Easy to hang and use",
    ],
  },
  {
    id: "ruth-room-spray",
    name: "Ruth Room Spray",
    fragrance: "Ruth",
    type: "Room Spray",
    sizes: [
      { size: "50ml", price: 6500, inStock: true },
      { size: "100ml", price: 10000, inStock: true },
    ],
    description:
      "A soft and cozy fragrance designed to instantly refresh your space with warmth, sweetness, and comfort.",
    longDescription:
      "Inspired by peace, softness, and the feeling of home, Ruth Room Spray delivers an instant burst of comforting fragrance into your environment. The creamy sweetness and subtle floral notes create a calming atmosphere perfect for bedrooms, linens, curtains, and everyday living. Crafted to feel light yet noticeable, Ruth transforms ordinary spaces into warm, inviting moments.",
    image:
      "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766380/room_spray_ajb3n5.jpg",
    gallery: [
      "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766380/room_spray_ajb3n5.jpg",
    ],
    duration: "Scent lasts several hours per spray",
    features: [
      "Fine mist nozzle",
      "Alcohol-free, Non-staining formula",
      "Safe for linens and fabrics",
      "Instant fragrance",
      "Soft and comforting scent profile",
      "Perfect for everyday use",
    ],
  },
  {
    id: "ruth-refill-bottle",
    name: "Ruth Refill Bottle",
    fragrance: "Ruth",
    type: "Refill Bottle",
    sizes: [
      { size: "100ml", price: 12500, inStock: true },
      { size: "250ml", price: 22100, inStock: true },
    ],
    description:
      "A soft and comforting refill designed to keep your space consistently warm, cozy, and beautifully scented.",
    longDescription:
      "Inspired by gentleness, loyalty, and the comforting feeling of home, the Ruth Refill allows you to continue enjoying your favorite fragrance without replacing your diffuser bottle. Blending creamy sweetness with soft floral warmth, this refill is perfect for refreshing your reed diffusers and maintaining a calm, inviting atmosphere in your space. Thoughtfully crafted for long-lasting use and effortless everyday luxury.",
    image:
      "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766380/refill_bottle_b2ic8h.jpg",
    gallery: [
      "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766380/refill_bottle_b2ic8h.jpg",
    ],
    duration: "Refills diffuser bottles multiple times depending on size",
    features: [
      "Pour-friendly bottle design",
      "Compatible with all JeyScent vessels",
      "Eco-friendly; reuse your diffuser",
      "Best value for loyal Ruth lovers",
    ],
  },

  // ===== PROVERBS COLLECTION =====
  {
    id: "proverbs-reed-diffuser",
    name: "Proverbs Reed Diffuser",
    fragrance: "Proverbs",
    type: "Reed Diffuser",
    sizes: [
      { size: "50ml", price: 11000, inStock: true },
      { size: "100ml", price: 16000, inStock: true },
      { size: "200ml", price: 24000, inStock: true },
    ],
    description:
      "Bold, rich, and luxurious — a statement fragrance designed to leave a lasting impression.",
    longDescription:
      "Inspired by strength, wisdom, and timeless elegance, Proverbs blends warm amber, soft musk, rose, and creamy vanilla into a deep, luxurious fragrance experience. Designed for those who love bold yet balanced scents, this reed diffuser fills your space gradually with richness and sophistication. Perfect for living rooms, offices, and spaces where presence matters.",
    image:
      "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766380/reed_diffuser-3_bskomi.jpg",
    gallery: [
      "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766380/reed_diffuser-3_bskomi.jpg",
      "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766381/reed_diffuser-2_rushfx.jpg",
    ],
    duration: "Lasts up to 2-3 months",
    features: [
      "Natural reed sticks included",
      "Alcohol-free formula",
      "Long-lasting fragrance",
      "Elegant reusable glass bottle",
      "Perfect for larger spaces",
    ],
  },
  {
    id: "proverbs-car-diffuser",
    name: "Proverbs Car Diffuser",
    fragrance: "Proverbs",
    type: "Car Diffuser",
    sizes: [
      { size: "10ml", price: 4000, inStock: true },
    ],
    description:
      "A bold and refined scent that transforms every drive into a luxurious experience.",
    longDescription:
      "Proverbs Car Diffuser was inspired by confidence, elegance, and strong first impressions. The rich blend of amber, musk, vanilla, and rose creates a warm, sophisticated atmosphere that keeps your vehicle smelling refined and inviting. Designed for lovers of bold fragrances, it delivers a noticeable scent experience while maintaining balance and comfort.",
    image:
      "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766381/car_diffuser_wswkto.jpg",
    gallery: [
      "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766381/car_diffuser_wswkto.jpg",
      "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776767140/car-diffuser-2_bwfwwn.jpg",
    ],
    duration: "Lasts 4–6 weeks depending on car usage",
    features: [
      "Alcohol-free formula",
      "Long-lasting fragrance",
      "Elegant hanging diffuser design",
      "Ideal for cars and compact spaces",
      "Bold luxury-inspired scent",
    ],
  },
  {
    id: "proverbs-room-spray",
    name: "Proverbs Room Spray",
    fragrance: "Proverbs",
    type: "Room Spray",
    sizes: [
      { size: "50ml", price: 7000, inStock: true },
      { size: "100ml", price: 12000, inStock: true },
    ],
    description:
      "A rich and luxurious room spray that instantly elevates your space with bold warmth and elegance.",
    longDescription:
      "Crafted for lovers of strong, sophisticated scents, Proverbs Room Spray combines amber, musk, rose, and vanilla into a fragrance that feels powerful yet refined. Inspired by confidence and quiet luxury, this spray refreshes rooms, linens, curtains, and interiors with a scent designed to stand out beautifully.",
    image:
      "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766380/room_spray_ajb3n5.jpg",
    gallery: [
      "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766380/room_spray_ajb3n5.jpg",
    ],
    duration: "Scent lasts several hours per spray",
    features: [
      "Fine mist nozzle",
      "Alcohol-free, Non-staining formula",
      "Safe for linens and fabrics",
      "Instant fragrance",
      "Designed for luxury everyday living",
    ],
  },
  {
    id: "proverbs-refill-bottle",
    name: "Proverbs Refill Bottle",
    fragrance: "Proverbs",
    type: "Refill Bottle",
    sizes: [
      { size: "100ml", price: 14000, inStock: true },
      { size: "250ml", price: 26500, inStock: true },
    ],
    description:
      "A rich and luxurious refill crafted to keep your space bold, warm, and unforgettable.",
    longDescription:
      "Inspired by strength, elegance, and timeless sophistication, the Proverbs Refill keeps your favorite fragrance flowing beautifully through your space. The deep blend of amber, musk, vanilla, and rose creates a warm, refined atmosphere designed to leave a lasting impression. Perfect for maintaining a strong scent presence while offering a convenient and sustainable way to enjoy your diffuser longer.",
    image:
      "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766380/refill_bottle_b2ic8h.jpg",
    gallery: [
      "https://res.cloudinary.com/dkx1jje3g/image/upload/q_auto/f_auto/v1776766380/refill_bottle_b2ic8h.jpg",
    ],
    duration: "Refills diffuser bottles multiple times depending on size",
    features: [
      "Pour-friendly bottle design",
      "Compatible with all JeyScent vessels",
      "Eco-friendly; reuse your diffuser",
      "Best value for Proverbs lovers",
    ],
  },
];

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByFragrance(fragrance: string): Product[] {
  return products.filter(
    (p) => p.fragrance.toLowerCase() === fragrance.toLowerCase()
  );
}

export function getProductsByType(type: string): Product[] {
  return products.filter(
    (p) => p.type.toLowerCase() === type.toLowerCase()
  );
}