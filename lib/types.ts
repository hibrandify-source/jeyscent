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