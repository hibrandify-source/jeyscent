-- add_subscription_payment_ref
-- Add a paymentRef column to Subscription so webhook and browser
-- confirmations of the same QorePay reference stay idempotent (closes the
-- race where both increment quantity on an existing active subscription).
--
-- NOT unique: one subscription purchase produces one row per line item, all
-- sharing the same reference. The index makes the "already confirmed?"
-- lookup fast.
ALTER TABLE "Subscription" ADD COLUMN "paymentRef" TEXT;
CREATE INDEX "Subscription_paymentRef_idx" ON "Subscription"("paymentRef");