-- Create enum types for payments
CREATE TYPE "PaymentProvider" AS ENUM ('MPESA', 'EMOLA', 'SIMO', 'BANK_TRANSFER');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- Create PaymentTransaction table
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "externalId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MZN',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "webhookVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentTransaction_provider_externalId_key" ON "PaymentTransaction"("provider", "externalId");
CREATE INDEX "PaymentTransaction_tenantId_createdAt_idx" ON "PaymentTransaction"("tenantId", "createdAt");
CREATE INDEX "PaymentTransaction_tenantId_status_idx" ON "PaymentTransaction"("tenantId", "status");

ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create LegalDocument table
CREATE TABLE "LegalDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "fullText" TEXT NOT NULL,
    "effectiveAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("id")
);

-- Create LegalArticle table
CREATE TABLE "LegalArticle" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "articleNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fullText" TEXT NOT NULL,
    "embedding" JSONB,

    CONSTRAINT "LegalArticle_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LegalArticle_documentId_idx" ON "LegalArticle"("documentId");

ALTER TABLE "LegalArticle" ADD CONSTRAINT "LegalArticle_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "LegalDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create ExchangeRateCache table
CREATE TABLE "ExchangeRateCache" (
    "id" TEXT NOT NULL,
    "base" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "rate" DECIMAL(16,6) NOT NULL,
    "source" TEXT NOT NULL,
    "fetchedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRateCache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExchangeRateCache_base_target_source_key" ON "ExchangeRateCache"("base", "target", "source");

-- Create NewsArticle table
CREATE TABLE "NewsArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "publishedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

-- Create NewsletterSubscriber table
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- Enable Row Level Security on PaymentTransaction
ALTER TABLE "PaymentTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentTransaction" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_payments ON "PaymentTransaction"
    USING ("tenantId" = current_setting('app.tenant_id', true)::text)
    WITH CHECK ("tenantId" = current_setting('app.tenant_id', true)::text);
