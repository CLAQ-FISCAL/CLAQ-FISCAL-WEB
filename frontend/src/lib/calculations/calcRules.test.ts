import { describe, it, expect } from 'vitest';
import { resolveCalcRules, DEFAULT_CALC_RULES } from './calcRules';
import type { RuleDto } from '../../types';

const rule = (code: string, content: Record<string, unknown>): RuleDto => ({
  code,
  version: 1,
  status: 'APPROVED',
  effectiveFrom: '2026-01-01',
  effectiveTo: null,
  sourceUrl: null,
  reviewer: null,
  approvedAt: '2026-01-01',
  approvedNow: true,
  content,
});

describe('resolveCalcRules', () => {
  it('usa os defaults quando não há regras', () => {
    expect(resolveCalcRules({})).toEqual(DEFAULT_CALC_RULES);
  });

  it('extrai taxas de INSS aprovadas', () => {
    const rules = resolveCalcRules({
      INSS_RATES: rule('INSS_RATES', { employeeRate: 0.05, employerRate: 0.08 }),
    });
    expect(rules.inss).toEqual({ employeeRate: 0.05, employerRate: 0.08 });
  });

  it('extrai escalões IRPS no formato upto/rate', () => {
    const rules = resolveCalcRules({
      IRPS_BRACKETS: rule('IRPS_BRACKETS', {
        monthlyBrackets: [
          { upto: 1000, rate: 0 },
          { upto: null, rate: 0.25 },
        ],
      }),
    });
    expect(rules.irpsBrackets).toEqual([
      { upto: 1000, rate: 0 },
      { upto: null, rate: 0.25 },
    ]);
  });

  it('reverte para default se os escalões estiverem malformados', () => {
    const rules = resolveCalcRules({
      IRPS_BRACKETS: rule('IRPS_BRACKETS', { monthlyBrackets: [{ rate: 0.1 }] }),
    });
    expect(rules.irpsBrackets).toEqual(DEFAULT_CALC_RULES.irpsBrackets);
  });

  it('extrai a tabela de imposto do selo', () => {
    const rules = resolveCalcRules({
      STAMP_DUTY: rule('STAMP_DUTY', {
        table: [{ code: 'arrendamento', label: 'Arrendamento (3%)', rate: 0.03 }],
      }),
    });
    expect(rules.stampDuty).toEqual([
      { code: 'arrendamento', label: 'Arrendamento (3%)', rate: 0.03 },
    ]);
  });

  it('faz fallback por campo quando parcialmente definida', () => {
    const rules = resolveCalcRules({
      NONRESIDENT_SERVICE: rule('NONRESIDENT_SERVICE', { grossUpFactor: 1.4 }),
    });
    expect(rules.nonResident.grossUpFactor).toBe(1.4);
    expect(rules.nonResident.vatRate).toBe(DEFAULT_CALC_RULES.nonResident.vatRate);
    expect(rules.nonResident.withholdingRate).toBe(
      DEFAULT_CALC_RULES.nonResident.withholdingRate
    );
  });
});
