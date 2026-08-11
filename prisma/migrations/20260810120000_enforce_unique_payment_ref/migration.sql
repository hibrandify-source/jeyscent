-- enforce_unique_payment_ref
-- Add a UNIQUE constraint on ClassEnrollment.paymentRef so concurrent
-- confirmations of the same QorePay reference can't double-create
-- enrollments (which would also double-increment earlyBirdUsed and
-- double-send the access-pin email).
--
-- Note: existing rows with NULL paymentRef are allowed (NULLs are not
-- considered equal by the unique constraint in Postgres), so legacy
-- enrollments without a payment reference remain valid.
CREATE UNIQUE INDEX "ClassEnrollment_paymentRef_key"
  ON "ClassEnrollment"("paymentRef")
  WHERE "paymentRef" IS NOT NULL;
