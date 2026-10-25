-- Restore the billing schema removed by the historical drift-reconciliation
-- migration 20260828155929_init. Preserve existing tenant billing identifiers
-- where present and create missing objects safely on retry.
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_stripeCustomerId_key" ON "Tenant"("stripeCustomerId");

CREATE TABLE IF NOT EXISTS "BillingSubscription" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "stripeCustomerId" TEXT NOT NULL,
  "stripeSubscriptionId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "priceId" TEXT NOT NULL,
  "billingInterval" TEXT,
  "currentPeriodStart" TIMESTAMP(3) NOT NULL,
  "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BillingSubscription_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "BillingSubscription_tenantId_idx" ON "BillingSubscription"("tenantId");
CREATE INDEX IF NOT EXISTS "BillingSubscription_stripeCustomerId_idx" ON "BillingSubscription"("stripeCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "BillingSubscription_stripeSubscriptionId_key" ON "BillingSubscription"("stripeSubscriptionId");

CREATE TABLE IF NOT EXISTS "Invoice" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "stripeInvoiceId" TEXT NOT NULL,
  "amountDue" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'MZN',
  "status" TEXT NOT NULL,
  "invoicePdfUrl" TEXT,
  "hostedInvoiceUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_stripeInvoiceId_key" ON "Invoice"("stripeInvoiceId");
CREATE INDEX IF NOT EXISTS "Invoice_tenantId_createdAt_idx" ON "Invoice"("tenantId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BillingSubscription_tenantId_fkey') THEN
    ALTER TABLE "BillingSubscription" ADD CONSTRAINT "BillingSubscription_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invoice_tenantId_fkey') THEN
    ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END
$$;

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
