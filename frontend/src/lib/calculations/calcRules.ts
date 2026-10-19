import type { RuleDto } from '../../types';

export interface IrpsBracket {
  upto: number | null;
  rate: number;
}

export interface StampDutyEntry {
  code: string;
  label: string;
  rate: number;
}

export interface NonResidentRule {
  grossUpFactor: number;
  vatRate: number;
  withholdingRate: number;
}

export interface IvaRule {
  standardRate: number;
  reducedRate: number;
  exemptRate: number;
}

export interface InssRule {
  employeeRate: number;
  employerRate: number;
}

export interface IrpcRule {
  standardRate: number;
  reducedRate: number;
}

export interface PenaltyRule {
  annualInterestRate: number;
  fineRate: number;
}

export interface OvertimeRule {
  weekday: number;
  night: number;
  weekend: number;
  holiday: number;
}

export interface LeaveRule {
  maxSubsidyMonths: number;
}

export interface SeveranceRule {
  daysPerYear: number;
}

export interface CalcRules {
  nonResident: NonResidentRule;
  iva: IvaRule;
  inss: InssRule;
  irpc: IrpcRule;
  penalty: PenaltyRule;
  overtime: OvertimeRule;
  leave: LeaveRule;
  severance: SeveranceRule;
  stampDuty: StampDutyEntry[];
  irpsBrackets: IrpsBracket[];
}

export const DEFAULT_IRPS_BRACKETS: IrpsBracket[] = [
  { upto: 20750, rate: 0 },
  { upto: 40999.99, rate: 0.1 },
  { upto: 80999.99, rate: 0.15 },
  { upto: 120999.99, rate: 0.2 },
  { upto: 160999.99, rate: 0.25 },
  { upto: null, rate: 0.32 },
];

export const DEFAULT_STAMP_DUTY: StampDutyEntry[] = [
  { code: 'garantias', label: 'Garantias (0,3%)', rate: 0.003 },
  { code: 'arrendamento', label: 'Arrendamento (2%)', rate: 0.02 },
  { code: 'jogos', label: 'Jogos e Apostas (10%)', rate: 0.1 },
  { code: 'transmissao_imoveis', label: 'Transmissão de Imóveis (10%)', rate: 0.1 },
  { code: 'outros', label: 'Outros Atos (0,5%)', rate: 0.005 },
];

export const DEFAULT_CALC_RULES: CalcRules = {
  nonResident: { grossUpFactor: 1.25, vatRate: 0.16, withholdingRate: 0.2 },
  iva: { standardRate: 0.16, reducedRate: 0.05, exemptRate: 0 },
  inss: { employeeRate: 0.03, employerRate: 0.04 },
  irpc: { standardRate: 0.32, reducedRate: 0.1 },
  penalty: { annualInterestRate: 0.1725, fineRate: 0.02 },
  overtime: { weekday: 1.25, night: 1.5, weekend: 2.0, holiday: 2.0 },
  leave: { maxSubsidyMonths: 1 },
  severance: { daysPerYear: 30 },
  stampDuty: DEFAULT_STAMP_DUTY,
  irpsBrackets: DEFAULT_IRPS_BRACKETS,
};

function contentOf(
  rules: Partial<Record<string, RuleDto>>,
  code: string
): Record<string, unknown> | undefined {
  const rule = rules[code];
  return rule && typeof rule.content === 'object' && rule.content !== null
    ? (rule.content as Record<string, unknown>)
    : undefined;
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function resolveBrackets(
  value: unknown,
  fallback: IrpsBracket[]
): IrpsBracket[] {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  const out: IrpsBracket[] = [];
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) return fallback;
    const rec = entry as Record<string, unknown>;
    if (typeof rec.rate !== 'number' || !Number.isFinite(rec.rate)) return fallback;
    const upto = rec.upto;
    if (upto !== null && (typeof upto !== 'number' || !Number.isFinite(upto))) {
      return fallback;
    }
    out.push({ upto: upto as number | null, rate: rec.rate });
  }
  return out;
}

function resolveStampDuty(
  value: unknown,
  fallback: StampDutyEntry[]
): StampDutyEntry[] {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  const out: StampDutyEntry[] = [];
  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) return fallback;
    const rec = entry as Record<string, unknown>;
    if (typeof rec.code !== 'string' || typeof rec.rate !== 'number') return fallback;
    if (!Number.isFinite(rec.rate)) return fallback;
    out.push({
      code: rec.code,
      label: typeof rec.label === 'string' ? rec.label : rec.code,
      rate: rec.rate,
    });
  }
  return out;
}

export function resolveCalcRules(
  rules: Partial<Record<string, RuleDto>>
): CalcRules {
  const nonResident = contentOf(rules, 'NONRESIDENT_SERVICE');
  const iva = contentOf(rules, 'IVA_RATE');
  const inss = contentOf(rules, 'INSS_RATES');
  const irpc = contentOf(rules, 'IRPC_RATE');
  const penalty = contentOf(rules, 'PENALTY_RATES');
  const overtime = contentOf(rules, 'OVERTIME_RATES');
  const leave = contentOf(rules, 'LEAVE_RULES');
  const severance = contentOf(rules, 'SEVERANCE_RULES');
  const stampDuty = contentOf(rules, 'STAMP_DUTY');
  const irps = contentOf(rules, 'IRPS_BRACKETS');

  return {
    nonResident: {
      grossUpFactor: num(nonResident?.grossUpFactor, DEFAULT_CALC_RULES.nonResident.grossUpFactor),
      vatRate: num(nonResident?.vatRate, DEFAULT_CALC_RULES.nonResident.vatRate),
      withholdingRate: num(
        nonResident?.withholdingRate,
        DEFAULT_CALC_RULES.nonResident.withholdingRate
      ),
    },
    iva: {
      standardRate: num(iva?.standardRate, DEFAULT_CALC_RULES.iva.standardRate),
      reducedRate: num(iva?.reducedRate, DEFAULT_CALC_RULES.iva.reducedRate),
      exemptRate: num(iva?.exemptRate, DEFAULT_CALC_RULES.iva.exemptRate),
    },
    inss: {
      employeeRate: num(inss?.employeeRate, DEFAULT_CALC_RULES.inss.employeeRate),
      employerRate: num(inss?.employerRate, DEFAULT_CALC_RULES.inss.employerRate),
    },
    irpc: {
      standardRate: num(irpc?.standardRate, DEFAULT_CALC_RULES.irpc.standardRate),
      reducedRate: num(irpc?.reducedRate, DEFAULT_CALC_RULES.irpc.reducedRate),
    },
    penalty: {
      annualInterestRate: num(
        penalty?.annualInterestRate,
        DEFAULT_CALC_RULES.penalty.annualInterestRate
      ),
      fineRate: num(penalty?.fineRate, DEFAULT_CALC_RULES.penalty.fineRate),
    },
    overtime: {
      weekday: num(overtime?.weekday, DEFAULT_CALC_RULES.overtime.weekday),
      night: num(overtime?.night, DEFAULT_CALC_RULES.overtime.night),
      weekend: num(overtime?.weekend, DEFAULT_CALC_RULES.overtime.weekend),
      holiday: num(overtime?.holiday, DEFAULT_CALC_RULES.overtime.holiday),
    },
    leave: {
      maxSubsidyMonths: num(leave?.maxSubsidyMonths, DEFAULT_CALC_RULES.leave.maxSubsidyMonths),
    },
    severance: {
      daysPerYear: num(severance?.daysPerYear, DEFAULT_CALC_RULES.severance.daysPerYear),
    },
    stampDuty: resolveStampDuty(stampDuty?.table, DEFAULT_CALC_RULES.stampDuty),
    irpsBrackets: resolveBrackets(irps?.monthlyBrackets, DEFAULT_CALC_RULES.irpsBrackets),
  };
}
