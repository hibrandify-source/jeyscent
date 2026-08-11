import { prisma as prismaClient } from "./prisma";

// Re-export the shared PrismaClient singleton so existing `import { prisma }
// from "@/lib/db"` call sites keep working — they now transparently share
// the same client as `import { prisma } from "@/lib/prisma"`.
export const prisma = prismaClient;

// NOTE: PrismaClient is intentionally imported once (lib/prisma.ts) and shared.
// Previously this file created its own PrismaClient, which in production
// (where lib/prisma.ts skips the global cache) meant two competing clients
// against the same connection pool — wasteful and fragile. Importing the
// shared singleton fixes that.

// ============ USER HELPERS ============

export async function createUser(
  name: string,
  email: string,
  password: string,
  role = "customer"
) {
  const user = await prisma.user.create({
    data: { name, email, password, role },
    select: { id: true, name: true, email: true, role: true },
  });
  return user;
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
}

// ============ ORDER HELPERS ============

export async function createOrder(data: {
  userId: string;
  total: number;
  paymentRef?: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  phone: string;
  email: string;
  items: {
    productId: string;
    name: string;
    size: string;
    quantity: number;
    price: number;
  }[];
}) {
  const order = await prisma.order.create({
    data: {
      userId: data.userId,
      total: data.total,
      paymentRef: data.paymentRef || null,
      shippingAddress: data.shippingAddress,
      shippingCity: data.shippingCity,
      shippingState: data.shippingState,
      phone: data.phone,
      email: data.email,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          name: item.name,
          size: item.size,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    },
  });
  return order.id;
}

export async function getOrderById(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      user: { select: { name: true, email: true } },
    },
  });
}

export async function getOrdersByUserId(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllOrders() {
  return prisma.order.findMany({
    include: {
      items: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateOrderStatus(orderId: string, status: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
}

export async function getOrderStats() {
  const [totalOrders, revenue, pendingOrders, deliveredOrders] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: "cancelled" } },
      }),
      prisma.order.count({ where: { status: "pending" } }),
      prisma.order.count({ where: { status: "delivered" } }),
    ]);

  return {
    totalOrders,
    totalRevenue: revenue._sum.total || 0,
    pendingOrders,
    deliveredOrders,
  };
}

// ============ SUBSCRIPTION HELPERS ============

export async function createSubscription(data: {
  userId: string;
  productId: string;
  productName: string;
  size: string;
  frequency: string;
  price: number;
  nextDelivery: string;
}) {
  const sub = await prisma.subscription.create({
    data: {
      userId: data.userId,
      productId: data.productId,
      productName: data.productName,
      size: data.size,
      frequency: data.frequency,
      price: data.price,
      nextDelivery: new Date(data.nextDelivery),
    },
  });
  return sub.id;
}

export async function getSubscriptionsByUserId(userId: string) {
  return prisma.subscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateSubscriptionStatus(
  subId: string,
  status: string
) {
  await prisma.subscription.update({
    where: { id: subId },
    data: { status },
  });
}

// ============ BLOG HELPERS ============

export async function createBlogPost(data: {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  author?: string;
}) {
  const post = await prisma.blogPost.create({
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      image: data.image,
      author: data.author || "Jey Scent",
      published: true,
    },
  });
  return post.id;
}

export async function getPublishedPosts() {
  return prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPostBySlug(slug: string) {
  return prisma.blogPost.findUnique({
    where: { slug, published: true },
  });
}

export async function getAllPosts() {
  return prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
  });
}