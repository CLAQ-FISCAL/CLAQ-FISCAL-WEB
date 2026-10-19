import { describe, expect, it } from 'vitest';
import type { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import {
  applyUpload,
  assertDecisionAllowed,
  candidateCode,
  contentHash,
  decideRows,
  initialDecision,
  loadTemplateIndex,
  normalizeTitle,
  parseCsv,
  reconcileRow,
  stageRows,
  stageUpload,
  type TemplateIndex,
} from '../src/domain/uploads';

const HEADER = 'companyNuit,obligationTitle,periodicity,dueDate,amount,baseAmount,status';

function csv(...rows: string[]): string {
  return [HEADER, ...rows].join('\n');
}

describe('normalizeTitle', () => {
  it('strips accents, case and punctuation', () => {
    expect(normalizeTitle('IRPC - 1.o Pagamento por Conta')).toBe('irpc 1o pagamento por conta');
  });

  it('treats the ordinal spellings accountants mix as one key', () => {
    const spellings = ['IRPC - 1.o Pagamento', 'IRPC - 1º Pagamento', 'IRPC - 1o Pagamento', 'IRPC - 1a Pagamento'];
    expect(new Set(spellings.map(normalizeTitle)).size).toBe(1);
  });

  it('keeps digits so a numbered series does not collapse', () => {
    expect(normalizeTitle('Anexo 2')).not.toBe(normalizeTitle('Anexo 3'));
  });
});

describe('parseCsv', () => {
  it('reads quoted fields, doubled quotes and CRLF', () => {
    const rows = parseCsv('a,b\r\n"x,1","he said ""hi"""\r\n');
    expect(rows).toEqual([
      ['a', 'b'],
      ['x,1', 'he said "hi"'],
    ]);
  });

  it('strips a UTF-8 BOM from the header', () => {
    expect(parseCsv('\uFEFFa,b\n1,2')[0]).toEqual(['a', 'b']);
  });

  it('drops blank lines', () => {
    expect(parseCsv('a,b\n\n1,2\n')).toHaveLength(2);
  });
});

describe('stageRows', () => {
  it('accepts the canonical header and reports no errors', () => {
    const [row] = stageRows(csv('400889900,IVA,MONTHLY,2026-01-15,14400.00,90000.00,UPCOMING'));
    expect(row.errors).toEqual([]);
    expect(row.amount?.toFixed(2)).toBe('14400.00');
    expect(row.baseAmount?.toFixed(2)).toBe('90000.00');
    expect(row.dueAt?.toISOString()).toBe('2026-01-15T23:59:59.000Z');
    expect(row.claimedStatus).toBe('UPCOMING');
    expect(row.rowNumber).toBe(2);
  });

  it('accepts Portuguese column aliases and pt-MZ amounts', () => {
    const text = 'nuit,obrigacao,datavencimento,valor\n400889900,IVA,2026-01-15,"1.234,56"\n';
    const [row] = stageRows(text);
    expect(row.errors).toEqual([]);
    expect(row.amount?.toFixed(2)).toBe('1234.56');
    expect(row.raw.companyNuit).toBe('400889900');
  });

  it('rejects a file with no required column', () => {
    expect(() => stageRows('a,b\n1,2')).toThrow(/obligationTitle/);
  });

  it('rejects a file with no data rows', () => {
    expect(() => stageRows(HEADER)).toThrow(/at least one data row/);
  });

  it('rejects a NUIT that Excel turned into scientific notation', () => {
    const [row] = stageRows(csv('4.008899E+08,IVA,MONTHLY,2026-01-15,1.00,,UPCOMING'));
    expect(row.errors.map((e) => e.code)).toContain('NOT_9_DIGITS');
    expect(row.errors[0].message).toMatch(/Text/);
  });

  it('rejects a NUIT that is not nine digits', () => {
    const [row] = stageRows(csv('40088990,IVA,MONTHLY,2026-01-15,1.00,,UPCOMING'));
    expect(row.errors.map((e) => e.code)).toContain('NOT_9_DIGITS');
  });

  it('leaves companyNuit empty rather than borrowing another column when it is absent', () => {
    const [row] = stageRows('obligationTitle,dueDate\nIVA,2026-01-15\n');
    expect(row.errors).toEqual([]);
    expect(row.raw.companyNuit).toBe('');
  });

  it('rejects a non-ISO due date', () => {
    const [row] = stageRows(csv('400889900,IVA,MONTHLY,15/01/2026,1.00,,UPCOMING'));
    expect(row.errors.map((e) => e.code)).toContain('NOT_ISO');
    expect(row.dueAt).toBeNull();
  });

  it('rejects an amount with more than two decimals', () => {
    const [row] = stageRows(csv('400889900,IVA,MONTHLY,2026-01-15,144.005,,UPCOMING'));
    expect(row.errors.map((e) => e.code)).toContain('NOT_NUMERIC');
  });

  it('names the OUT_NOT_APPLICABLE mistake explicitly', () => {
    const [row] = stageRows(csv('400889900,IVA,MONTHLY,2026-01-15,0.00,,OUT_NOT_APPLICABLE'));
    expect(row.errors[0].message).toMatch(/NOT_APPLICABLE/);
    expect(row.claimedStatus).toBeNull();
  });

  it('accepts NOT_APPLICABLE as a claimed status', () => {
    const [row] = stageRows(csv('400889900,IVA,MONTHLY,2026-01-15,0.00,,NOT_APPLICABLE'));
    expect(row.errors).toEqual([]);
    expect(row.claimedStatus).toBe('NOT_APPLICABLE');
  });

  it('rejects more rows than the limit', () => {
    const rows = Array.from({ length: 5001 }, (_, i) => `400889900,IVA,MONTHLY,2026-01-15,1.00,,UPCOMING`);
    expect(() => stageRows(csv(...rows))).toThrow(/5000/);
  });
});

describe('reconcileRow', () => {
  const index: TemplateIndex = new Map([
    [
      'iva',
      {
        code: 'OBL_IVA',
        version: '2026.1',
        template: { title: 'IVA', category: 'TAX', periodicity: 'MONTHLY', dueDay: 15 },
        sourceUrl: 'https://example.mz',
        effectiveFrom: new Date(Date.UTC(2026, 0, 1)),
        effectiveTo: null,
        fixedAmount: null,
        rate: new Decimal(0.16),
      },
    ],
  ]);

  const row = (over: Partial<ReturnType<typeof stageRows>[number]> = {}) => {
    const [staged] = stageRows(csv('400889900,IVA,MONTHLY,2026-01-15,14400.00,90000.00,UPCOMING'));
    return { ...staged, ...over };
  };

  it('matches when the uploaded amount equals base x the approved rate', () => {
    const outcome = reconcileRow(row(), index, new Set());
    expect(outcome.matchState).toBe('MATCHED');
    expect(outcome.matchedTemplateCode).toBe('OBL_IVA');
    expect(outcome.expectedAmount?.toFixed(2)).toBe('14400.00');
  });

  it('flags a disputed amount instead of overwriting it', () => {
    const [staged] = stageRows(csv('400889900,IVA,MONTHLY,2026-01-15,9999.00,90000.00,UPCOMING'));
    expect(reconcileRow(staged, index, new Set()).matchState).toBe('AMOUNT_MISMATCH');
  });

  it('cannot verify an amount when the rule declares no rate and no fee', () => {
    const flat = new Map(index);
    flat.set('iva', { ...(index.get('iva') as NonNullable<ReturnType<typeof index.get>>), rate: null, fixedAmount: null });
    const [staged] = stageRows(csv('400889900,IVA,MONTHLY,2026-01-15,9999.00,,UPCOMING'));
    expect(reconcileRow(staged, flat, new Set()).matchState).toBe('MATCHED');
  });

  it('reports an unknown obligation as UNMATCHED, never as a match', () => {
    const [staged] = stageRows(csv('400889900,Retencao de Juros Bancarios,MONTHLY,2026-01-31,500.00,,UPCOMING'));
    const outcome = reconcileRow(staged, index, new Set());
    expect(outcome.matchState).toBe('UNMATCHED');
    expect(outcome.matchedTemplateCode).toBeNull();
  });

  it('marks a repeated title and due date as DUPLICATE', () => {
    const [staged] = stageRows(csv('400889900,IVA,MONTHLY,2026-01-15,14400.00,90000.00,UPCOMING'));
    const seen = new Set<string>();
    reconcileRow(staged, index, seen);
    expect(reconcileRow(staged, index, seen).matchState).toBe('DUPLICATE');
  });

  it('keeps NOT_APPLICABLE out of the match path', () => {
    const [staged] = stageRows(csv('400889900,IVA,MONTHLY,2026-01-15,0.00,,NOT_APPLICABLE'));
    expect(reconcileRow(staged, index, new Set()).matchState).toBe('NOT_APPLICABLE');
  });

  it('marks an unparseable row INVALID before any template lookup', () => {
    const [staged] = stageRows(csv('400889900,IVA,MONTHLY,15/01/2026,1.00,,UPCOMING'));
    expect(reconcileRow(staged, index, new Set()).matchState).toBe('INVALID');
  });
});

describe('initialDecision', () => {
  it('adopts a clean match and rejects unusable rows without asking a human', () => {
    expect(initialDecision('MATCHED')).toBe('ADOPT');
    expect(initialDecision('NOT_APPLICABLE')).toBe('EXCLUDE');
    expect(initialDecision('DUPLICATE')).toBe('REJECT');
    expect(initialDecision('INVALID')).toBe('REJECT');
  });

  it('leaves only the states a rule cannot settle for a human', () => {
    expect(initialDecision('AMOUNT_MISMATCH')).toBe('PENDING');
    expect(initialDecision('UNMATCHED')).toBe('PENDING');
  });
});

describe('assertDecisionAllowed', () => {
  it('only lets an UNMATCHED row propose a template', () => {
    expect(() => assertDecisionAllowed('UNMATCHED', 'CREATE_TEMPLATE')).not.toThrow();
    expect(() => assertDecisionAllowed('MATCHED', 'CREATE_TEMPLATE')).toThrow(/UNMATCHED/);
  });

  it('only lets a disputed amount choose a side', () => {
    expect(() => assertDecisionAllowed('AMOUNT_MISMATCH', 'TRUST_RULE')).not.toThrow();
    expect(() => assertDecisionAllowed('MATCHED', 'TRUST_UPLOAD')).toThrow(/AMOUNT_MISMATCH/);
  });

  it('never lets an unusable row be decided', () => {
    expect(() => assertDecisionAllowed('INVALID', 'REJECT')).toThrow(/INVALID/);
  });
});

describe('candidateCode', () => {
  it('namespaces a proposal so it cannot collide with a real template code', () => {
    expect(candidateCode('Retencao 5% sobre Juros Bancarios')).toBe('CAND_RETENCAO_5_SOBRE_JUROS_BANCARIOS');
    expect(candidateCode('Taxa Municipal de Licenca de Importacao')).toBe('CAND_TAXA_MUNICIPAL_DE_LICENCA_DE_IMPORTACAO');
  });

  it('gives the same code for the same obligation written two ways', () => {
    expect(candidateCode('Taxa Municipal de Licença de Importação')).toBe(candidateCode('Taxa Municipal de Licenca de Importacao'));
  });

  it('surfaces the proposed code on the exception row', () => {
    const [row] = stageRows(csv('400889900,Taxa Municipal de Licenca de Importacao,ANNUAL,2026-09-30,3200.00,,UPCOMING'));
    const outcome = reconcileRow(row, new Map(), new Set());
    expect(outcome.matchState).toBe('UNMATCHED');
    expect(outcome.matchedTemplateCode).toBeNull();
    expect(outcome.ruleCode).toBe('CAND_TAXA_MUNICIPAL_DE_LICENCA_DE_IMPORTACAO');
  });
});

describe('contentHash', () => {
  it('is stable for identical bytes and differs otherwise', () => {
    expect(contentHash('a,b\n1,2')).toBe(contentHash('a,b\n1,2'));
    expect(contentHash('a,b\n1,2')).not.toBe(contentHash('a,b\n1,3'));
  });
});

// --- database-backed behaviour, against an in-memory fake transaction client ---

type Rule = {
  code: string;
  version: string;
  status: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  content: Record<string, unknown>;
  sourceUrl: string;
};

const IVA_RULE: Rule = {
  code: 'OBL_IVA',
  version: '2026.1',
  status: 'APPROVED',
  effectiveFrom: new Date(Date.UTC(2026, 0, 1)),
  effectiveTo: null,
  sourceUrl: 'https://example.mz/iva',
  content: { kind: 'OBLIGATION_TEMPLATE', title: 'IVA', category: 'TAX', periodicity: 'MONTHLY', dueDay: 15, rate: 0.16 },
};

const INSS_RULE: Rule = {
  code: 'OBL_INSS',
  version: '2026.1',
  status: 'APPROVED',
  effectiveFrom: new Date(Date.UTC(2026, 0, 1)),
  effectiveTo: null,
  sourceUrl: 'https://example.mz/inss',
  content: { kind: 'OBLIGATION_TEMPLATE', title: 'INSS - Contribuicao Trabalhista e Patronal', category: 'CONTRIBUTION', periodicity: 'MONTHLY', dueDay: 10, rate: 0.07 },
};

const APPROVED_2025_IVA: Rule = {
  ...IVA_RULE,
  version: '2025.1',
  effectiveFrom: new Date(Date.UTC(2025, 0, 1)),
  effectiveTo: new Date(Date.UTC(2025, 11, 31)),
};

function fakeTx(opts: { rules?: Rule[]; companyId?: string | null; batch?: Record<string, unknown> | null; rows?: Record<string, unknown>[]; obligations?: Record<string, unknown>[] } = {}) {
  const rules = opts.rules ?? [IVA_RULE, INSS_RULE, APPROVED_2025_IVA];
  const batches: Record<string, unknown>[] = opts.batch ? [opts.batch] : [];
  const rows: Record<string, unknown>[] = [...(opts.rows ?? [])];
  const createdRules: Record<string, unknown>[] = [];
  const obligations: Record<string, unknown>[] = [...(opts.obligations ?? [])];
  const audits: Record<string, unknown>[] = [];

  const companyId = opts.companyId === undefined ? 'company-1' : opts.companyId;
  let seq = 0;

  const matches = (row: Record<string, unknown>, where: Record<string, any> = {}) =>
    Object.entries(where).every(([key, cond]) => {
      if (cond === undefined) return true;
      if (key === 'OR') return (cond as Record<string, unknown>[]).some((branch) => matches(row, branch));
      const value = row[key];
      if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
        if ('in' in cond) return (cond.in as unknown[]).includes(value);
        if ('gte' in cond) return (value as Date) >= cond.gte;
        if ('lte' in cond) return (value as Date) <= cond.lte;
        if ('gt' in cond) return (value as Date) > cond.gt;
      }
      return value === cond;
    });

  const tx = {
    company: {
      findFirst: async ({ where }: { where: Record<string, unknown> }) => (companyId && matches({ id: companyId, ...where }, where) ? { id: companyId } : null),
    },
    ruleSet: {
      findMany: async ({ where }: { where?: Record<string, any> } = {}) =>
        rules
          .filter((r) => matches(r as unknown as Record<string, unknown>, where))
          .sort((a, b) => (a.code === b.code ? b.version.localeCompare(a.version) : a.code.localeCompare(b.code))),
      findFirst: async ({ where }: { where: Record<string, unknown> }) => createdRules.find((r) => matches(r, where)) ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        createdRules.push(data);
        return data;
      },
    },
    uploadBatch: {
      findFirst: async ({ where }: { where: Record<string, any> }) => {
        const found = batches.find((b) => matches(b, where));
        return found ? { ...found, rows: rows.filter((r) => r.uploadId === found.id) } : null;
      },
      findFirstOrThrow: async ({ where }: { where: Record<string, any> }) => {
        const found = batches.find((b) => matches(b, where));
        if (!found) throw new Error('not found');
        return { ...found, rows: rows.filter((r) => r.uploadId === found.id) };
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const record = { id: `batch-${++seq}`, createdAt: new Date(), appliedAt: null, ...data };
        batches.push(record);
        return record;
      },
      update: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        const target = batches.find((b) => b.id === where.id);
        if (!target) throw new Error('not found');
        Object.assign(target, data);
        return target;
      },
    },
    stagingRow: {
      createMany: async ({ data }: { data: Record<string, unknown>[] }) => {
        rows.push(...data);
        return { count: data.length };
      },
      findMany: async ({ where }: { where: Record<string, any> }) => rows.filter((r) => matches(r, where)),
      findFirstOrThrow: async () => {
        throw new Error('unused');
      },
      updateMany: async ({ where, data }: { where: Record<string, any>; data: Record<string, unknown> }) => {
        const targets = rows.filter((r) => matches(r, where.id ? { id: { in: where.id.in } } : where));
        for (const t of targets) Object.assign(t, data);
        return { count: targets.length };
      },
      count: async ({ where }: { where: Record<string, any> }) => rows.filter((r) => matches(r, where)).length,
    },
    obligation: {
      findMany: async ({ where }: { where: Record<string, any> }) => obligations.filter((o) => matches(o, where)),
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const record = { id: `obl-${++seq}`, ...data };
        obligations.push(record);
        return record;
      },
      update: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        const target = obligations.find((o) => o.id === where.id);
        if (!target) throw new Error('not found');
        Object.assign(target, data);
        return target;
      },
    },
    auditEvent: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        audits.push(data);
        return data;
      },
    },
  };

  return { tx: tx as unknown as Prisma.TransactionClient, state: { batches, rows, createdRules, obligations, audits } };
}

const STAGE_OPTS = { tenantId: 'tenant-1', companyId: 'company-1', fileName: 'obligations.csv', actorId: 'user-1', requestId: 'req-1' };

describe('loadTemplateIndex', () => {
  it('keys the latest approved version of each template by normalised title', async () => {
    const { tx } = fakeTx();
    const index = await loadTemplateIndex(tx, new Date(Date.UTC(2026, 6, 1)));
    expect(index.get('iva')?.version).toBe('2026.1');
    expect(index.get('inss contribuicao trabalhista e patronal')?.code).toBe('OBL_INSS');
  });

  it('excludes a version whose effective window has closed', async () => {
    const { tx } = fakeTx();
    const index = await loadTemplateIndex(tx, new Date(Date.UTC(2025, 6, 1)));
    expect(index.get('iva')?.version).toBe('2025.1');
  });

  it('ignores a template that is not approved', async () => {
    const { tx } = fakeTx({ rules: [{ ...IVA_RULE, status: 'DRAFT' }] });
    expect((await loadTemplateIndex(tx, new Date(Date.UTC(2026, 6, 1)))).size).toBe(0);
  });
});

describe('stageUpload', () => {
  it('stages a clean file with nothing left for a human to do', async () => {
    const { tx } = fakeTx();
    const view = await stageUpload(tx, { ...STAGE_OPTS, content: csv('400889900,IVA,MONTHLY,2026-01-15,14400.00,90000.00,SUBMITTED') });
    expect(view.rowCount).toBe(1);
    expect(view.validCount).toBe(1);
    expect(view.exceptionCount).toBe(0);
    expect(view.exceptions).toEqual([]);
    expect(view.status).toBe('RECONCILED');
  });

  it('leaves only the disputed amount and the unknown obligation pending', async () => {
    const { tx } = fakeTx();
    const view = await stageUpload(tx, {
      ...STAGE_OPTS,
      content: csv(
        '400889900,IVA,MONTHLY,2026-01-15,14400.00,90000.00,SUBMITTED',
        '400889900,INSS - Contribuicao Trabalhista e Patronal,MONTHLY,2026-01-10,999.00,1850000.00,SUBMITTED',
        '400889900,Retencao de Juros Bancarios,MONTHLY,2026-01-31,500.00,,UPCOMING',
      ),
    });
    expect(view.counts).toEqual({ MATCHED: 1, AMOUNT_MISMATCH: 1, UNMATCHED: 1 });
    expect(view.exceptionCount).toBe(2);
    expect(view.exceptions.map((e) => e.matchState).sort()).toEqual(['AMOUNT_MISMATCH', 'UNMATCHED']);
  });

  it('rejects an unknown obligation as a template proposal, not an obligation', async () => {
    const { tx, state } = fakeTx();
    const view = await stageUpload(tx, { ...STAGE_OPTS, content: csv('400889900,Retencao de Juros Bancarios,MONTHLY,2026-01-31,500.00,,UPCOMING') });
    expect(view.exceptions[0].matchedTemplateCode).toBeNull();
    expect(state.obligations).toHaveLength(0);
    expect(state.createdRules).toHaveLength(0);
  });

  it('is a no-op when the identical file is uploaded again', async () => {
    const { tx, state } = fakeTx();
    const content = csv('400889900,IVA,MONTHLY,2026-01-15,14400.00,90000.00,SUBMITTED');
    const first = await stageUpload(tx, { ...STAGE_OPTS, content });
    const second = await stageUpload(tx, { ...STAGE_OPTS, content });
    expect(second.duplicate).toBe(true);
    expect(second.id).toBe(first.id);
    expect(state.batches).toHaveLength(1);
    expect(state.rows).toHaveLength(1);
  });

  it('refuses a company outside the tenant', async () => {
    const { tx } = fakeTx({ companyId: null });
    await expect(stageUpload(tx, { ...STAGE_OPTS, content: csv('400889900,IVA,MONTHLY,2026-01-15,1.00,6.25,UPCOMING') })).rejects.toThrow(/Company not found/);
  });

  it('matches a prior year against the rules in force that year', async () => {
    const { tx } = fakeTx();
    const view = await stageUpload(tx, { ...STAGE_OPTS, content: csv('400889900,IVA,MONTHLY,2025-01-15,14400.00,90000.00,SUBMITTED') });
    expect(view.exceptions).toEqual([]);
    expect(view.validCount).toBe(1);
  });
});

describe('decideRows', () => {
  const staged = async () => {
    const { tx, state } = fakeTx();
    const view = await stageUpload(tx, {
      ...STAGE_OPTS,
      content: csv(
        '400889900,IVA,MONTHLY,2026-01-15,9999.00,90000.00,SUBMITTED',
        '400889900,Retencao de Juros Bancarios,MONTHLY,2026-01-31,500.00,,UPCOMING',
      ),
    });
    return { tx, state, view };
  };

  it('records the verdict and moves the batch to DECIDED once nothing is pending', async () => {
    const { tx, view } = await staged();
    const first = await decideRows(tx, { tenantId: 'tenant-1', uploadId: view.id, decision: 'TRUST_UPLOAD', matchStates: ['AMOUNT_MISMATCH'], actorId: 'user-1', requestId: 'req-2' });
    expect(first).toEqual({ updated: 1, pending: 1, status: 'RECONCILED' });
    const second = await decideRows(tx, { tenantId: 'tenant-1', uploadId: view.id, decision: 'CREATE_TEMPLATE', matchStates: ['UNMATCHED'], actorId: 'user-1', requestId: 'req-3' });
    expect(second).toEqual({ updated: 1, pending: 0, status: 'DECIDED' });
  });

  it('only touches the rows it was pointed at', async () => {
    const { tx, state, view } = await staged();
    const target = state.rows.find((r) => r.matchState === 'UNMATCHED') as Record<string, unknown>;
    await decideRows(tx, { tenantId: 'tenant-1', uploadId: view.id, decision: 'REJECT', rowNumbers: [target.rowNumber as number], actorId: 'user-1', requestId: 'req-2' });
    expect(state.rows.find((r) => r.matchState === 'AMOUNT_MISMATCH')?.decision).toBe('PENDING');
  });

  it('refuses a decision the match state cannot support', async () => {
    const { tx, state, view } = await staged();
    await expect(
      decideRows(tx, { tenantId: 'tenant-1', uploadId: view.id, decision: 'CREATE_TEMPLATE', matchStates: ['AMOUNT_MISMATCH'], actorId: 'user-1', requestId: 'req-2' }),
    ).rejects.toThrow(/UNMATCHED/);
    expect(state.rows.every((r) => r.decision === 'PENDING')).toBe(true);
  });

  it('will not re-decide an applied upload', async () => {
    const { tx, view } = await staged();
    await tx.uploadBatch.update({ where: { id: view.id }, data: { status: 'APPLIED' } });
    await expect(
      decideRows(tx, { tenantId: 'tenant-1', uploadId: view.id, decision: 'REJECT', matchStates: ['UNMATCHED'], actorId: 'user-1', requestId: 'req-2' }),
    ).rejects.toThrow(/already been applied/);
  });

  it('rejects an empty scope', async () => {
    const { tx, view } = await staged();
    await expect(decideRows(tx, { tenantId: 'tenant-1', uploadId: view.id, decision: 'REJECT', rowNumbers: [], actorId: 'user-1', requestId: 'req-2' })).rejects.toThrow(/cannot be empty/);
  });
});

describe('applyUpload', () => {
  const stageAndDecide = async (onDisputedAmount: 'TRUST_UPLOAD' | 'TRUST_RULE' | 'REJECT') => {
    const { tx, state } = fakeTx({
      obligations: [{ id: 'obl-iva', tenantId: 'tenant-1', companyId: 'company-1', title: 'IVA', dueAt: new Date('2026-01-15T23:59:59.000Z'), status: 'UPCOMING' }],
    });
    const view = await stageUpload(tx, {
      ...STAGE_OPTS,
      content: csv(
        '400889900,IVA,MONTHLY,2026-01-15,9999.00,90000.00,SUBMITTED',
        '400889900,Retencao de Juros Bancarios,MONTHLY,2026-01-31,500.00,,UPCOMING',
      ),
    });
    await decideRows(tx, { tenantId: 'tenant-1', uploadId: view.id, decision: onDisputedAmount, matchStates: ['AMOUNT_MISMATCH'], actorId: 'user-1', requestId: 'req-2' });
    await decideRows(tx, { tenantId: 'tenant-1', uploadId: view.id, decision: 'CREATE_TEMPLATE', matchStates: ['UNMATCHED'], actorId: 'user-1', requestId: 'req-2' });
    return { tx, state, view };
  };

  it('refuses to apply while an exception is undecided', async () => {
    const { tx } = fakeTx();
    const view = await stageUpload(tx, { ...STAGE_OPTS, content: csv('400889900,Retencao de Juros Bancarios,MONTHLY,2026-01-31,500.00,,UPCOMING') });
    await expect(applyUpload(tx, { tenantId: 'tenant-1', uploadId: view.id, actorId: 'user-1', requestId: 'req-3' })).rejects.toThrow(/needs a decision/);
  });

  it('adopts the uploaded status when the human sides with the upload', async () => {
    const { tx, state } = await stageAndDecide('TRUST_UPLOAD');
    const result = await applyUpload(tx, { tenantId: 'tenant-1', uploadId: 'batch-1', actorId: 'user-1', requestId: 'req-3' });
    expect(result.obligationsUpdated).toBe(1);
    expect(state.obligations.find((o) => o.id === 'obl-iva')?.status).toBe('SUBMITTED');
    expect(state.batches[0].status).toBe('APPLIED');
  });

  it('keeps the approved rule status when the human sides with the rule', async () => {
    const { tx, state } = await stageAndDecide('TRUST_RULE');
    const result = await applyUpload(tx, { tenantId: 'tenant-1', uploadId: 'batch-1', actorId: 'user-1', requestId: 'req-3' });
    expect(result.obligationsUpdated).toBe(0);
    expect(state.obligations.find((o) => o.id === 'obl-iva')?.status).toBe('UPCOMING');
  });

  it('turns an unmatched row into a DRAFT rule, never into an obligation', async () => {
    const { tx, state } = await stageAndDecide('TRUST_RULE');
    const result = await applyUpload(tx, { tenantId: 'tenant-1', uploadId: 'batch-1', actorId: 'user-1', requestId: 'req-3' });
    expect(result.templatesCreated).toBe(1);
    expect(state.createdRules).toHaveLength(1);
    expect(state.createdRules[0].status).toBe('DRAFT');
    expect(state.createdRules[0].approvedAt).toBeNull();
    expect(state.obligations.filter((o) => String(o.title).includes('Juros'))).toHaveLength(0);
  });

  it('is idempotent once applied', async () => {
    const { tx } = await stageAndDecide('TRUST_UPLOAD');
    await applyUpload(tx, { tenantId: 'tenant-1', uploadId: 'batch-1', actorId: 'user-1', requestId: 'req-3' });
    const second = await applyUpload(tx, { tenantId: 'tenant-1', uploadId: 'batch-1', actorId: 'user-1', requestId: 'req-4' });
    expect(second).toEqual({ obligationsUpdated: 0, obligationsCreated: 0, templatesCreated: 0, skipped: 0 });
  });

  it('refuses an upload belonging to another tenant', async () => {
    const { tx } = await stageAndDecide('TRUST_UPLOAD');
    await expect(applyUpload(tx, { tenantId: 'tenant-2', uploadId: 'batch-1', actorId: 'user-1', requestId: 'req-3' })).rejects.toThrow(/not found/i);
  });
});
