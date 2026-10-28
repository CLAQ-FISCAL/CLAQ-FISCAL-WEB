import { describe, expect, it } from 'vitest';
import {
  activeCompanyStorageKey,
  companyObligationsEndpoint,
  obligationsStorageKey,
  isCompanyScopedObligations,
  resolveActiveCompanyId,
} from './companyScope';

describe('company-scoped selection and cache keys', () => {
  const tenantOneCompanies = [{ id: 'company-a' }, { id: 'company-b' }];

  it('preserves a valid selected company when switching between companies in one tenant', () => {
    expect(resolveActiveCompanyId(tenantOneCompanies, 'company-b')).toBe('company-b');
  });

  it('rejects a saved company from a different tenant and selects only from the new tenant list', () => {
    expect(resolveActiveCompanyId([{ id: 'company-c' }], 'company-a')).toBe('company-c');
    expect(resolveActiveCompanyId([], 'company-a')).toBeNull();
  });

  it('isolates active-company and obligation caches by tenant and company IDs', () => {
    expect(activeCompanyStorageKey('tenant-a')).not.toBe(activeCompanyStorageKey('tenant-b'));
    expect(obligationsStorageKey('tenant-a', 'company-a'))
      .not.toBe(obligationsStorageKey('tenant-a', 'company-b'));
    expect(obligationsStorageKey('tenant-a', 'company-a'))
      .not.toBe(obligationsStorageKey('tenant-b', 'company-a'));
  });

  it('builds an encoded, company-filtered obligations request with pagination', () => {
    expect(companyObligationsEndpoint('company/a', 500))
      .toBe('/obligations?companyId=company%2Fa&limit=500&offset=500');
  });

  it('rejects cached records belonging to another company', () => {
    expect(isCompanyScopedObligations([{ id: 'a', companyId: 'company-a' }], 'company-a')).toBe(true);
    expect(isCompanyScopedObligations([
      { id: 'a', companyId: 'company-a' },
      { id: 'b', companyId: 'company-b' },
    ], 'company-a')).toBe(false);
  });
});
