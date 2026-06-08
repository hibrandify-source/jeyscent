/*
  Warnings:

  - You are about to drop the column `price` on the `PendingSubscription` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `PendingSubscription` table. All the data in the column will be lost.
  - You are about to drop the column `productName` on the `PendingSubscription` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `PendingSubscription` table. All the data in the column will be lost.
  - Added the required column `items` to the `PendingSubscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_userId_fkey";

-- AlterTable
ALTER TABLE "PendingSubscription" DROP COLUMN "price",
DROP COLUMN "productId",
DROP COLUMN "productName",
DROP COLUMN "size",
ADD COLUMN     "frequencyMonths" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "items" JSONB NOT NULL,
ADD COLUMN     "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "frequency" SET DEFAULT 'bimonthly';

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "frequency" SET DEFAULT 'bimonthly';

-- AddForeignKey
ALTER TABLE "PendingSubscription" ADD CONSTRAINT "PendingSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
