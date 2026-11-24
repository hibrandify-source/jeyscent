// lib/orders.ts
// Shared, idempotent order-creation logic for the three writers of Order rows:
//   1. POST /api/checkout            (customer browser, after QorePay redirect)
//   2. POST /api/payment/webhook     (QorePay server-to-server notification)
//   3. POST /api/admin/orders/reconcile (manual admin recovery of paid orders)
//
// All three verify the payment with QorePay and require the charged amount to
// match the order total, so an Order can never be created for an unpaid or
// mismatched reference. The unique constraint on Order.paymentRef makes
// concurrent creations of the same reference resolve to a single Order.
import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";
import { hashPassword } from "./auth";
import {
  sendOrderConfirmation,
  sendAdminNotification,
  sendWelcomeEmail,
} from "./email";
import { products, getSalePrice } from "@/data/products";
import { getHamper, priceCustomHamper, GIFT_MESSAGE_MAX } from "@/data/gifting";
import type { GiftPersonalisation } from "./types";

// ── Canonical checkout payload (as built on the checkout page) ─────────────

export interface OrderPayloadItem {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  image?: string;
  /** Gifting orders only — what the line is and who it's for. */
  details?: GiftItemDetails;
}

/**
 * Gifting line details. productId is "hamper:<hamperId>" or "custom:<boxId>";
 * the price is always re-derived from data/gifting.ts on the server.
 */
export interface GiftItemDetails {
  kind: "hamper" | "custom";
  hamperId?: string;
  boxId?: string;
  itemIds?: string[];
  personalisation: GiftPersonalisation;
  /** Filled in server-side when the order is created (item names). */
  contents?: string[];
}

export type OrderBrand = "jeyscent" | "gifting";

export interface OrderPayload {
  form: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    area?: string;
    city?: string;
    state?: string;
    /** Gifting: the recipient's phone, for the courier. */
    recipientPhone?: string;
  };
  /** Storefront that built the payload; absent means the main shop. */
  brand?: OrderBrand;
  deliveryMethod: "delivery" | "pickup";
  isSubscription?: boolean;
  items: OrderPayloadItem[];
  totalPrice: number;
  grandTotal: number;
  shippingFee: number;
  isParkPickup: boolean;
  deliveryEstimate: string;
  createAccount: boolean;
  /** Stashed by the client after initialize; advisory only (server uses `reference`). */
  paymentRef?: string;
}

// ── QorePay verification (shared by all three writers) ─────────────────────

export interface QorepayVerification {
  ok: boolean;
  /** Amount charged, in kobo (QorePay's native unit). */
  amountKobo?: number;
  /** Amount charged, in naira. */
  amount?: number;
  status?: string;
  email?: string;
  channel?: string;
  paidAt?: string;
  error?: string;
}

export async function verifyQorepayPayment(
  reference: string
): Promise<QorepayVerification> {
  try {
    const verifyRes = await fetch(
      `https://api.qorepay.com/v1/purchases/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.QOREPAY_SECRET_KEY}`,
        },
      }
    );

    const verifyData = await verifyRes.json();
    const status = verifyData.data?.status as string | undefined;

    if (!verifyRes.ok || status !== "SUCCESS") {
      return {
        ok: false,
        status,
        error: `Payment status: ${status || "unknown"}`,
      };
    }

    return {
      ok: true,
      amountKobo: verifyData.data.amount as number,
      amount: (verifyData.data.amount as number) / 100,
      status,
      email: verifyData.data.customer_email as string | undefined,
      channel: verifyData.data.channel as string | undefined,
      paidAt:
        verifyData.data.transaction?.paid_at || new Date().toISOString(),
    };
  } catch (err) {
    console.error("[orders] QorePay verification error:", err);
    return { ok: false, error: "Could not verify payment" };
  }
}

// ── Structural validation (no live catalog lookup) ──────────────────────────

export function validatePayloadStructure(payload: unknown): {
  ok: boolean;
  error?: string;
} {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Invalid checkout payload" };
  }

  const p = payload as Partial<OrderPayload>;
  const form = p.form as Partial<OrderPayload["form"]> | undefined;

  if (!form || !form.name || !form.email || !form.phone) {
    return { ok: false, error: "Missing required fields: name, email, phone" };
  }
  if (!Array.isArray(p.items) || p.items.length === 0) {
    return { ok: false, error: "Missing required fields: items" };
  }
  if (typeof p.grandTotal !== "number" || p.grandTotal <= 0) {
    return { ok: false, error: "Invalid total" };
  }

  for (const item of p.items as unknown[]) {
    const i = item as Partial<OrderPayloadItem>;
    if (!i.productId || !i.name || !i.size) {
      return { ok: false, error: "Invalid product in cart" };
    }
    if (
      typeof i.quantity !== "number" ||
      i.quantity < 1 ||
      !Number.isInteger(i.quantity)
    ) {
      return { ok: false, error: "Invalid quantity in cart" };
    }
    if (typeof i.price !== "number" || i.price < 0) {
      return { ok: false, error: "Invalid price in cart" };
    }
  }

  if (
    p.deliveryMethod !== "delivery" &&
    p.deliveryMethod !== "pickup"
  ) {
    return { ok: false, error: "Invalid delivery method" };
  }

  return { ok: true };
}

// ── Catalog validation (against the live product list) ──────────────────────
// Used at payment initialization (and as the legacy fallback inside
// /api/checkout). Runs BEFORE payment so a bad price can never be charged;
// once a payment is verified, order creation trusts the initialize-time
// snapshot instead of re-checking against today's catalog (a verified payment
// must never be rejected because a price changed mid-checkout).

// ── Gifting catalog (data/gifting.ts) ──────────────────────────────────────

/** Selling price + contents for a gifting line, from the live gift catalog (gift prices are final — no gateway fee added). */
export function resolveGiftItem(
  item: OrderPayloadItem
): { ok: true; price: number; contents: string[] } | { ok: false; error: string } {
  const d = item.details;
  if (!d || (d.kind !== "hamper" && d.kind !== "custom")) {
    return { ok: false, error: "Invalid gift in cart" };
  }
  if (d.kind === "hamper") {
    const hamper = d.hamperId ? getHamper(d.hamperId) : undefined;
    if (!hamper || item.productId !== `hamper:${hamper.id}`) {
      return { ok: false, error: "Invalid hamper in cart" };
    }
    if (!hamper.inStock) {
      return { ok: false, error: `${hamper.name} is out of stock` };
    }
    return { ok: true, price: hamper.price, contents: hamper.contents };
  }
  if (!d.boxId || item.productId !== `custom:${d.boxId}`) {
    return { ok: false, error: "Invalid custom hamper in cart" };
  }
  const priced = priceCustomHamper(d.boxId, d.itemIds ?? []);
  if (!priced.ok) return priced;
  return {
    ok: true,
    price: priced.price,
    contents: [priced.box.name, ...priced.items.map((i) => i.name)],
  };
}

function validatePersonalisation(p: unknown): string | null {
  const v = p as Partial<GiftPersonalisation> | undefined;
  if (!v || typeof v !== "object") return "Missing gift personalisation";
  if (typeof v.recipientName !== "string" || v.recipientName.length > 100) {
    return "Invalid recipient name";
  }
  if (typeof v.message !== "string" || v.message.length > GIFT_MESSAGE_MAX) {
    return `Gift messages can be up to ${GIFT_MESSAGE_MAX} characters`;
  }
  if (
    typeof v.deliveryDate !== "string" ||
    (v.deliveryDate !== "" && !/^\d{4}-\d{2}-\d{2}$/.test(v.deliveryDate))
  ) {
    return "Invalid delivery date";
  }
  return null;
}

function validateGiftPayloadAgainstCatalog(payload: OrderPayload): {
  ok: boolean;
  error?: string;
} {
  let computedItemsTotal = 0;
  for (const item of payload.items) {
    const resolved = resolveGiftItem(item);
    if (!resolved.ok) return resolved;
    const personalisationError = validatePersonalisation(item.details?.personalisation);
    if (personalisationError) return { ok: false, error: personalisationError };
    const expectedUnitPrice = resolved.price;
    if (item.price !== expectedUnitPrice) {
      return {
        ok: false,
        error: "Price mismatch — please refresh the page and try again",
      };
    }
    computedItemsTotal += expectedUnitPrice * item.quantity;
  }

  const expectedMinTotal =
    computedItemsTotal + (typeof payload.shippingFee === "number" ? payload.shippingFee : 0);
  if (typeof payload.grandTotal !== "number" || payload.grandTotal < expectedMinTotal) {
    return {
      ok: false,
      error: "Total mismatch — please refresh the page and try again",
    };
  }

  return { ok: true };
}

export function validatePayloadAgainstCatalog(payload: OrderPayload): {
  ok: boolean;
  error?: string;
} {
  if (payload.brand === "gifting") {
    return validateGiftPayloadAgainstCatalog(payload);
  }

  let computedItemsTotal = 0;
  for (const item of payload.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      return { ok: false, error: `Invalid product: ${item.productId}` };
    }
    const sizeInfo = product.sizes.find((s) => s.size === item.size);
    if (!sizeInfo) {
      return {
        ok: false,
        error: `Invalid size for ${product.name}: ${item.size}`,
      };
    }
    if (!sizeInfo.inStock) {
      return {
        ok: false,
        error: `${product.name} (${item.size}) is out of stock`,
      };
    }
    const expectedUnitPrice = getSalePrice(sizeInfo.price);
    // The customer sees and pays the sale price (e.g. ₦4,080 for a ₦4,000
    // item with the 2% gateway fee baked in). Accept either the sale price
    // (what new checkouts send) or the raw store price (stale payloads saved
    // before that convention) — everything else is price tampering.
    if (item.price !== expectedUnitPrice && item.price !== sizeInfo.price) {
      return {
        ok: false,
        error: "Price mismatch — please refresh the page and try again",
      };
    }
    computedItemsTotal += expectedUnitPrice * item.quantity;
  }

  const expectedMinTotal =
    computedItemsTotal + (typeof payload.shippingFee === "number" ? payload.shippingFee : 0);
  if (typeof payload.grandTotal !== "number" || payload.grandTotal < expectedMinTotal) {
    return {
      ok: false,
      error: "Total mismatch — please refresh the page and try again",
    };
  }

  return { ok: true };
}

// ── Order creation (idempotent, P2002-safe) ────────────────────────────────

export interface CreateOrderResult {
  orderId: string;
  /** True if this call created the Order row; false if it already existed. */
  created: boolean;
  /** Set when an account was created (or found) for the payload email. */
  user: { id: string; email: string; role: string } | null;
  /** Only true when this call created the account itself. */
  newAccount: boolean;
}

export async function createOrderFromPayload(
  payload: OrderPayload,
  opts: {
    reference?: string | null;
    /** Logged-in user from the request context (wins over account creation). */
    userId?: string | null;
    /** Await email delivery (webhook) vs fire-and-forget (browser request). */
    awaitEmails?: boolean;
  } = {}
): Promise<CreateOrderResult> {
  const reference = opts.reference || payload.paymentRef || null;
  const isPickup = payload.deliveryMethod === "pickup";
  const brand: OrderBrand = payload.brand === "gifting" ? "gifting" : "jeyscent";

  // ── Resolve the user (existing > create-if-requested > guest) ─────────────
  let userId: string | null = opts.userId ?? null;
  let resolvedUser: { id: string; email: string; role: string } | null = null;
  let newAccount = false;
  let tempPassword: string | null = null;

  if (!userId) {
    const existingUser = await prisma.user.findUnique({
      where: { email: payload.form.email },
    });
    if (existingUser) {
      userId = existingUser.id;
      resolvedUser = {
        id: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
      };
    } else if (payload.createAccount) {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
      tempPassword = "";
      for (let i = 0; i < 10; i++) {
        tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const hashedPw = await hashPassword(tempPassword);
      const newUser = await prisma.user.create({
        data: {
          name: payload.form.name,
          email: payload.form.email,
          password: hashedPw,
          role: "customer",
        },
        select: { id: true, name: true, email: true, role: true },
      });
      userId = newUser.id;
      resolvedUser = { id: newUser.id, email: newUser.email, role: newUser.role };
      newAccount = true;
    }
  }

  // ── Create the order (idempotent against concurrent same-reference writes) ──
  // Store the canonical charged price (sale price, e.g. ₦4,080 for a ₦4,000
  // item) for each item regardless of which price form the payload carried.
  // A product removed from the catalog falls back to the payload price — a
  // verified payment must never be rejected for an old payload.
  // Gifting lines are priced from data/gifting.ts and keep their details
  // (contents + personalisation) on the OrderItem.
  const canonicalItems = payload.items.map((item) => {
    if (brand === "gifting") {
      const resolved = resolveGiftItem(item);
      return {
        productId: item.productId,
        name: item.name,
        size: item.size,
        quantity: item.quantity,
        price: resolved.ok ? resolved.price : item.price,
        details: item.details
          ? {
              ...item.details,
              contents: resolved.ok ? resolved.contents : item.details.contents ?? [],
            }
          : undefined,
      };
    }
    const product = products.find((p) => p.id === item.productId);
    const sizeInfo = product?.sizes.find((s) => s.size === item.size);
    return {
      productId: item.productId,
      name: item.name,
      size: item.size,
      quantity: item.quantity,
      price: sizeInfo ? getSalePrice(sizeInfo.price) : item.price,
      details: undefined as GiftItemDetails | undefined,
    };
  });

  const recipientPhone =
    brand === "gifting" && payload.form.recipientPhone
      ? ` (Recipient phone: ${payload.form.recipientPhone})`
      : "";

  let orderId: string;
  let created = true;
  try {
    const order = await prisma.order.create({
      data: {
        userId,
        total: payload.grandTotal,
        brand,
        paymentRef: reference,
        shippingAddress: isPickup
          ? "Self Pickup / Customer Rider"
          : `${payload.form.address || ""}, ${payload.form.area || ""}${recipientPhone}`,
        shippingCity: isPickup ? "N/A" : payload.form.city || "N/A",
        shippingState: isPickup ? "N/A" : payload.form.state || "N/A",
        phone: payload.form.phone,
        email: payload.form.email,
        items: {
          create: canonicalItems.map(({ details, ...rest }) => ({
            ...rest,
            ...(details ? { details: details as unknown as Prisma.InputJsonValue } : {}),
          })),
        },
      },
    });
    orderId = order.id;
  } catch (createErr: unknown) {
    const code =
      (createErr as { code?: string })?.code ||
      (createErr as { meta?: { code?: string } })?.meta?.code;
    if (code === "P2002") {
      // A concurrent request (webhook vs. success page) already created the
      // order for this payment reference — return the winner.
      if (reference) {
        const existingOrder = await prisma.order.findFirst({
          where: { paymentRef: reference },
        });
        if (existingOrder) {
          orderId = existingOrder.id;
          created = false;
        } else {
          throw createErr;
        }
      } else {
        throw createErr;
      }
    } else {
      throw createErr;
    }
  }

  // ── Emails ────────────────────────────────────────────────────────────────
  const emailData = {
    brand,
    customerName: payload.form.name,
    customerEmail: payload.form.email,
    orderId,
    items: canonicalItems,
    total: payload.grandTotal,
    shippingAddress: isPickup
      ? "Self Pickup — our team will contact you via WhatsApp with pickup details"
      : `${payload.form.address || ""}, ${payload.form.city || ""}, ${payload.form.state || ""}${recipientPhone}`,
    shippingFee: payload.shippingFee || 0,
    isParkPickup: payload.isParkPickup || false,
    deliveryEstimate:
      payload.deliveryEstimate ||
      (isPickup ? "Customer arranges pickup" : ""),
  };

  const send = (promise: Promise<unknown>): Promise<void> =>
    promise.then(() => undefined).catch(console.error);

  const emailPromises: Promise<void>[] = [];
  if (created) {
    // Skip emails on idempotent replays of an already-created order.
    emailPromises.push(send(sendOrderConfirmation(emailData)));
    emailPromises.push(send(sendAdminNotification(emailData)));
  }
  if (newAccount && tempPassword) {
    emailPromises.push(
      send(sendWelcomeEmail({ name: payload.form.name, email: payload.form.email, password: tempPassword }))
    );
  }
  if (opts.awaitEmails) {
    // Cap email waiting so payment-critical callers (the webhook) always
    // respond in time even if SMTP is slow/hung — emails that miss the
    // window still resolve as background best-effort.
    await Promise.race([
      Promise.all(emailPromises),
      new Promise<void>((resolve) => setTimeout(() => resolve(), 6000)),
    ]);
  }

  return { orderId, created, user: resolvedUser, newAccount };
}