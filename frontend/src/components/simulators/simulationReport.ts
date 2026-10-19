import type { TFunction } from 'i18next';
import type { ReportLine, ReportLineKind, SimulationReport } from '../../types';
import { calcLineLabel, calcLineFormula } from './calcLines';
import type { CalcLine } from '../../lib/calculations/mocambique';

/** Translates raw calculator lines into report lines (localized labels/formulas). */
export function localizeCalcLines(t: TFunction, lines: CalcLine[]): ReportLineInput[] {
  return lines.map((l) => ({
    label: calcLineLabel(t, l.label),
    formula: calcLineFormula(t, l.formula),
    value: l.value,
    kind: l.kind,
  }));
}

/** Picks the total from the calculator lines, falling back to a provided value. */
export function totalFromLines(lines: CalcLine[], fallback: number): number {
  const total = [...lines].reverse().find((l) => l.kind === 'total');
  return total ? total.value : fallback;
}

let counter = 0;

/** Short, deterministic-ish id used for the printed document reference. */
export function newReportId(): string {
  counter += 1;
  return `${Date.now().toString(36)}${counter.toString(36)}`.toUpperCase();
}

export interface ReportLineInput {
  label: string;
  formula?: string;
  value: number;
  kind?: ReportLineKind;
}

export interface SimulationReportInput {
  id?: string;
  slug: string;
  title: string;
  date?: string;
  clientName?: string;
  nuit?: string;
  responsibleName?: string;
  currency?: string;
  meta?: SimulationReport['meta'];
  lines: ReportLineInput[];
  total: number;
  totalLabel?: string;
  legalBasis?: string[];
}

/**
 * Normalizes any simulator output into a single, simulator-agnostic report
 * shape consumed by the print/PDF preview. Keeps every simulator consistent
 * without leaking simulator-specific fields into the modal.
 */
export function buildSimulationReport(input: SimulationReportInput): SimulationReport {
  return {
    id: input.id ?? newReportId(),
    slug: input.slug,
    title: input.title,
    date: input.date ?? new Date().toISOString().split('T')[0],
    clientName: input.clientName,
    nuit: input.nuit,
    responsibleName: input.responsibleName,
    currency: input.currency ?? 'MZN',
    meta: input.meta,
    lines: input.lines.map(
      (l): ReportLine => ({
        label: l.label,
        formula: l.formula,
        value: l.value,
        kind: l.kind ?? 'info',
      })
    ),
    total: input.total,
    totalLabel: input.totalLabel,
    legalBasis: input.legalBasis,
  };
}
