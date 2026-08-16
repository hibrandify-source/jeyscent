import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import {
  verifyQorepayPayment,
  createOrderFromPayload,
  validatePayloadStructure,
  type OrderPayload,
} from "@/lib/orders";
import { confirmClassEnrollment } from "@/lib/classes";
import { confirmSubscription } from "@/lib/subscriptions";

// ── POST /api/payment/webhook ────────────────────────────────────────────────
// QorePay server-to-server notification for purchase events. This is the
// safety net that guarantees an Order is created even when the customer's
// browser dies at the gateway, their tab crashes, or the success-page chain
// fails — the money is captured and the order must exist regardless.
//
// Security model (defense in depth):
//   1. Signature verification — the QorePay dashboard generates a signing
//      secret (`whsec_...`, set as QOREPAY_WEBHOOK_SECRET). HMAC-SHA256 is
//      verified against the raw body across the common header names and
//      encodings (QorePay's exact format is undocumented; the first test
//      event's failure log reveals which header it actually sends). RSA
//      verification (X-Signature, QOREPAY_WEBHOOK_PUBLIC_KEY) is kept as a
//      fallback for the scheme described in the legacy docs.
//   2. Server-side re-verification — the handler ALWAYS re-checks the
//      purchase with QorePay (GET /v1/purchases/:reference) and requires
//      status SUCCESS plus an exact amount match with the order total.
//      A forged webhook can therefore never create an order.
//
// Setup (one-time, production):
//   1. In the QorePay dashboard: add the webhook endpoint
//      "<BASE_URL>/api/payment/webhook", select the paid-purchase events,
//      and copy the generated signing secret into QOREPAY_WEBHOOK_SECRET
//      (Vercel env + .env.local).
//
// The handler acknowledges every event with 200 (so QorePay stops retrying);
// it only acts on paid purchases that map to a pending record.
//
// Dispatch order for a paid reference: PendingOrder (regular orders) →
// PendingEnrollment (classes) → PendingSubscription (subscriptions). The
// references are unique across all three tables, and each confirmation
// re-verifies the purchase with QorePay before writing, so a forged webhook
// can never grant anything. Class/subscription confirmations share the same
// library code as the browser confirm endpoints, which keeps them idempotent
// with each other.

const SIGNATURE_HEADERS = [
  "x-signature",
  "x-qorepay-signature",
  "x-webhook-signature",
  "signature-digest",
  "x-qorepay-hmac-sha256",
];

function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Verify an HMAC-SHA256 signature over the raw body. Tolerates the formats in
// the wild:
//   • bare signature (hex or base64) over the raw body
//   • composite "t=<ts>,v1=<hmac>" / "t=<ts>.v1=<hmac>" (timestamp prefix)
//   • optional "sha256=" / "v1=" value prefixes
function verifyHmacSignature(
  rawBody: string,
  headerValue: string,
  secret: string
): boolean {
  const trimmed = headerValue.trim();

  // Collect the expected signature values from the header.
  const expectedValues: string[] = [];
  const v1Matches = trimmed.match(/(?:^|[, ])(?:v1|sha256)=([A-Za-z0-9+/=_-]+)/g);
  if (v1Matches && v1Matches.length > 0) {
    for (const m of v1Matches) {
      const val = m.split("=").slice(1).join("=").trim();
      if (val) expectedValues.push(val);
    }
  } else {
    expectedValues.push(trimmed.split(",")[0].trim());
  }

  // Collect the payload variants to sign.
  const payloadCandidates: string[] = [rawBody];
  const tMatch = trimmed.match(/(?:^|[, ])t=(\d+)/);
  if (tMatch) {
    payloadCandidates.push(`${tMatch[1]}.${rawBody}`);
  }

  for (const candidate of payloadCandidates) {
    const hmacHex = crypto
      .createHmac("sha256", secret)
      .update(candidate)
      .digest("hex");
    const hmacBase64 = crypto
      .createHmac("sha256", secret)
      .update(candidate)
      .digest("base64");

    for (const expected of expectedValues) {
      const normalized = expected.toLowerCase();
      if (
        normalized.length === hmacHex.length &&
        safeEqual(Buffer.from(normalized), Buffer.from(hmacHex))
      ) {
        return true;
      }
      if (safeEqual(Buffer.from(expected), Buffer.from(hmacBase64))) {
        return true;
      }
    }
  }

  return false;
}

// RSA PKCS#1 v1.5 signature of the SHA256 digest of the raw body, base64 in
// X-Signature (the scheme described in QorePay's legacy webhook docs).
function verifyRsaSignature(
  rawBody: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const verifier = crypto.createVerify("sha256");
    verifier.update(rawBody);
    verifier.end();
    return verifier.verify(publicKey, Buffer.from(signature, "base64"));
  } catch (err) {
    console.error("[webhook] RSA verification threw:", err);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // ── 1. Signature verification (fail-closed) ───────────────────────────────
  const secret = process.env.QOREPAY_WEBHOOK_SECRET;
  const publicKey = process.env.QOREPAY_WEBHOOK_PUBLIC_KEY;

  if (!secret && !publicKey) {
    console.error(
      "[webhook] Neither QOREPAY_WEBHOOK_SECRET nor QOREPAY_WEBHOOK_PUBLIC_KEY is configured — rejecting webhook."
    );
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 }
    );
  }

  const presentHeaders: Record<string, string> = {};
  for (const header of SIGNATURE_HEADERS) {
    const value = request.headers.get(header);
    if (value) presentHeaders[header] = value;
  }

  let valid = false;
  if (secret && Object.keys(presentHeaders).length > 0) {
    for (const value of Object.values(presentHeaders)) {
      if (verifyHmacSignature(rawBody, value, secret)) {
        valid = true;
        break;
      }
    }
  }
  if (!valid && publicKey && presentHeaders["x-signature"]) {
    valid = verifyRsaSignature(rawBody, presentHeaders["x-signature"], publicKey);
  }

  if (!valid) {
    console.error(
      `[webhook] Signature verification failed. Headers received: ${JSON.stringify(Object.keys(presentHeaders))}. ` +
        `Configured schemes: ${secret ? "hmac" : ""}${publicKey ? " rsa" : ""}. ` +
        "If a test event just failed, check the header name/format above and adjust the verifier."
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ── 2. Parse event ─────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only act on paid events; acknowledge everything else. QorePay wraps
  // purchases in a "data" envelope (their API-wide convention) and reports
  // purchase statuses as uppercase (SUCCESS). Events are named like
  // "payment.success" / "purchase.success". Extract with multi-fallback so
  // no successful purchase can ever be silently dropped.
  const data = (body.data ?? {}) as Record<string, unknown>;
  const purchase = (data.purchase ?? data.payment ?? {}) as Record<string, unknown>;
  const transaction = (data.transaction ?? body.transaction ?? {}) as Record<string, unknown>;

  const status = body.status ?? data.status ?? purchase.status ?? transaction.status;
  const eventType =
    body.event_type ?? body.type ?? body.event ?? data.event_type ?? data.type ?? data.event;

  const norm = (v: unknown): string => String(v).toLowerCase();
  const isPaid =
    ["paid", "success", "completed", "successful"].includes(norm(status)) ||
    ["purchase.paid", "purchase.success", "purchase.completed", "payment.success", "payment.paid"].includes(
      norm(eventType)
    );

  const reference = [body, data, purchase, transaction]
    .map((o) => o.reference ?? o.id)
    .find((v): v is string => typeof v === "string" && v.length > 0) ?? "";

  if (!reference && !status && !eventType) {
    console.log("[webhook] unrecognized payload:", rawBody);
  }

  console.log(
    `[webhook] Event received — ref: ${reference || "(none)"}, status: ${String(status)}, type: ${String(eventType)}`
  );

  if (!isPaid) {
    return NextResponse.json({ received: true, ignored: "not a paid event" });
  }
  if (!reference) {
    console.warn("[webhook] Paid event without a reference — ignoring.");
    return NextResponse.json({ received: true, ignored: "no reference" });
  }

  // ── 3. Already handled? (idempotency) ─────────────────────────────────────
  const existingOrder = await prisma.order.findFirst({
    where: { paymentRef: reference },
    select: { id: true },
  });
  if (existingOrder) {
    return NextResponse.json({ received: true, orderId: existingOrder.id });
  }

  // ── 4. Locate the pending snapshot ─────────────────────────────────────────
  const pending = await prisma.pendingOrder.findUnique({
    where: { reference },
  });
  if (!pending) {
    // No PendingOrder — try class enrollment, then subscription. Both re-verify
    // the purchase with QorePay and are idempotent with the browser confirm
    // endpoints. A 404 from either means the reference belongs to no pending
    // record (already consumed, or unknown) — acknowledge so the gateway stops
    // retrying.
    const classResult = await confirmClassEnrollment(reference);
    if (classResult.ok) {
      console.log(
        `[webhook] Class enrollment confirmed via webhook for ref ${reference}: ${classResult.enrollmentId}` +
          (classResult.alreadyConfirmed ? " (already confirmed)" : "")
      );
      console.log("[webhook] done — responding");
      return NextResponse.json({
        received: true,
        confirmed: "class",
        enrollmentId: classResult.enrollmentId,
      });
    }
    if (classResult.status !== 404) {
      console.error(
        `[webhook] Class enrollment confirmation failed for ${reference}: ${classResult.error}`
      );
      return NextResponse.json(
        { received: true, error: classResult.error },
        { status: classResult.status ?? 500 }
      );
    }

    const subResult = await confirmSubscription(reference);
    if (subResult.ok) {
      console.log(
        `[webhook] Subscription confirmed via webhook for ref ${reference}` +
          (subResult.alreadyConfirmed ? " (already confirmed)" : "")
      );
      console.log("[webhook] done — responding");
      return NextResponse.json({ received: true, confirmed: "subscription" });
    }
    if (subResult.status !== 404) {
      console.error(
        `[webhook] Subscription confirmation failed for ${reference}: ${subResult.error}`
      );
      return NextResponse.json(
        { received: true, error: subResult.error },
        { status: subResult.status ?? 500 }
      );
    }

    // Unknown reference — acknowledged so the gateway stops retrying.
    console.log(`[webhook] No pending order/enrollment/subscription for ref ${reference} — acknowledging.`);
    return NextResponse.json({ received: true, ignored: "no pending record" });
  }

  const struct = validatePayloadStructure(pending.payload);
  if (!struct.ok) {
    console.error(`[webhook] Invalid PendingOrder payload for ${reference}:`, struct.error);
    return NextResponse.json({ error: "Invalid pending payload" }, { status: 500 });
  }
  const payload = pending.payload as unknown as OrderPayload;

  // ── 5. Re-verify with QorePay + amount match ─────────────────────────────
  const verify = await verifyQorepayPayment(reference);
  if (!verify.ok || !verify.amountKobo) {
    console.error(
      `[webhook] QorePay re-verification failed for ${reference}: ${verify.status || verify.error}`
    );
    return NextResponse.json({ error: "Payment not verified" }, { status: 400 });
  }
  if (verify.amountKobo !== Math.round(payload.grandTotal * 100)) {
    console.error(
      `[webhook] Amount mismatch for ${reference}: paid ${verify.amountKobo} kobo, order total ${Math.round(payload.grandTotal * 100)} kobo`
    );
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  // ── 6. Create the order (idempotent; concurrent success-page replay safe) ─
  const result = await createOrderFromPayload(payload, {
    reference,
    awaitEmails: true,
  });

  // Best-effort cleanup of the consumed snapshot. If the success page already
  // deleted it, ignore. Any race is resolved by the unique paymentRef above.
  await prisma.pendingOrder
    .delete({ where: { id: pending.id } })
    .catch((err) =>
      console.error("[webhook] PendingOrder cleanup failed (non-fatal):", err)
    );

  console.log(
    `[webhook] Order ${result.created ? "created" : "already existed"} for ref ${reference}: ${result.orderId}`
  );

  console.log("[webhook] done — responding");
  return NextResponse.json({ received: true, orderId: result.orderId });
}