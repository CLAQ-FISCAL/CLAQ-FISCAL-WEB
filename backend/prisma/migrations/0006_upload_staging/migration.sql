-- Obligation upload staging (CLAQ_FISCAL_ALERT).
-- A client upload NEVER writes an Obligation directly: it lands in "UploadBatch" +
-- "StagingRow", is reconciled against APPROVED obligation-template rules, and only
-- rows a human approved are applied. See src/domain/uploads.ts.

CREATE TYPE "UploadStatus" AS ENUM ('RECEIVED', 'RECONCILED', 'DECIDED', 'APPLIED', 'FAILED');
CREATE TYPE "MatchState" AS ENUM ('MATCHED', 'AMOUNT_MISMATCH', 'UNMATCHED', 'NOT_APPLICABLE', 'DUPLICATE', 'INVALID');
CREATE TYPE "RowDecision" AS ENUM ('PENDING', 'ADOPT', 'TRUST_RULE', 'TRUST_UPLOAD', 'EXCLUDE', 'CREATE_TEMPLATE', 'REJECT');

CREATE TABLE "UploadBatch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "status" "UploadStatus" NOT NULL DEFAULT 'RECEIVED',
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "validCount" INTEGER NOT NULL DEFAULT 0,
    "exceptionCount" INTEGER NOT NULL DEFAULT 0,
    "appliedAt" TIMESTAMPTZ(6),
    "createdBy" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UploadBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StagingRow" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "raw" JSONB NOT NULL,
    "normalizedTitle" TEXT,
    "dueAt" TIMESTAMPTZ(6),
    "amount" DECIMAL(14,2),
    "claimedStatus" "ObligationStatus",
    "ruleCode" TEXT,
    "matchState" "MatchState" NOT NULL DEFAULT 'INVALID',
    "matchedTemplateCode" TEXT,
    "expectedAmount" DECIMAL(14,2),
    "decision" "RowDecision" NOT NULL DEFAULT 'PENDING',
    "errors" JSONB,
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StagingRow_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "UploadBatch" ADD CONSTRAINT "UploadBatch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UploadBatch" ADD CONSTRAINT "UploadBatch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StagingRow" ADD CONSTRAINT "StagingRow_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "UploadBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A re-upload of the identical file is a no-op: the same content cannot be staged twice.
CREATE UNIQUE INDEX "UploadBatch_tenant_contentHash_key" ON "UploadBatch"("tenantId", "contentHash");
-- Row numbers are unique inside a batch, so re-parsing can never double-stage a line.
CREATE UNIQUE INDEX "StagingRow_upload_rowNumber_key" ON "StagingRow"("uploadId", "rowNumber");
CREATE INDEX "StagingRow_upload_matchState" ON "StagingRow"("uploadId", "matchState");
CREATE INDEX "StagingRow_upload_dueAt" ON "StagingRow"("uploadId", "dueAt");
CREATE INDEX "StagingRow_tenant" ON "StagingRow"("tenantId");
CREATE INDEX "UploadBatch_tenant_createdAt" ON "UploadBatch"("tenantId", "createdAt");

-- Staging must never leak across tenants, and FORCE makes it default-deny: without
-- app.tenant_id set (see src/lib/tenant.ts withTenant) these tables return zero rows.
ALTER TABLE "UploadBatch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StagingRow" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UploadBatch" FORCE ROW LEVEL SECURITY;
ALTER TABLE "StagingRow" FORCE ROW LEVEL SECURITY;

CREATE POLICY upload_batch_tenant ON "UploadBatch"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));
CREATE POLICY staging_row_tenant ON "StagingRow"
  USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));
