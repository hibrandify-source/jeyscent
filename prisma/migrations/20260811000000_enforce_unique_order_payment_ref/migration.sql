-- enforce_unique_order_payment_ref
-- Add a UNIQUE constraint on Order.paymentRef so concurrent checkout
-- submissions of the same QorePay reference can't double-create orders
-- (which would double-send confirmation emails and double-charge the
-- merchant for the same payment).
--
-- Partial index: rows with NULL paymentRef (legacy orders without a
-- payment reference, or guest orders) are excluded — NULLs are not
-- considered equal by Postgres, but the partial index keeps the index
-- small and avoids touching legacy rows.
CREATE UNIQUE INDEX "Order_paymentRef_key"
  ON "Order"("paymentRef")
  WHERE "paymentRef" IS NOT NULL;
