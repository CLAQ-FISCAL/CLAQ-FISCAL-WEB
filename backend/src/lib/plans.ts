import { Prisma } from '@prisma/client';
import { AppError } from './http';

export type PlanFamily = 'DEMO' | 'ACCOUNTANT' | 'COMPANY';

export type AccountantPlanCode = 'ACCOUNTANT_FREE' | 'ACCOUNTANT_PRO' | 'ACCOUNTANT_PREMIUM';
export type CompanyPlanCode = 'COMPANY_MICRO' | 'COMPANY_PEQUENA' | 'COMPANY_MEDIA' | 'COMPANY_GRANDE';
export type PlanCode = 'DEMO' | AccountantPlanCode | CompanyPlanCode;

export const ACCOUNTANT_PLAN_CODES: readonly AccountantPlanCode[] = ['ACCOUNTANT_FREE', 'ACCOUNTANT_PRO', 'ACCOUNTANT_PREMIUM'];
export const COMPANY_PLAN_CODES: readonly CompanyPlanCode[] = ['COMPANY_MICRO', 'COMPANY_PEQUENA', 'COMPANY_MEDIA', 'COMPANY_GRANDE'];

export type PlanFeature = 'FISCAL_CALENDAR' | 'ALERTS' | 'RISK_SCORE' | 'AUDIT' | 'BRANCHES' | 'MULTI_ENTERPRISE' | 'MULTI_CONTRIBUTION';

export const PLAN_LABELS: Record<PlanCode, string> = {
  DEMO: 'Demo (Investidores)',
  ACCOUNTANT_FREE: 'Início de Carteira',
  ACCOUNTANT_PRO: 'Carteira em Crescimento',
  ACCOUNTANT_PREMIUM: 'Carteira Alargada / Escritório',
  COMPANY_MICRO: 'Micro / EI',
  COMPANY_PEQUENA: 'Pequena Empresa',
  COMPANY_MEDIA: 'Média Empresa',
  COMPANY_GRANDE: 'Grande Empresa / Grupo',
};

export const PLAN_DESCRIPTIONS: Record<PlanCode, string> = {
  DEMO: 'Acesso completo para avaliação, com dados sintéticos.',
  ACCOUNTANT_FREE: '30 dias grátis para até 3 clientes; depois 1.500 MZN/mês.',
  ACCOUNTANT_PRO: 'Carteira até 20 clientes, calendário fiscal consolidado e relatórios por cliente.',
  ACCOUNTANT_PREMIUM: 'Carteira alargada (60+ clientes) ou vários contabilistas num escritório.',
  COMPANY_MICRO: 'Calendário fiscal, alertas e simuladores essenciais para EI e microempresas.',
  COMPANY_PEQUENA: 'Gestão de clientes e fornecedores, score de risco e 5GB de documentos.',
  COMPANY_MEDIA: 'Multiutilizador, auditoria, filiais e integrações via API.',
  COMPANY_GRANDE: 'Multiempresa, BI personalizado e SLA dedicado.',
};

export const GB = 1024 ** 3;

/** Emitted instead of `null` so the catalogue is JSON-safe for the client. */
export const UNLIMITED = 999_999;

/** Empresas tiers keyed by declared annual revenue (MZN). Boundaries are inclusive of the lower bound. */
export const REVENUE_THRESHOLDS = [
  { plan: 'COMPANY_MICRO' as const, minMzn: 0 as number | null, maxAnnualRevenueMzn: 2_500_000 as number | null },
  { plan: 'COMPANY_PEQUENA' as const, minMzn: 2_500_000 as number | null, maxAnnualRevenueMzn: 25_000_000 as number | null },
  { plan: 'COMPANY_MEDIA' as const, minMzn: 25_000_000 as number | null, maxAnnualRevenueMzn: 100_000_000 as number | null },
  { plan: 'COMPANY_GRANDE' as const, minMzn: 100_000_000 as number | null, maxAnnualRevenueMzn: null as number | null },
];

export type PlanLimits = {
  code: PlanCode;
  family: PlanFamily;
  label: string;
  description: string;
  priceMzn: number | null;
  priceMznMonthly: number | null;
  priceMznAnnual: number | null;
  trialDays: number;
  customPricing: boolean;
  maxCompanies: number;
  maxUsers: number;
  simulatorAccess: 'all' | 'core';
  coreSimulatorCodes: readonly string[];
  notificationChannels: readonly string[];
  maxLeadDaysEntries: number;
  storageLimitBytes: number | null;
  features: readonly PlanFeature[];
  annualRevenueMaxMzn: number | null;
};

export const CORE_SIMULATORS = ['IVA', 'IRPS_RETENCAO', 'IRPC_ESTIMATIVA', 'INSS', 'SALARIO_LIQUIDO', 'CUSTO_TRABALHADOR', 'MULTAS_JUROS'] as const;
export const ALL_SIMULATORS = [...CORE_SIMULATORS, 'NAO_RESIDENTE', 'HORAS_EXTRAS', 'FERIAS', 'INDEMNIZACAO', 'SELO', 'TAE'] as const;

const ALL_CHANNELS = ['EMAIL', 'PUSH', 'WHATSAPP', 'IN_APP'] as const;

const ACCOUNTANT_FEATURES: readonly PlanFeature[] = ['FISCAL_CALENDAR', 'ALERTS'];
const DEMO_FEATURES: readonly PlanFeature[] = ['FISCAL_CALENDAR', 'ALERTS', 'RISK_SCORE', 'AUDIT', 'BRANCHES', 'MULTI_ENTERPRISE', 'MULTI_CONTRIBUTION'];
const MICRO_FEATURES: readonly PlanFeature[] = ['FISCAL_CALENDAR', 'ALERTS'];
const PEQUENA_FEATURES: readonly PlanFeature[] = ['FISCAL_CALENDAR', 'ALERTS', 'RISK_SCORE'];
const MEDIA_FEATURES: readonly PlanFeature[] = ['FISCAL_CALENDAR', 'ALERTS', 'RISK_SCORE', 'AUDIT', 'BRANCHES'];
const GRANDE_FEATURES: readonly PlanFeature[] = ['FISCAL_CALENDAR', 'ALERTS', 'RISK_SCORE', 'AUDIT', 'BRANCHES', 'MULTI_ENTERPRISE', 'MULTI_CONTRIBUTION'];

function plan(
  code: PlanCode,
  family: PlanFamily,
  overrides: Partial<Omit<PlanLimits, 'code' | 'family'>>,
): PlanLimits {
  return {
    code,
    family,
    label: PLAN_LABELS[code],
    description: PLAN_DESCRIPTIONS[code],
    priceMzn: null,
    priceMznMonthly: null,
    priceMznAnnual: null,
    trialDays: 0,
    customPricing: false,
    maxCompanies: Infinity,
    maxUsers: Infinity,
    simulatorAccess: 'all',
    coreSimulatorCodes: ALL_SIMULATORS,
    notificationChannels: ALL_CHANNELS,
    maxLeadDaysEntries: 8,
    storageLimitBytes: null,
    features: DEMO_FEATURES,
    annualRevenueMaxMzn: null,
    ...overrides,
  };
}

const PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
  DEMO: plan('DEMO', 'DEMO', {}),
  ACCOUNTANT_FREE: plan('ACCOUNTANT_FREE', 'ACCOUNTANT', {
    priceMzn: 1_500,
    priceMznMonthly: 1_500,
    priceMznAnnual: 15_300,
    trialDays: 30,
    maxCompanies: 3,
    features: ACCOUNTANT_FEATURES,
  }),
  ACCOUNTANT_PRO: plan('ACCOUNTANT_PRO', 'ACCOUNTANT', {
    priceMzn: 4_500,
    priceMznMonthly: 4_500,
    priceMznAnnual: 45_900,
    maxCompanies: 20,
    features: ACCOUNTANT_FEATURES,
  }),
  ACCOUNTANT_PREMIUM: plan('ACCOUNTANT_PREMIUM', 'ACCOUNTANT', {
    priceMzn: 12_500,
    priceMznMonthly: 12_500,
    priceMznAnnual: 127_500,
    features: ACCOUNTANT_FEATURES,
  }),
  COMPANY_MICRO: plan('COMPANY_MICRO', 'COMPANY', {
    priceMzn: 1_200,
    priceMznMonthly: 1_200,
    priceMznAnnual: 12_240,
    maxCompanies: 1,
    maxUsers: 1,
    storageLimitBytes: 0,
    features: MICRO_FEATURES,
    annualRevenueMaxMzn: 2_500_000,
  }),
  COMPANY_PEQUENA: plan('COMPANY_PEQUENA', 'COMPANY', {
    priceMzn: 3_500,
    priceMznMonthly: 3_500,
    priceMznAnnual: 35_700,
    maxCompanies: 1,
    maxUsers: 3,
    storageLimitBytes: 5 * GB,
    features: PEQUENA_FEATURES,
    annualRevenueMaxMzn: 25_000_000,
  }),
  COMPANY_MEDIA: plan('COMPANY_MEDIA', 'COMPANY', {
    priceMzn: 8_500,
    priceMznMonthly: 8_500,
    priceMznAnnual: 86_700,
    maxCompanies: 1,
    maxUsers: 15,
    features: MEDIA_FEATURES,
    annualRevenueMaxMzn: 100_000_000,
  }),
  COMPANY_GRANDE: plan('COMPANY_GRANDE', 'COMPANY', {
    priceMzn: 25_000,
    priceMznMonthly: 25_000,
    customPricing: true,
    features: GRANDE_FEATURES,
  }),
};

// Older/demo accounts stored the audience label in Tenant.plan instead of a
// priced plan code. Treat those records as the entry accountant tier so they
// receive a real limit instead of silently inheriting unlimited demo access.
const LEGACY_PLAN_CODES: Record<string, PlanCode> = {
  contabilidade: 'ACCOUNTANT_FREE',
  accounting: 'ACCOUNTANT_FREE',
  pme: 'COMPANY_MICRO',
  sme: 'COMPANY_MICRO',
  'básico': 'COMPANY_MICRO',
  basic: 'COMPANY_MICRO',
  enterprise: 'COMPANY_GRANDE',
};

export function canonicalPlanCode(planCode: string): PlanCode {
  if (planCode in PLAN_LIMITS) return planCode as PlanCode;
  return LEGACY_PLAN_CODES[planCode.trim().toLowerCase()] ?? 'DEMO';
}

export function getPlanLimits(planCode: string): PlanLimits {
  return PLAN_LIMITS[canonicalPlanCode(planCode)];
}

export function isValidPlan(planCode: string): planCode is PlanCode {
  return planCode in PLAN_LIMITS;
}

export function getPlanFamily(planCode: string): PlanFamily {
  return getPlanLimits(planCode).family;
}

export function planHasFeature(planCode: string, feature: PlanFeature): boolean {
  return getPlanLimits(planCode).features.includes(feature);
}

/** Suggests the Empresas tier for a declared annual revenue in MZN (>= lower bound, < upper bound). */
export function suggestCompanyPlanCode(annualRevenueMzn: number): CompanyPlanCode {
  for (const tier of REVENUE_THRESHOLDS) {
    if (tier.maxAnnualRevenueMzn === null || annualRevenueMzn < tier.maxAnnualRevenueMzn) return tier.plan;
  }
  return 'COMPANY_GRANDE';
}

/** Plan a tenant falls back to after a subscription ends, based on its family. */
export function defaultPlanForFamily(family: string): PlanCode {
  switch (family.toUpperCase()) {
    case 'COMPANY':
      return 'COMPANY_MICRO';
    case 'DEMO':
      return 'DEMO';
    default:
      return 'ACCOUNTANT_FREE';
  }
}

export async function enforceCompanyLimit(tx: Prisma.TransactionClient, tenantId: string, planCode: string): Promise<void> {
  const limits = getPlanLimits(planCode);
  if (limits.maxCompanies === Infinity) return;
  const count = await tx.company.count({ where: { tenantId } });
  if (count >= limits.maxCompanies) {
    throw new AppError(403, 'PLAN_LIMIT_EXCEEDED', `Your ${limits.label} plan allows up to ${limits.maxCompanies} companies. Upgrade to add more.`);
  }
}

export async function enforceUserLimit(tx: Prisma.TransactionClient, tenantId: string, planCode: string): Promise<void> {
  const limits = getPlanLimits(planCode);
  if (limits.maxUsers === Infinity) return;
  const count = await tx.membership.count({ where: { tenantId } });
  if (count >= limits.maxUsers) {
    throw new AppError(403, 'PLAN_LIMIT_EXCEEDED', `Your ${limits.label} plan allows up to ${limits.maxUsers} users. Upgrade to add more.`);
  }
}

export function assertSimulatorAccess(planCode: string, simulatorCode: string): void {
  const limits = getPlanLimits(planCode);
  if (limits.simulatorAccess === 'all') return;
  if (!limits.coreSimulatorCodes.includes(simulatorCode)) {
    throw new AppError(403, 'SIMULATOR_NOT_AVAILABLE', `The '${simulatorCode}' simulator is not available on the ${limits.label} plan.`);
  }
}

export function assertNotificationChannel(planCode: string, channel: string): void {
  const limits = getPlanLimits(planCode);
  if (!limits.notificationChannels.includes(channel)) {
    throw new AppError(403, 'CHANNEL_NOT_AVAILABLE', `The '${channel}' notification channel is not available on the ${limits.label} plan.`);
  }
}
