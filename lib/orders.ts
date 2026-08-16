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
import { hashPassword } from "./auth";
import {
  sendOrderConfirmation,
  sendAdminNotification,
  sendWelcomeEmail,
} from "./email";
import { products, getSalePrice } from "@/data/products";

// ── Canonical checkout payload (as built on the checkout page) ─────────────

export interface OrderPayloadItem {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface OrderPayload {
  form: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    area?: string;
    city?: string;
    state?: string;
  };
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

export function validatePayloadAgainstCatalog(payload: OrderPayload): {
  ok: boolean;
  error?: string;
} {
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
  const canonicalItems = payload.items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const sizeInfo = product?.sizes.find((s) => s.size === item.size);
    return {
      productId: item.productId,
      name: item.name,
      size: item.size,
      quantity: item.quantity,
      price: sizeInfo ? getSalePrice(sizeInfo.price) : item.price,
    };
  });

  let orderId: string;
  let created = true;
  try {
    const order = await prisma.order.create({
      data: {
        userId,
        total: payload.grandTotal,
        paymentRef: reference,
        shippingAddress: isPickup
          ? "Self Pickup / Customer Rider"
          : `${payload.form.address || ""}, ${payload.form.area || ""}`,
        shippingCity: isPickup ? "N/A" : payload.form.city || "N/A",
        shippingState: isPickup ? "N/A" : payload.form.state || "N/A",
        phone: payload.form.phone,
        email: payload.form.email,
        items: {
          create: canonicalItems,
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
    customerName: payload.form.name,
    customerEmail: payload.form.email,
    orderId,
    items: canonicalItems,
    total: payload.grandTotal,
    shippingAddress: isPickup
      ? "Self Pickup — our team will contact you via WhatsApp with pickup details"
      : `${payload.form.address || ""}, ${payload.form.city || ""}, ${payload.form.state || ""}`,
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
    await Promise.all(emailPromises);
  }

  return { orderId, created, user: resolvedUser, newAccount };
}