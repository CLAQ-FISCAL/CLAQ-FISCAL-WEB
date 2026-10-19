-- Stripe billing models (BillingSubscription, Invoice) and Tenant.stripeCustomerId.
--
-- These tables, their foreign keys, unique index and FORCE RLS policies already exist
-- physically (recreated by the 20260828155929_init drift reconcile) but were absent from
-- schema.prisma. This migration adopts them and corrects two defects inherited from the
-- upstream definition:
--
--   * Invoice.amountDue was an integer, which cannot represent Mozambican centavo amounts.
--   * Invoice.currency defaulted to the non-ISO lowercase literal 'mzn'.
--
-- The ALTERs are guarded so the migration is a no-op on any environment where the
-- reconcile has not already run.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'BillingSubscription') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS "BillingSubscription" (
      "id" TEXT NOT NULL,
      "tenantId" TEXT NOT NULL,
      "stripeCustomerId" TEXT NOT NULL,
      "stripeSubscriptionId" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "priceId" TEXT NOT NULL,
      "currentPeriodStart" TIMESTAMP(3) NOT NULL,
      "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
      "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "BillingSubscription_pkey" PRIMARY KEY ("id")
    )';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "BillingSubscription_tenantId_idx" ON "BillingSubscription"("tenantId")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "BillingSubscription_stripeCustomerId_idx" ON "BillingSubscription"("stripeCustomerId")';
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS "BillingSubscription_stripeSubscriptionId_key" ON "BillingSubscription"("stripeSubscriptionId")';
    EXECUTE 'DO $inner$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = ''BillingSubscription_tenantId_fkey'') THEN
        ALTER TABLE "BillingSubscription" ADD CONSTRAINT "BillingSubscription_tenantId_fkey"
          FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
      END IF;
    END $inner$';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Invoice') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS "Invoice" (
      "id" TEXT NOT NULL,
      "tenantId" TEXT NOT NULL,
      "stripeInvoiceId" TEXT NOT NULL,
      "amountDue" DECIMAL(12,2) NOT NULL,
      "currency" TEXT NOT NULL DEFAULT ''MZN'',
      "status" TEXT NOT NULL,
      "invoicePdfUrl" TEXT,
      "hostedInvoiceUrl" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
    )';
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_stripeInvoiceId_key" ON "Invoice"("stripeInvoiceId")';
    EXECUTE 'CREATE INDEX IF NOT EXISTS "Invoice_tenantId_createdAt_idx" ON "Invoice"("tenantId", "createdAt")';
    EXECUTE 'DO $inner$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = ''Invoice_tenantId_fkey'') THEN
        ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tenantId_fkey"
          FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
      END IF;
    END $inner$';

    -- Correct the two inherited defects on an already-materialised table.
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Invoice' AND column_name = 'amountDue'
        AND data_type = 'integer'
    ) THEN
      EXECUTE 'ALTER TABLE "Invoice" ALTER COLUMN "amountDue" TYPE DECIMAL(12,2) USING "amountDue"::DECIMAL(12,2)';
    END IF;

    EXECUTE 'ALTER TABLE "Invoice" ALTER COLUMN "currency" SET DEFAULT ''MZN''';
  END IF;
END
$$;

-- Tenant.stripeCustomerId: the webhook looks tenants up by Stripe customer id.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Tenant' AND column_name = 'stripeCustomerId'
  ) THEN
    EXECUTE 'ALTER TABLE "Tenant" ADD COLUMN "stripeCustomerId" TEXT';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Tenant_stripeCustomerId_key'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX "Tenant_stripeCustomerId_key" ON "Tenant"("stripeCustomerId")';
  END IF;
END
$$;

-- Billing tables are tenant-scoped: mirror the FORCE RLS posture of every other tenant table.
ALTER TABLE "BillingSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BillingSubscription" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "billing_subscription_tenant" ON "BillingSubscription";
CREATE POLICY "billing_subscription_tenant" ON "BillingSubscription"
  USING ("tenantId" = current_setting('app.tenant_id', true));

ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoice_tenant" ON "Invoice";
CREATE POLICY "invoice_tenant" ON "Invoice"
  USING ("tenantId" = current_setting('app.tenant_id', true));