import { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { createHash, randomUUID } from 'node:crypto';
import { AppError } from '../lib/http';
import type { RuleContent } from '../rules';
import { generateObligations, parseTemplate, validateStatusTransition, type ObligationTemplate } from './obligations';

Decimal.set({ precision: 24, rounding: Decimal.ROUND_HALF_UP });

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_UPLOAD_ROWS = 5000;

const NUIT_RE = /^\d{9}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const AMOUNT_RE = /^-?\d+(\.\d{1,2})?$/;
const OBLIGATION_STATUSES = ['UPCOMING', 'DUE', 'OVERDUE', 'PAID', 'SUBMITTED', 'NOT_APPLICABLE'] as const;

/** Column aliases accepted on ingest. A client's spreadsheet is rarely already canonical. */
const COLUMN_ALIASES: Record<string, string[]> = {
  companyNuit: ['companynuit', 'nuit', 'contribuinte', 'nuite'],
  obligationTitle: ['obligationtitle', 'title', 'obrigacao', 'descricao'],
  category: ['category', 'categoria', 'tipo'],
  authority: ['authority', 'entidade', 'autoridade'],
  periodicity: ['periodicity', 'periodicidade', 'frequencia'],
  dueDate: ['duedate', 'duedate', 'datavencimento', 'prazo', 'vencimento'],
  amount: ['amount', 'valor', 'montante', 'importancia'],
  baseAmount: ['baseamount', 'base', 'basecalculo', 'baseimponivel', 'incidencia'],
  currency: ['currency', 'moeda'],
  status: ['status', 'estado', 'situacao'],
  legalBasis: ['legalbasis', 'baselegal', 'fundamentacao', 'diploma'],
};

export type RowError = { field: string; code: string; message: string };

export type StagedRow = {
  rowNumber: number;
  raw: Record<string, string>;
  normalizedTitle: string | null;
  dueAt: Date | null;
  amount: Decimal | null;
  baseAmount: Decimal | null;
  claimedStatus: (typeof OBLIGATION_STATUSES)[number] | null;
  ruleCode: string | null;
  errors: RowError[];
};

/**
 * Title normalisation used for matching. Strips accents, case, punctuation and the
 * ordinal markers accountants write inconsistently ("1.o" / "1º" / "1o"), so a client
 * spreadsheet matches the approved template title without manual remapping.
 */
export function normalizeTitle(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    // The dot in "1.o" belongs to the ordinal, so it is consumed with the letter that
    // follows it; the lookahead stops "2 Orders" being read as the ordinal "2".
    .replace(/(\d+)\s*\.?\s*(?:os|as|o|a|º|ª)(?![\p{L}])/gu, '$1o ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** RFC4180-ish CSV reader: quoted fields, doubled quotes, CRLF or LF. */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let quoted = false;
  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"' && field === '') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i += 1;
      row.push(field);
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

function mapHeader(cells: string[]): Record<string, number> {
  const index: Record<string, number> = {};
  cells.forEach((cell, i) => {
    const key = cell.trim().toLowerCase().replace(/[\s_-]/g, '');
    for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.includes(key) && index[canonical] === undefined) index[canonical] = i;
    }
  });
  return index;
}

function parseAmount(value: string): Decimal | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  // Excel hands back 4.008899E+08 when a NUIT column is treated as a number.
  if (/e[+-]?\d+$/i.test(trimmed)) return null;
  // 1.234,56 (pt-MZ) and 1,234.56 both appear in the wild.
  const normalized = /,\d{1,2}$/.test(trimmed) ? trimmed.replace(/\./g, '').replace(',', '.') : trimmed.replace(/,/g, '');
  if (!AMOUNT_RE.test(normalized)) return null;
  return new Decimal(normalized);
}

function endOfDay(date: string): Date | null {
  if (!ISO_DATE_RE.test(date)) return null;
  const parsed = new Date(`${date}T23:59:59.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Parse + validate every line. A bad line is reported, never silently dropped. */
export function stageRows(text: string): StagedRow[] {
  const grid = parseCsv(text);
  if (grid.length < 2) throw new AppError(422, 'UPLOAD_EMPTY', 'The file needs a header row and at least one data row.');
  const header = mapHeader(grid[0]);
  for (const required of ['obligationTitle', 'dueDate']) {
    if (header[required] === undefined) {
      throw new AppError(422, 'UPLOAD_SCHEMA', `Column '${required}' is missing. Expected one of: ${COLUMN_ALIASES[required].join(', ')}.`);
    }
  }
  const body = grid.slice(1);
  if (body.length > MAX_UPLOAD_ROWS) {
    throw new AppError(413, 'UPLOAD_TOO_LARGE', `The file has ${body.length} rows; the limit is ${MAX_UPLOAD_ROWS}.`);
  }
  return body.map((cells, i) => {
    const raw: Record<string, string> = {};
    for (const [canonical, at] of Object.entries(header)) {
      if (canonical !== 'companyNuit' && canonical !== 'obligationTitle') raw[canonical] = (cells[at] ?? '').trim();
    }
    const errors: RowError[] = [];
    const title = (cells[header.obligationTitle] ?? '').trim();
    if (title === '') errors.push({ field: 'obligationTitle', code: 'REQUIRED', message: 'obligationTitle is empty.' });

    // companyNuit is optional, so it must not fall back to column 0 when the client omitted it.
    const rawNuit = header.companyNuit === undefined ? '' : (cells[header.companyNuit] ?? '').trim();
    if (rawNuit !== '' && !NUIT_RE.test(rawNuit)) {
      errors.push({
        field: 'companyNuit',
        code: 'NOT_9_DIGITS',
        message: rawNuit.includes('E+')
          ? "companyNuit looks like a number in scientific notation. Re-export the column as Text."
          : 'companyNuit must be exactly 9 digits.',
      });
    }

    const dueRaw = (cells[header.dueDate] ?? '').trim();
    const dueAt = endOfDay(dueRaw);
    if (dueAt === null) {
      errors.push({ field: 'dueDate', code: 'NOT_ISO', message: "dueDate must be formatted YYYY-MM-DD." });
    }

    let amount: Decimal | null = null;
    if (header.amount !== undefined) {
      amount = parseAmount((cells[header.amount] ?? '').trim());
      const rawAmount = (cells[header.amount] ?? '').trim();
      if (rawAmount !== '' && amount === null) {
        errors.push({ field: 'amount', code: 'NOT_NUMERIC', message: 'amount must be a decimal number with at most 2 decimals.' });
      }
    }

    let baseAmount: Decimal | null = null;
    if (header.baseAmount !== undefined) {
      const rawBase = (cells[header.baseAmount] ?? '').trim();
      baseAmount = rawBase === '' ? null : parseAmount(rawBase);
      if (rawBase !== '' && baseAmount === null) {
        errors.push({ field: 'baseAmount', code: 'NOT_NUMERIC', message: 'baseAmount must be a decimal number with at most 2 decimals.' });
      }
    }

    let claimedStatus: (typeof OBLIGATION_STATUSES)[number] | null = null;
    const rawStatus = (header.status !== undefined ? (cells[header.status] ?? '').trim().toUpperCase() : '');
    if (rawStatus !== '') {
      if ((OBLIGATION_STATUSES as readonly string[]).includes(rawStatus)) {
        claimedStatus = rawStatus as (typeof OBLIGATION_STATUSES)[number];
      } else {
        errors.push({
          field: 'status',
          code: 'UNKNOWN_STATUS',
          message: rawStatus === 'OUT_NOT_APPLICABLE'
            ? "OUT_NOT_APPLICABLE does not exist; use NOT_APPLICABLE."
            : `Unknown status '${rawStatus}'.`,
        });
      }
    }

    return {
      rowNumber: i + 2,
      raw: { ...raw, companyNuit: rawNuit, obligationTitle: title },
      normalizedTitle: title === '' ? null : normalizeTitle(title),
      dueAt,
      amount,
      baseAmount,
      claimedStatus,
      ruleCode: null,
      errors,
    };
  });
}

export type IndexedTemplate = {
  code: string;
  version: string;
  template: ObligationTemplate;
  sourceUrl: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  /** Fixed fee declared by the approved rule, if the obligation has one. */
  fixedAmount: Decimal | null;
  /** Rate declared by the approved rule, used to verify baseAmount x rate. */
  rate: Decimal | null;
};

export type TemplateIndex = Map<string, IndexedTemplate>;

/** Reads the verifiable amount out of approved rule content: `amount` (fixed) or `rate`. */
function expectedFromContent(content: RuleContent, baseAmount: Decimal | null): Decimal | null {
  if (typeof content.amount === 'number' && Number.isFinite(content.amount)) {
    return new Decimal(content.amount).toDecimalPlaces(2);
  }
  if (typeof content.rate === 'number' && Number.isFinite(content.rate) && baseAmount !== null) {
    return baseAmount.mul(new Decimal(content.rate)).toDecimalPlaces(2);
  }
  return null;
}

/** Latest APPROVED version of every obligation template, keyed by normalised title. */
export async function loadTemplateIndex(tx: Prisma.TransactionClient, at: Date): Promise<TemplateIndex> {
  const rules = await tx.ruleSet.findMany({
    where: { status: 'APPROVED', effectiveFrom: { lte: at }, OR: [{ effectiveTo: null }, { effectiveTo: { gte: at } }] },
    orderBy: [{ code: 'asc' }, { version: 'desc' }],
  });
  const latest = new Map<string, (typeof rules)[number]>();
  for (const rule of rules) if (!latest.has(rule.code)) latest.set(rule.code, rule);
  const index: TemplateIndex = new Map();
  for (const rule of latest.values()) {
    const template = parseTemplate(rule.content as RuleContent);
    if (!template) continue;
    const content = rule.content as RuleContent;
    index.set(normalizeTitle(template.title), {
      code: rule.code,
      version: rule.version,
      template,
      sourceUrl: rule.sourceUrl,
      effectiveFrom: rule.effectiveFrom,
      effectiveTo: rule.effectiveTo,
      fixedAmount: typeof content.amount === 'number' && Number.isFinite(content.amount) ? new Decimal(content.amount).toDecimalPlaces(2) : null,
      rate: typeof content.rate === 'number' && Number.isFinite(content.rate) ? new Decimal(content.rate) : null,
    });
  }
  return index;
}

/**
 * Code an unmatched row is proposed under. Kept in its own CAND_ namespace so a client
 * spreadsheet can never land on the code of a real template, and created as DRAFT so it
 * cannot generate anything before an accountant approves it.
 */
export function candidateCode(title: string): string {
  const slug = normalizeTitle(title).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').toUpperCase();
  return `CAND_${slug}`.slice(0, 64);
}

export type MatchOutcome = {
  matchState: 'MATCHED' | 'AMOUNT_MISMATCH' | 'UNMATCHED' | 'NOT_APPLICABLE' | 'DUPLICATE' | 'INVALID';
  matchedTemplateCode: string | null;
  expectedAmount: Decimal | null;
  ruleCode: string | null;
};

export function reconcileRow(row: StagedRow, index: TemplateIndex, seen: Set<string>): MatchOutcome {
  if (row.errors.length > 0 || row.dueAt === null || row.normalizedTitle === null) {
    return { matchState: 'INVALID', matchedTemplateCode: null, expectedAmount: null, ruleCode: null };
  }
  const key = `${row.normalizedTitle}|${row.dueAt.toISOString().slice(0, 10)}`;
  if (seen.has(key)) {
    return { matchState: 'DUPLICATE', matchedTemplateCode: null, expectedAmount: null, ruleCode: null };
  }
  seen.add(key);
  if (row.claimedStatus === 'NOT_APPLICABLE') {
    return { matchState: 'NOT_APPLICABLE', matchedTemplateCode: null, expectedAmount: null, ruleCode: null };
  }
  const hit = index.get(row.normalizedTitle);
  // No approved template backs this row, so it proposes a code instead of borrowing one.
  if (!hit) return { matchState: 'UNMATCHED', matchedTemplateCode: null, expectedAmount: null, ruleCode: candidateCode(row.normalizedTitle) };
  // The expected amount is only computable when the approved rule declares a fixed fee,
  // or declares a rate and the client supplied a base. Otherwise the amount is not
  // verifiable from the rule and the row is simply MATCHED.
  const expected = expectedFromContent({ amount: hit.fixedAmount?.toNumber(), rate: hit.rate?.toNumber() }, row.baseAmount);
  const matches = expected === null || row.amount === null || expected.eq(row.amount);
  return {
    matchState: matches ? 'MATCHED' : 'AMOUNT_MISMATCH',
    matchedTemplateCode: hit.code,
    expectedAmount: expected,
    ruleCode: hit.code,
  };
}

export function contentHash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export const MATCH_STATES = ['MATCHED', 'AMOUNT_MISMATCH', 'UNMATCHED', 'NOT_APPLICABLE', 'DUPLICATE', 'INVALID'] as const;
export const ROW_DECISIONS = ['ADOPT', 'TRUST_RULE', 'TRUST_UPLOAD', 'EXCLUDE', 'CREATE_TEMPLATE', 'REJECT'] as const;

export type MatchStateName = (typeof MATCH_STATES)[number];
export type RowDecisionName = (typeof ROW_DECISIONS)[number];

/**
 * The verdict a row carries the moment it is staged. Only the two states a rule cannot
 * settle on its own - a disputed amount and an unknown obligation - stay PENDING for a human.
 */
export function initialDecision(matchState: MatchStateName): 'ADOPT' | 'EXCLUDE' | 'REJECT' | 'PENDING' {
  if (matchState === 'MATCHED') return 'ADOPT';
  if (matchState === 'NOT_APPLICABLE') return 'EXCLUDE';
  if (matchState === 'DUPLICATE' || matchState === 'INVALID') return 'REJECT';
  return 'PENDING';
}

/** Rejecting a decision that contradicts the match state it would be applied to. */
export function assertDecisionAllowed(matchState: MatchStateName, decision: RowDecisionName): void {
  if (decision === 'CREATE_TEMPLATE' && matchState !== 'UNMATCHED') {
    throw new AppError(422, 'DECISION_NOT_ALLOWED', 'Only an UNMATCHED row can propose a new obligation template.');
  }
  if ((decision === 'TRUST_RULE' || decision === 'TRUST_UPLOAD') && matchState !== 'AMOUNT_MISMATCH') {
    throw new AppError(422, 'DECISION_NOT_ALLOWED', `'${decision}' only applies to an AMOUNT_MISMATCH row.`);
  }
  if (matchState === 'INVALID') {
    throw new AppError(422, 'DECISION_NOT_ALLOWED', 'An INVALID row has no usable data and cannot be decided.');
  }
}

export type StagedRowView = {
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
  decision: string;
  errors: RowError[];
};

export type StagedBatchView = {
  id: string;
  fileName: string;
  status: string;
  rowCount: number;
  validCount: number;
  exceptionCount: number;
  companyId: string;
  createdAt: string;
  appliedAt: string | null;
  /** True when these bytes were already staged: the upload is a no-op, not a second batch. */
  duplicate: boolean;
  counts: Record<string, number>;
  exceptions: StagedRowView[];
  /** Set when the caller narrowed the rows: counts/exceptions then describe that slice, not the batch. */
  filter: { matchState?: MatchStateName[]; decision?: RowDecisionName[] } | null;
};

type BatchWithRows = Prisma.UploadBatchGetPayload<{ include: { rows: true } }>;

function toRowView(row: BatchWithRows['rows'][number]): StagedRowView {
  const raw = row.raw as Record<string, unknown>;
  return {
    id: row.id,
    rowNumber: row.rowNumber,
    title: typeof raw.obligationTitle === 'string' ? raw.obligationTitle : '',
    normalizedTitle: row.normalizedTitle,
    dueAt: row.dueAt?.toISOString() ?? null,
    amount: row.amount?.toFixed(2) ?? null,
    expectedAmount: row.expectedAmount?.toFixed(2) ?? null,
    claimedStatus: row.claimedStatus,
    matchState: row.matchState,
    matchedTemplateCode: row.matchedTemplateCode,
    ruleCode: row.ruleCode,
    decision: row.decision,
    errors: (row.errors as unknown as RowError[] | null) ?? [],
  };
}

function toBatchView(batch: BatchWithRows, duplicate: boolean, filter: StagedBatchView['filter'] = null): StagedBatchView {
  const counts: Record<string, number> = {};
  for (const row of batch.rows) counts[row.matchState] = (counts[row.matchState] ?? 0) + 1;
  return {
    id: batch.id,
    fileName: batch.fileName,
    status: batch.status,
    rowCount: batch.rowCount,
    validCount: batch.validCount,
    exceptionCount: batch.exceptionCount,
    companyId: batch.companyId,
    createdAt: batch.createdAt.toISOString(),
    appliedAt: batch.appliedAt?.toISOString() ?? null,
    duplicate,
    counts,
    exceptions: batch.rows.filter((r) => r.decision === 'PENDING').map(toRowView),
    filter,
  };
}

export type StageOptions = {
  tenantId: string;
  companyId: string;
  fileName: string;
  content: string;
  actorId: string;
  requestId: string;
};

/**
 * Lands a client CSV in staging and reconciles it against approved obligation templates.
 * Nothing is written to Obligation here: the batch is a proposal until it is decided and applied.
 */
export async function stageUpload(tx: Prisma.TransactionClient, opts: StageOptions): Promise<StagedBatchView> {
  const hash = contentHash(opts.content);
  const existing = await tx.uploadBatch.findFirst({
    where: { tenantId: opts.tenantId, contentHash: hash },
    include: { rows: { orderBy: { rowNumber: 'asc' } } },
  });
  if (existing) return toBatchView(existing, true);

  const company = await tx.company.findFirst({ where: { id: opts.companyId, tenantId: opts.tenantId }, select: { id: true } });
  if (!company) throw new AppError(404, 'COMPANY_NOT_FOUND', 'Company not found in this tenant.');

  const staged = stageRows(opts.content);

  // Rules are versioned and dated, so each fiscal year is matched against the templates that
  // were approved and in force back then, not against whatever is approved today.
  const years = [...new Set(staged.map((r) => r.dueAt?.getUTCFullYear()).filter((y): y is number => typeof y === 'number'))];
  const byYear = new Map<number, TemplateIndex>();
  for (const year of years) byYear.set(year, await loadTemplateIndex(tx, new Date(Date.UTC(year, 6, 1))));
  const current = await loadTemplateIndex(tx, new Date());

  const seen = new Set<string>();
  const outcomes = staged.map((row) => reconcileRow(row, byYear.get(row.dueAt?.getUTCFullYear() ?? -1) ?? current, seen));
  const byState: Record<string, number> = {};
  for (const outcome of outcomes) byState[outcome.matchState] = (byState[outcome.matchState] ?? 0) + 1;

  const batch = await tx.uploadBatch.create({
    data: {
      tenantId: opts.tenantId,
      companyId: opts.companyId,
      fileName: opts.fileName,
      contentHash: hash,
      byteSize: Buffer.byteLength(opts.content, 'utf8'),
      status: 'RECONCILED',
      rowCount: staged.length,
      validCount: outcomes.filter((o) => o.matchState === 'MATCHED').length,
      exceptionCount: outcomes.filter((o) => initialDecision(o.matchState) === 'PENDING').length,
      createdBy: opts.actorId,
    },
  });
  await tx.stagingRow.createMany({
    data: staged.map((row, i) => ({
      id: randomUUID(),
      uploadId: batch.id,
      tenantId: opts.tenantId,
      rowNumber: row.rowNumber,
      raw: row.raw as Prisma.InputJsonValue,
      normalizedTitle: row.normalizedTitle,
      dueAt: row.dueAt,
      amount: row.amount,
      claimedStatus: row.claimedStatus,
      ruleCode: outcomes[i].ruleCode,
      matchState: outcomes[i].matchState,
      matchedTemplateCode: outcomes[i].matchedTemplateCode,
      expectedAmount: outcomes[i].expectedAmount,
      decision: initialDecision(outcomes[i].matchState),
      errors: row.errors as unknown as Prisma.InputJsonValue,
    })),
  });
  await tx.auditEvent.create({
    data: {
      tenantId: opts.tenantId,
      actorId: opts.actorId,
      action: 'UPLOAD_STAGED',
      entityType: 'UploadBatch',
      entityId: batch.id,
      requestId: opts.requestId,
      after: { fileName: opts.fileName, rowCount: staged.length, validCount: batch.validCount, exceptionCount: batch.exceptionCount, counts: byState },
    },
  });

  const stored = await tx.uploadBatch.findFirstOrThrow({ where: { id: batch.id }, include: { rows: { orderBy: { rowNumber: 'asc' } } } });
  return toBatchView(stored, false);
}

export type DecideOptions = {
  tenantId: string;
  uploadId: string;
  decision: RowDecisionName;
  rowNumbers?: number[];
  matchStates?: MatchStateName[];
  actorId: string;
  requestId: string;
};

export type DecideResult = { updated: number; pending: number; status: string };

/** Records the human verdict on staging rows. Deliberately does not touch any Obligation. */
export async function decideRows(tx: Prisma.TransactionClient, opts: DecideOptions): Promise<DecideResult> {
  const batch = await tx.uploadBatch.findFirst({ where: { id: opts.uploadId, tenantId: opts.tenantId } });
  if (!batch) throw new AppError(404, 'NOT_FOUND', 'Upload not found.');
  if (batch.status === 'APPLIED') throw new AppError(409, 'UPLOAD_ALREADY_APPLIED', 'This upload has already been applied.');
  if (opts.rowNumbers !== undefined && opts.rowNumbers.length === 0) throw new AppError(422, 'INPUT_INVALID', "'rowNumbers' cannot be empty.");
  if (opts.matchStates !== undefined && opts.matchStates.length === 0) throw new AppError(422, 'INPUT_INVALID', "'matchStates' cannot be empty.");

  const candidates = await tx.stagingRow.findMany({
    where: {
      uploadId: batch.id,
      tenantId: opts.tenantId,
      ...(opts.rowNumbers !== undefined ? { rowNumber: { in: opts.rowNumbers } } : {}),
      ...(opts.matchStates !== undefined ? { matchState: { in: opts.matchStates } } : {}),
    },
    select: { id: true, matchState: true },
  });
  for (const row of candidates) assertDecisionAllowed(row.matchState, opts.decision);

  const updated = await tx.stagingRow.updateMany({
    where: { id: { in: candidates.map((r) => r.id) } },
    data: { decision: opts.decision, decidedBy: opts.actorId, decidedAt: new Date() },
  });
  const pending = await tx.stagingRow.count({ where: { uploadId: batch.id, decision: 'PENDING' } });
  const status = pending === 0 ? 'DECIDED' : 'RECONCILED';
  await tx.uploadBatch.update({ where: { id: batch.id }, data: { status } });
  await tx.auditEvent.create({
    data: {
      tenantId: opts.tenantId,
      actorId: opts.actorId,
      action: 'UPLOAD_ROWS_DECIDED',
      entityType: 'UploadBatch',
      entityId: batch.id,
      requestId: opts.requestId,
      after: { decision: opts.decision, updated: updated.count, pending },
    },
  });
  return { updated: updated.count, pending, status };
}

export type ApplyResult = { obligationsUpdated: number; obligationsCreated: number; templatesCreated: number; skipped: number };

export type BatchQuery = {
  tenantId: string;
  uploadId: string;
  matchState?: MatchStateName[];
  decision?: RowDecisionName[];
};

/** Reads one batch back for the reconciliation screen, optionally narrowed to a slice of rows. */
export async function loadBatchView(tx: Prisma.TransactionClient, query: BatchQuery): Promise<StagedBatchView> {
  const batch = await tx.uploadBatch.findFirst({
    where: { id: query.uploadId, tenantId: query.tenantId },
    include: {
      rows: {
        where: {
          ...(query.matchState ? { matchState: { in: query.matchState } } : {}),
          ...(query.decision ? { decision: { in: query.decision } } : {}),
        },
        orderBy: { rowNumber: 'asc' },
      },
    },
  });
  if (!batch) throw new AppError(404, 'NOT_FOUND', 'Upload not found.');
  return toBatchView(batch, false, { matchState: query.matchState, decision: query.decision });
}

/**
 * Applies decided staging rows. Only rows carrying an explicit human decision are
 * touched, which is what stops a client spreadsheet from injecting an obligation that
 * is not backed by an approved, sourced, dated rule.
 */
export async function applyUpload(tx: Prisma.TransactionClient, opts: { tenantId: string; uploadId: string; actorId: string; requestId: string }): Promise<ApplyResult> {
  const batch = await tx.uploadBatch.findFirst({ where: { id: opts.uploadId, tenantId: opts.tenantId } });
  if (!batch) throw new AppError(404, 'NOT_FOUND', 'Upload not found.');
  if (batch.status === 'APPLIED') return { obligationsUpdated: 0, obligationsCreated: 0, templatesCreated: 0, skipped: 0 };
  // The batch owns the company: an upload can only ever write back to the company it was staged for.
  const companyId = batch.companyId;

  const rows = await tx.stagingRow.findMany({ where: { uploadId: batch.id, tenantId: opts.tenantId }, orderBy: { rowNumber: 'asc' } });
  if (rows.some((r) => r.decision === 'PENDING')) {
    throw new AppError(409, 'DECISIONS_PENDING', 'Every exception row needs a decision before this upload can be applied.');
  }

  const result: ApplyResult = { obligationsUpdated: 0, obligationsCreated: 0, templatesCreated: 0, skipped: 0 };
  const existing = await tx.obligation.findMany({
    where: { tenantId: opts.tenantId, companyId },
    select: { id: true, title: true, dueAt: true, status: true },
  });
  const byKey = new Map(existing.map((o) => [`${normalizeTitle(o.title)}|${o.dueAt.toISOString().slice(0, 10)}`, o]));

  for (const row of rows) {
    if (row.decision === 'REJECT' || row.decision === 'EXCLUDE' || row.matchState === 'INVALID' || row.matchState === 'DUPLICATE') {
      result.skipped += 1;
      continue;
    }
    // An unmatched row is a template proposal, never an obligation.
    if (row.decision === 'CREATE_TEMPLATE') {
      if (!row.ruleCode || !row.dueAt) {
        result.skipped += 1;
        continue;
      }
      const already = await tx.ruleSet.findFirst({ where: { code: row.ruleCode } });
      if (!already) {
        const raw = row.raw as Record<string, unknown>;
        const isAnnual = String(raw.periodicity ?? '').toUpperCase() === 'ANNUAL';
        await tx.ruleSet.create({
          data: {
            code: row.ruleCode,
            version: `${row.dueAt.getUTCFullYear()}.1`,
            // DRAFT on purpose: an accountant must review and approve before it can generate.
            status: 'DRAFT',
            effectiveFrom: new Date(Date.UTC(row.dueAt.getUTCFullYear(), 0, 1)),
            effectiveTo: null,
            content: {
              kind: 'OBLIGATION_TEMPLATE',
              title: String(raw.obligationTitle ?? row.ruleCode),
              category: String(raw.category ?? 'TAX'),
              periodicity: isAnnual ? 'ANNUAL' : 'MONTHLY',
              dueDay: row.dueAt.getUTCDate(),
              ...(isAnnual ? { month: row.dueAt.getUTCMonth() + 1 } : {}),
            },
            sourceUrl: String(raw.legalBasis ?? 'PENDENTE: fonte a confirmar na revisão'),
            reviewer: null,
            approvedAt: null,
          },
        });
        result.templatesCreated += 1;
      }
      result.skipped += 1;
      continue;
    }
    if (!row.dueAt) {
      result.skipped += 1;
      continue;
    }
    const key = `${row.normalizedTitle ?? ''}|${row.dueAt.toISOString().slice(0, 10)}`;
    const target = byKey.get(key);
    if (!target) {
      // The template exists but the obligation was never generated for this year.
      result.skipped += 1;
      continue;
    }
    if (row.decision === 'TRUST_RULE' && row.claimedStatus && row.claimedStatus !== 'NOT_APPLICABLE') {
      result.skipped += 1;
      continue;
    }
    if (row.claimedStatus && row.claimedStatus !== target.status) {
      validateStatusTransition(target.status, row.claimedStatus);
      await tx.obligation.update({ where: { id: target.id }, data: { status: row.claimedStatus } });
      result.obligationsUpdated += 1;
    }
  }

  const years = [...new Set(rows.map((r) => r.dueAt?.getUTCFullYear()).filter((y): y is number => typeof y === 'number'))];
  let obligationsCreated = 0;
  for (const year of years) {
    const generated = await generateObligations(tx, { tenantId: opts.tenantId, companyId, actorId: opts.actorId, requestId: opts.requestId, year });
    obligationsCreated += generated.created;
  }
  result.obligationsCreated = obligationsCreated;

  await tx.uploadBatch.update({ where: { id: batch.id }, data: { status: 'APPLIED', appliedAt: new Date() } });
  await tx.auditEvent.create({
    data: {
      tenantId: opts.tenantId,
      actorId: opts.actorId,
      action: 'UPLOAD_APPLIED',
      entityType: 'UploadBatch',
      entityId: batch.id,
      requestId: opts.requestId,
      after: { ...result, fileName: batch.fileName, years },
    },
  });
  return result;
}
