export type ObligationStatus = 'pago' | 'pendente' | 'a_vencer' | 'vencido' | 'a_renovar';
export type ObligationCategory = 'IVA' | 'INSS' | 'IRPS' | 'IRPC' | 'TAE' | 'Alvara' | 'IS' | 'Outros';
export type TaxAuthority = 'AT' | 'INSS' | 'Municipio' | 'BAU' | 'Geral';

export interface FiscalObligation {
  id: string;
  title: string;
  category: ObligationCategory;
  period: string;
  dueDate: string; // YYYY-MM-DD
  status: ObligationStatus;
  amount?: number;
  authority: TaxAuthority;
  description: string;
  /** Client/company that owns this obligation; null is the accountant's own workspace. */
  companyId?: string | null;
  penaltyRisk?: string;
  daysRemaining?: number;
}

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  category: ObligationCategory;
  date: string;
  dueDate: string;
  daysRemaining: number;
  read: boolean;
  companyId?: string | null;
  actionUrl?: string;
  actionLabel?: string;
}

export interface SimulationRecord {
  id: string;
  simulatorId: string;
  simulatorTitle: string;
  date: string; // YYYY-MM-DD
  clientName: string;
  nuit?: string;
  currency: string;
  originalAmount: number;
  exchangeRate: number;
  mznAmount: number;
  factor: number;
  taxBase: number;
  ivaAmount: number;
  ivaRate: number;
  irpcAmount: number;
  irpcRate: number;
  totalTax: number;
  description?: string;
  providerCountry?: string;
  status: 'concluido' | 'rascunho' | 'revisado';
  responsibleName: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  nuit: string;
  plan: 'PME' | 'Contabilidade' | 'Enterprise' | 'Básico';
  status: 'regular' | 'alerta' | 'critico';
  nextObligation: string;
  nextObligationDate: string;
  contactEmail: string;
  contactPhone: string;
  activitySector: string;
  city: string;
}

export type LegalDocType = 'lei' | 'decreto' | 'regulamento' | 'diploma' | 'outro';

export interface LegalDocArticle {
  number: string;
  title: string;
  summary: string;
  fullText: string;
}

export interface LegalDoc {
  id: string;
  title: string;
  type: LegalDocType;
  number: string;
  date: string;
  summary: string;
  category: string;
  officialGazette?: string;
  articlesCount?: number;
  fullText?: string;
  keyArticles?: LegalDocArticle[];
  pdfUrl?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  date: string;
  summary: string;
  category: string;
  readTime: string;
  source: string;
  badgeType: 'blue' | 'green' | 'purple' | 'amber';
  content?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatarUrl: string;
  companyName: string;
  companyNuit: string;
  companyAddress: string;
  companyCity: string;
  companyProvince: string;
  plan: 'PME' | 'Contabilidade' | 'Enterprise';
  planStatus: 'active' | 'trial' | 'expired';
  renewalDate: string;
}

export interface NotificationSettings {
  email: boolean;
  whatsapp: boolean;
  inApp: boolean;
  sms: boolean;
}

export interface AlertTimingSettings {
  d7: boolean;
  d3: boolean;
  d1: boolean;
  d0: boolean;
}

export interface SystemSettings {
  notifications: NotificationSettings;
  alertTiming: AlertTimingSettings;
  whatsappNumber: string;
  isWhatsAppConnected: boolean;
  theme: 'light' | 'dark' | 'system';
  language: 'pt' | 'en';
}

// ─── Plans, Subscription & Audience (mirrors claq-backend contracts) ─────────

export type Audience = 'empresa' | 'contabilidade';

export type PlanFamily = 'DEMO' | 'ACCOUNTANT' | 'COMPANY';

export type TenantType = 'ACCOUNTANT' | 'COMPANY';

export type PlanCode =
  | 'DEMO'
  | 'ACCOUNTANT_FREE'
  | 'ACCOUNTANT_PRO'
  | 'ACCOUNTANT_PREMIUM'
  | 'COMPANY_MICRO'
  | 'COMPANY_PEQUENA'
  | 'COMPANY_MEDIA'
  | 'COMPANY_GRANDE';

export type PlanFeature =
  | 'FISCAL_CALENDAR'
  | 'ALERTS'
  | 'RISK_SCORE'
  | 'AUDIT'
  | 'BRANCHES'
  | 'MULTI_ENTERPRISE'
  | 'MULTI_CONTRIBUTION';

export interface PlanLimits {
  maxCompanies: number;
  maxUsers: number;
  storageLimitBytes: number;
  features: PlanFeature[];
  simulatorAccess: string[];
  notificationChannels: string[];
  maxLeadDaysEntries: number;
  annualRevenueMaxMzn: number | null;
}

export interface PlanDto {
  code: PlanCode;
  label: string;
  family: PlanFamily;
  description?: string;
  priceMzn?: number | null;
  priceMznMonthly?: number | null;
  priceMznAnnual?: number | null;
  trialDays?: number;
  customPricing?: boolean;
  limits: PlanLimits;
}

export interface RevenueThreshold {
  plan: PlanCode;
  minMzn: number;
  maxMzn: number | null;
}

export interface PlanCatalog {
  families: {
    ACCOUNTANT: PlanDto[];
    COMPANY: PlanDto[];
  };
  revenueThresholds: RevenueThreshold[];
}

export interface Subscription {
  plan: PlanCode;
  label: string;
  family: PlanFamily;
  tenantType: TenantType;
  limits: PlanLimits;
  usage: { companies: number; users: number };
  billingPeriodEnd?: string | null;
  billingInterval?: 'day' | 'week' | 'month' | 'year' | null;
}

export interface PaymentTransactionSummary {
  id: string;
  provider: 'MPESA' | 'EMOLA' | 'SIMO' | 'BANK_TRANSFER' | string;
  amount: number | string;
  currency: string;
  status: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  plan: PlanCode;
  role: string;
}

export interface MeResponse {
  user: { id: string; email: string; displayName: string };
  tenants: Tenant[];
}

// ─── Generic simulation report (print / PDF) ────────────────────────────────

export type ReportLineKind = 'info' | 'debit' | 'credit' | 'total';

export interface ReportLine {
  label: string;
  formula?: string;
  value: number;
  kind: ReportLineKind;
}

export interface ReportMetaItem {
  label: string;
  value: string;
}

export interface SimulationReport {
  id: string;
  slug: string;
  title: string;
  date: string;
  clientName?: string;
  nuit?: string;
  responsibleName?: string;
  currency?: string;
  meta?: ReportMetaItem[];
  lines: ReportLine[];
  total: number;
  totalLabel?: string;
  legalBasis?: string[];
}

// ─── Simulator catalog & run results (claq-backend /v1/simulators) ──────────

export type SimulatorInputType = 'money' | 'integer' | 'select';

export interface SimulatorInputSpec {
  name: string;
  label: string;
  type: SimulatorInputType;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
}

export interface SimulatorCatalogItem {
  code: string;
  title: string;
  category: 'FISCAL' | 'LABOR' | 'FINANCE';
  description: string;
  inputs: SimulatorInputSpec[];
  ruleCodes: string[];
}

export interface SimulatorRunLine {
  label: string;
  formula: string;
  amount: string;
  kind: ReportLineKind;
}

export interface SimulatorRuleVersion {
  code: string;
  version: number;
}

export interface SimulatorRunResult {
  id: string;
  code: string;
  title: string;
  category: string;
  at: string;
  inputs: Record<string, number | string>;
  lines: SimulatorRunLine[];
  total: string;
  ruleVersions: SimulatorRuleVersion[];
}

export type RuleStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETIRED';

export interface RuleDto {
  code: string;
  version: number;
  status: RuleStatus;
  effectiveFrom: string;
  effectiveTo: string | null;
  sourceUrl: string | null;
  reviewer: string | null;
  approvedAt: string | null;
  approvedNow: boolean;
  content: Record<string, unknown>;
}

// ─── Companies (claq-backend /v1/companies) ─────────────────────────────────

export interface BackendCompany {
  id: string;
  legalName: string;
  hasNuit: boolean;
  municipality: string | null;
  taxRegime: string | null;
  annualRevenueMzn?: string | null;
  suggestedCompanyPlan?: string | null;
}

// ─── Data upload / staging (claq-backend /v1/uploads) ───────────────────────

export type MatchStateName =
  | 'MATCHED'
  | 'AMOUNT_MISMATCH'
  | 'UNMATCHED'
  | 'NOT_APPLICABLE'
  | 'DUPLICATE'
  | 'INVALID';

export type RowDecisionName =
  | 'ADOPT'
  | 'TRUST_RULE'
  | 'TRUST_UPLOAD'
  | 'EXCLUDE'
  | 'CREATE_TEMPLATE'
  | 'REJECT';

export type RowDecision = RowDecisionName | 'PENDING';

export interface RowError {
  field: string;
  code: string;
  message: string;
}

export interface StagedRowView {
  id: string;
  rowNumber: number;
  title: string;
  normalizedTitle: string | null;
  dueAt: string | null;
  amount: string | null;
  expectedAmount: string | null;
  claimedStatus: string | null;
  matchState: MatchStateName;
  matchedTemplateCode: string | null;
  ruleCode: string | null;
  decision: RowDecision;
  errors: RowError[];
}

export interface StagedBatchView {
  id: string;
  fileName: string;
  status: string;
  rowCount: number;
  validCount: number;
  exceptionCount: number;
  companyId: string;
  createdAt: string;
  appliedAt: string | null;
  duplicate: boolean;
  counts: Partial<Record<MatchStateName, number>>;
  exceptions: StagedRowView[];
  filter: { matchState?: MatchStateName[]; decision?: RowDecisionName[] } | null;
}

export interface UploadBatchSummary {
  id: string;
  fileName: string;
  status: string;
  rowCount: number;
  validCount: number;
  exceptionCount: number;
  companyId: string;
  createdAt: string;
  appliedAt: string | null;
}

export interface DecideResult {
  updated: number;
  pending: number;
  status: string;
}

export interface ApplyResult {
  obligationsUpdated: number;
  obligationsCreated: number;
  templatesCreated: number;
  skipped: number;
}
