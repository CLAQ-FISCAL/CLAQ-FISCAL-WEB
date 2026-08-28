/*
  Warnings:

  - You are about to drop the column `stripeCustomerId` on the `Tenant` table. All the data in the column will be lost.
  - You are about to drop the `BillingSubscription` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Invoice` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BillingSubscription" DROP CONSTRAINT "BillingSubscription_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_tenantId_fkey";

-- DropIndex
DROP INDEX "Tenant_stripeCustomerId_key";

-- AlterTable
ALTER TABLE "ExchangeRateCache" ALTER COLUMN "fetchedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "LegalDocument" ALTER COLUMN "effectiveAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "NewsArticle" ALTER COLUMN "publishedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "NewsletterSubscriber" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PaymentTransaction" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "stripeCustomerId",
ALTER COLUMN "plan" SET DEFAULT 'ACCOUNTANT_OFFICE';

-- DropTable
DROP TABLE "BillingSubscription";

-- DropTable
DROP TABLE "Invoice";
