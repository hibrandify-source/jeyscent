-- ══════════════════════════════════════════════════════════════════
-- Migration: subscription_multi_item
-- Safely updates PendingSubscription and Subscription tables
-- ══════════════════════════════════════════════════════════════════

-- ── 1. PendingSubscription: add new columns ───────────────────────
ALTER TABLE "PendingSubscription" ADD COLUMN IF NOT EXISTS "items" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "PendingSubscription" ADD COLUMN IF NOT EXISTS "frequencyMonths" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "PendingSubscription" ADD COLUMN IF NOT EXISTS "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- ── 2. PendingSubscription: migrate old single-item rows into items array ──
UPDATE "PendingSubscription"
SET "items" = jsonb_build_array(
  jsonb_build_object(
    'productId',   "productId",
    'productName', "productName",
    'size',        "size",
    'quantity',    1,
    'unitPrice',   "price"
  )
)
WHERE "items" = '[]'::jsonb;

-- ── 3. PendingSubscription: update frequency default ─────────────
ALTER TABLE "PendingSubscription" ALTER COLUMN "frequency" SET DEFAULT 'bimonthly';

-- ── 4. PendingSubscription: drop old single-item columns ─────────
ALTER TABLE "PendingSubscription" DROP COLUMN IF EXISTS "productId";
ALTER TABLE "PendingSubscription" DROP COLUMN IF EXISTS "productName";
ALTER TABLE "PendingSubscription" DROP COLUMN IF EXISTS "size";
ALTER TABLE "PendingSubscription" DROP COLUMN IF EXISTS "price";

-- ── 5. Subscription: add quantity column ─────────────────────────
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "quantity" INTEGER NOT NULL DEFAULT 1;

-- ── 6. Subscription: add updatedAt — backfill existing rows first ─
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
UPDATE "Subscription" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;
ALTER TABLE "Subscription" ALTER COLUMN "updatedAt" SET NOT NULL;

-- ── 7. Subscription: update frequency default ────────────────────
ALTER TABLE "Subscription" ALTER COLUMN "frequency" SET DEFAULT 'bimonthly';

-- ── 8. Subscription: add CASCADE on delete (was RESTRICT) ────────
ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS "Subscription_userId_fkey";
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 9. PendingSubscription: add foreign key with CASCADE ─────────
ALTER TABLE "PendingSubscription" DROP CONSTRAINT IF EXISTS "PendingSubscription_userId_fkey";
ALTER TABLE "PendingSubscription" ADD CONSTRAINT "PendingSubscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;