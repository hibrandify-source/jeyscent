-- add_gifting
-- Jey Scent Gifting (gift.jeyscent.com) shares the order pipeline with the
-- main shop. Orders are tagged with the storefront that sold them, gift
-- order items carry hamper contents + personalisation, and corporate
-- enquiries are stored as quote requests.
ALTER TABLE "Order" ADD COLUMN "brand" TEXT NOT NULL DEFAULT 'jeyscent';
ALTER TABLE "OrderItem" ADD COLUMN "details" JSONB;

CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "occasion" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "budgetPerGift" DOUBLE PRECISION,
    "deliveryDate" TEXT,
    "brandingRequired" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuoteRequest_status_idx" ON "QuoteRequest"("status");
