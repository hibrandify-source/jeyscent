import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rateLimit";
import {
  validatePayloadStructure,
  validatePayloadAgainstCatalog,
  verifyQorepayPayment,
  createOrderFromPayload,
  type OrderPayload,
} from "@/lib/orders";

// ── Admin reconciliation of paid-but-unrecorded orders ──────────────────────
// Recovers orders where QorePay captured the money but no Order row exists
// (the exact incident this codebase hit). The payment reference is verified
// against QorePay (status SUCCESS + exact amount match) before anything is
// written, so an order can never be created for an unpaid or mismatched
// reference.
//
// GET  /api/admin/orders/reconcile?reference=X — look up a payment (used by
//      the admin panel to pre-fill the customer/amount from QorePay).
// POST /api/admin/orders/reconcile             — create the order from the
//      admin-provided checkout payload.

async function requireAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user && user.role === "admin";
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = clientIp(request);
  const rl = rateLimit(`reconcile:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterMs, "Too many requests. Please slow down.");

  const reference = request.nextUrl.searchParams.get("reference")?.trim();
  if (!reference) {
    return NextResponse.json(
      { error: "Payment reference is required" },
      { status: 400 }
    );
  }

  const verify = await verifyQorepayPayment(reference);

  let existingOrder: { id: string } | null = null;
  if (verify.ok) {
    existingOrder = await prisma.order.findFirst({
      where: { paymentRef: reference },
      select: { id: true },
    });
  }

  return NextResponse.json({
    reference,
    verified: verify.ok,
    status: verify.status,
    error: verify.error,
    amount: verify.amount,
    amountKobo: verify.amountKobo,
    email: verify.email,
    channel: verify.channel,
    paidAt: verify.paidAt,
    existingOrder: existingOrder?.id ?? null,
  });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = clientIp(request);
  const rl = rateLimit(`reconcile:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterMs, "Too many requests. Please slow down.");

  try {
    let body: { reference?: string; payload?: OrderPayload };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const reference = body.reference?.trim();
    if (!reference) {
      return NextResponse.json(
        { error: "Payment reference is required" },
        { status: 400 }
      );
    }

    const struct = validatePayloadStructure(body.payload);
    if (!struct.ok) {
      return NextResponse.json({ error: struct.error }, { status: 400 });
    }
    const catalog = validatePayloadAgainstCatalog(body.payload as OrderPayload);
    if (!catalog.ok) {
      return NextResponse.json({ error: catalog.error }, { status: 400 });
    }
    const payload = body.payload as OrderPayload;

    // Verify the payment exists and matches the order total exactly.
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
      return NextResponse.json(
        {
          error: `Amount mismatch — paid ₦${verify.amount} but order total is ₦${payload.grandTotal}`,
        },
        { status: 400 }
      );
    }

    // Idempotent: never create a second order for the same reference.
    const existingOrder = await prisma.order.findFirst({
      where: { paymentRef: reference },
    });
    if (existingOrder) {
      return NextResponse.json({
        orderId: existingOrder.id,
        message: "Order already exists",
      });
    }

    const result = await createOrderFromPayload(payload, {
      reference,
      awaitEmails: true,
    });

    // Best-effort cleanup of any matching server-side snapshot.
    await prisma.pendingOrder
      .deleteMany({ where: { reference } })
      .catch((err) =>
        console.error("[reconcile] PendingOrder cleanup failed (non-fatal):", err)
      );

    console.log(
      `[reconcile] Order ${result.created ? "created" : "already existed"} for ref ${reference}: ${result.orderId}`
    );

    return NextResponse.json({
      orderId: result.orderId,
      message: result.created ? "Order created successfully" : "Order already exists",
    });
  } catch (error) {
    console.error("[POST /api/admin/orders/reconcile]", error);
    return NextResponse.json(
      { error: "Failed to reconcile order" },
      { status: 500 }
    );
  }
}