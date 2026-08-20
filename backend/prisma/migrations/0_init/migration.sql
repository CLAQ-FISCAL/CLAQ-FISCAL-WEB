-- PostgreSQL Migration & Row-Level Security (RLS) Setup for CLAQ Fiscal Alert
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Helper Function for RLS Context Tenant
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
$$ LANGUAGE SQL STABLE;

-- Row Level Security Activation
ALTER TABLE IF EXISTS companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fiscal_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tax_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
DROP POLICY IF EXISTS tenant_isolation_clients ON clients;
CREATE POLICY tenant_isolation_clients ON clients
  USING (company_id = current_tenant_id() OR current_tenant_id() IS NULL)
  WITH CHECK (company_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_obligations ON fiscal_obligations;
CREATE POLICY tenant_isolation_obligations ON fiscal_obligations
  USING (company_id = current_tenant_id() OR current_tenant_id() IS NULL)
  WITH CHECK (company_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_simulations ON tax_simulations;
CREATE POLICY tenant_isolation_simulations ON tax_simulations
  USING (company_id = current_tenant_id() OR current_tenant_id() IS NULL)
  WITH CHECK (company_id = current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_alerts ON alerts;
CREATE POLICY tenant_isolation_alerts ON alerts
  USING (company_id = current_tenant_id() OR current_tenant_id() IS NULL)
  WITH CHECK (company_id = current_tenant_id());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_obligations_due_date ON fiscal_obligations (company_id, due_date);
CREATE INDEX IF NOT EXISTS idx_simulations_company_created ON tax_simulations (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON alerts (company_id, is_read);
