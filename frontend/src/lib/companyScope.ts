import type { BackendCompany, FiscalObligation } from '../types';

export const activeCompanyStorageKey = (tenantId: string): string =>
  `claq_active_company:${tenantId}`;

export const obligationsStorageKey = (tenantId: string, companyId: string): string =>
  `claq_obligations:${tenantId}:${companyId}`;

export const resolveActiveCompanyId = (
  companies: Pick<BackendCompany, 'id'>[],
  storedCompanyId: string | null
): string | null =>
  storedCompanyId && companies.some(company => company.id === storedCompanyId)
    ? storedCompanyId
    : companies[0]?.id ?? null;

export const companyObligationsEndpoint = (companyId: string, offset = 0): string =>
  `/obligations?companyId=${encodeURIComponent(companyId)}&limit=500&offset=${offset}`;

export const isCompanyScopedObligations = (
  value: unknown,
  companyId: string
): value is FiscalObligation[] =>
  Array.isArray(value) &&
  value.every(item =>
    typeof item === 'object' &&
    item !== null &&
    'companyId' in item &&
    item.companyId === companyId
  );
