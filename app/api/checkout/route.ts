import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, generateToken } from "@/lib/auth";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rateLimit";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  validatePayloadStructure,
  validatePayloadAgainstCatalog,
  verifyQorepayPayment,
  createOrderFromPayload,
  type OrderPayload,
} from "@/lib/orders";

// Legacy flat-field payload → canonical checkout payload (kept so any older
// caller that POSTs the old shape keeps working).
function flatToPayload(body: Record<string, unknown>): OrderPayload | null {
  const items = body.items as
    | { productId: string; name: string; size: string; quantity: number; price: number }[]
    | undefined;
  if (
    !items?.length ||
    !body.name ||
    !body.email ||
    !body.phone ||
    body.total == null
  ) {
    return null;
  }
  return {
    form: {
      name: String(body.name),
      email: String(body.email),
      phone: String(body.phone),
      address: typeof body.shippingAddress === "string" ? body.shippingAddress : "",
      area: "",
      city: typeof body.shippingCity === "string" ? body.shippingCity : "",
      state: typeof body.shippingState === "string" ? body.shippingState : "",
    },
    deliveryMethod: body.deliveryMethod === "pickup" ? "pickup" : "delivery",
    isSubscription: Boolean(body.isSubscription),
    items: items.map((i) => ({
      productId: i.productId,
      name: i.name,
      size: i.size,
      quantity: i.quantity,
      price: i.price,
    })),
    totalPrice: typeof body.totalPrice === "number" ? body.totalPrice : Number(body.total),
    grandTotal: Number(body.total),
    shippingFee: typeof body.shippingFee === "number" ? body.shippingFee : 0,
    isParkPickup: Boolean(body.isParkPickup),
    deliveryEstimate: typeof body.deliveryEstimate === "string" ? body.deliveryEstimate : "",
    createAccount: Boolean(body.createAccount),
  };
}

export async function POST(request: NextRequest) {
  // Rate-limit: 10 checkout submissions per minute per IP. Each creates DB
  // rows, sends emails, and may create a user — throttling stops abuse.
  const ip = clientIp(request);
  const rl = rateLimit(`checkout:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterMs, "Too many orders. Please slow down.");

  try {
    const body = await request.json();

    const reference =
      typeof body.reference === "string" && body.reference.trim()
        ? body.reference.trim()
        : typeof body.paymentRef === "string" && body.paymentRef.trim()
        ? body.paymentRef.trim()
        : null;

    // ── Resolve the checkout payload ───────────────────────────────────────
    // Preferred: the server-side snapshot (PendingOrder) written at payment
    // initialization — this is what makes order creation independent of the
    // customer's browser. Fallback: the client-supplied payload (canonical or
    // legacy flat shape), validated against the live catalog as before.
    let payload: OrderPayload;
    let source: "snapshot" | "client" = "client";

    if (reference) {
      // ── Duplicate order guard (fast-path) ────────────────────────────────
      const existingOrder = await prisma.order.findFirst({
        where: { paymentRef: reference },
      });
      if (existingOrder) {
        return NextResponse.json({
          orderId: existingOrder.id,
          newAccount: false,
          message: "Order already exists",
        });
      }

      const pending = await prisma.pendingOrder.findUnique({
        where: { reference },
      });

      if (pending) {
        const struct = validatePayloadStructure(pending.payload);
        if (!struct.ok) {
          return NextResponse.json({ error: struct.error }, { status: 400 });
        }
        payload = pending.payload as unknown as OrderPayload;
        source = "snapshot";
      } else if (body.payload) {
        const struct = validatePayloadStructure(body.payload);
        if (!struct.ok) {
          return NextResponse.json({ error: struct.error }, { status: 400 });
        }
        const catalog = validatePayloadAgainstCatalog(body.payload as OrderPayload);
        if (!catalog.ok) {
          return NextResponse.json({ error: catalog.error }, { status: 400 });
        }
        payload = body.payload as OrderPayload;
      } else {
        const legacy = flatToPayload(body);
        if (!legacy) {
          return NextResponse.json(
            { error: "No checkout data found for this reference" },
            { status: 404 }
          );
        }
        const struct = validatePayloadStructure(legacy);
        if (!struct.ok) {
          return NextResponse.json({ error: struct.error }, { status: 400 });
        }
        const catalog = validatePayloadAgainstCatalog(legacy);
        if (!catalog.ok) {
          return NextResponse.json({ error: catalog.error }, { status: 400 });
        }
        payload = legacy;
      }

      // ── Verify the payment with QorePay + amount match ──────────────────
      // This is the security gate: an Order can only be created for a payment
      // that genuinely succeeded AND charged exactly the order total. It also
      // means a customer whose browser died at the gateway can be recovered —
      // re-submitting the same reference safely creates the missing order.
      const verify = await verifyQorepayPayment(reference);
      if (!verify.ok || !verify.amountKobo) {
        return NextResponse.json(
          {
            error: `Payment not verified. Status: ${verify.status || "unknown"}`,
          },
          { status: 400 }
        );
      }
      if (verify.amountKobo !== Math.round(payload.grandTotal * 100)) {
        console.error(
          `[checkout] Amount mismatch for ${reference}: paid ${verify.amountKobo} kobo, order total ${Math.round(payload.grandTotal * 100)} kobo`
        );
        return NextResponse.json(
          { error: "Amount mismatch — please contact support." },
          { status: 400 }
        );
      }
    } else {
      // Legacy path — no payment reference: accept the canonical or flat
      // client payload with the original validation, no gateway check.
      if (body.payload) {
        const struct = validatePayloadStructure(body.payload);
        if (!struct.ok) {
          return NextResponse.json({ error: struct.error }, { status: 400 });
        }
        const catalog = validatePayloadAgainstCatalog(body.payload as OrderPayload);
        if (!catalog.ok) {
          return NextResponse.json({ error: catalog.error }, { status: 400 });
        }
        payload = body.payload as OrderPayload;
      } else {
        const legacy = flatToPayload(body);
        if (!legacy) {
          return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 }
          );
        }
        const struct = validatePayloadStructure(legacy);
        if (!struct.ok) {
          return NextResponse.json({ error: struct.error }, { status: 400 });
        }
        const catalog = validatePayloadAgainstCatalog(legacy);
        if (!catalog.ok) {
          return NextResponse.json({ error: catalog.error }, { status: 400 });
        }
        payload = legacy;
      }
    }

    // ── User resolution (logged-in user wins over account creation) ───────
    const currentUser = await getCurrentUser();

    // ── Create the order (idempotent, P2002-safe) ─────────────────────────
    // awaitEmails: the serverless runtime kills fire-and-forget promises
    // after the response, silently dropping confirmation/admin emails — so
    // await them (capped at 6s inside createOrderFromPayload).
    const result = await createOrderFromPayload(payload, {
      reference,
      userId: currentUser?.id ?? null,
      awaitEmails: true,
    });

    // Best-effort cleanup of the consumed snapshot. If the webhook already
    // deleted it (or is racing us), ignore — the unique paymentRef constraint
    // guarantees a single Order either way.
    if (reference) {
      await prisma.pendingOrder
        .deleteMany({ where: { reference } })
        .catch((err) =>
          console.error("[checkout] PendingOrder cleanup failed (non-fatal):", err)
        );
    }

    // ── Log the customer in when an account was created/found for them ─────
    if (result.user && !currentUser) {
      const token = generateToken({
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
      });
      const cookieStore = await cookies();
      cookieStore.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    console.log(
      `[checkout] Order ${result.created ? "created" : "already exists"} via ${source} payload — ${result.orderId} (ref: ${reference || "none"})`
    );

    return NextResponse.json({
      orderId: result.orderId,
      newAccount: result.newAccount,
      message: result.created ? "Order created successfully" : "Order already exists",
    });
  } catch (error) {
    console.error("[checkout] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}