-- add_pending_order
-- Server-side snapshot of a regular (non-subscription) checkout intent,
-- keyed by the QorePay reference. Order creation no longer depends on the
-- customer's browser surviving the payment redirect: the snapshot is written
-- at payment initialization and consumed by /api/checkout (reference-driven),
-- the QorePay webhook (/api/payment/webhook), and admin reconciliation
-- (/api/admin/orders/reconcile).
CREATE TABLE "PendingOrder" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PendingOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PendingOrder_reference_key" ON "PendingOrder"("reference");