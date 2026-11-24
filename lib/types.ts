export interface ProductSize {
  size: string;
  price: number;
  inStock: boolean;
}

export interface Product {
  id: string;
  name: string;
  fragrance: "Ruth" | "Proverbs";
  type: "Reed Diffuser" | "Car Diffuser" | "Refill Bottle" | "Room Spray";
  sizes: ProductSize[];
  description: string;
  longDescription: string;
  image: string;
  gallery: string[];
  sizeImages?: Record<string, { image: string; gallery?: string[] }>;
  duration: string;
  features: string[];
}

export interface CartItem {
  productId: string;
  name: string;
  fragrance: string;
  type: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
}

export interface UserType {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface OrderType {
  id: string;
  userId: string;
  user?: { name: string; email: string };
  items: OrderItemType[];
  total: number;
  status: string;
  paymentRef?: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItemType {
  id: string;
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
}

export interface SubscriptionType {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  size: string;
  frequency: string;
  status: string;
  price: number;
  nextDelivery: string;
  createdAt: string;
}

export interface BlogPostType {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  published: boolean;
  createdAt: string;
}

// ── Gifting (gift.jeyscent.com) ──────────────────────────────────────────────

export type OccasionGroup = "corporate" | "personal";

export interface Occasion {
  slug: string;
  title: string;
  group: OccasionGroup;
  blurb: string;
  image: string;
}

export interface Hamper {
  id: string;
  name: string;
  /** Final selling price in naira (no gateway fee added, unlike the main shop). */
  price: number;
  description: string;
  contents: string[];
  image: string;
  gallery: string[];
  occasions: string[];
  audience: OccasionGroup | "both";
  seasonal?: "christmas";
  featured?: boolean;
  inStock: boolean;
}

export interface HamperBox {
  id: string;
  name: string;
  description: string;
  /** Selling price of the empty, dressed box. */
  basePrice: number;
  /** Maximum number of items the box holds. */
  capacity: number;
  image: string;
}

export interface BuilderItem {
  id: string;
  name: string;
  category: "scent" | "tech" | "keepsake";
  /** Selling price. */
  price: number;
  image: string;
  inStock: boolean;
}

export interface GiftPersonalisation {
  recipientName: string;
  message: string;
  /** yyyy-mm-dd, optional. */
  deliveryDate: string;
}

export interface GiftCartItem {
  /** Unique per cart line — two identical hampers with different messages are separate lines. */
  lineId: string;
  kind: "hamper" | "custom";
  hamperId?: string;
  boxId?: string;
  itemIds?: string[];
  name: string;
  /** Selling price for one unit. */
  price: number;
  quantity: number;
  image: string;
  personalisation: GiftPersonalisation;
}
