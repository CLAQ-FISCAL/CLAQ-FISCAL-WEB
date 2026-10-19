import { describe, expect, it, vi } from 'vitest';
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import type { PrismaClient } from '@prisma/client';
import { createHandler, type CryptoDeps } from '../src/router';

const crypto: CryptoDeps = {
  sealValue: async (v) => Buffer.from(v),
  openValue: async (b) => b.toString('utf8'),
};

function event(method: string, path: string, opts: { claims?: Record<string, unknown>; headers?: Record<string, string>; body?: Record<string, unknown>; query?: Record<string, string> } = {}): APIGatewayProxyEventV2WithJWTAuthorizer {
  return {
    rawPath: path,
    headers: opts.headers ?? {},
    queryStringParameters: opts.query ?? null,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    isBase64Encoded: false,
    version: '2.0',
    routeKey: `${method} ${path}`,
    requestContext: {
      requestId: 'req-1',
      http: { method, path, protocol: 'HTTP/1.1', sourceIp: '127.0.0.1', userAgent: 'test' },
      accountId: '1',
      apiId: 'api',
      domainName: 'api.example',
      domainPrefix: 'api',
      stage: '$default',
      time: 'now',
      timeEpoch: 0,
      authorizer: { jwt: { claims: opts.claims ?? { sub: 'sub-1', email: 'user@test.mz' }, scopes: [] } },
    },
  } as unknown as APIGatewayProxyEventV2WithJWTAuthorizer;
}

function membership(tenantId: string, name: string, role = 'OWNER') {
  return { tenantId, userId: 'user-1', role, tenant: { id: tenantId, name, plan: 'DEMO' } };
}

function stubDb(memberships: ReturnType<typeof membership>[]) {
  return {
    user: { upsert: vi.fn(async ({ create }: { create: { email: string } }) => ({ id: 'user-1', email: create.email, displayName: null })) },
    membership: { findMany: vi.fn(async () => memberships) },
    $queryRaw: vi.fn(async () => [{ ok: 1 }]),
  } as unknown as PrismaClient;
}

async function call(db: PrismaClient, method: string, path: string, opts: Parameters<typeof event>[2] = {}) {
  const res = await createHandler(db, crypto)(event(method, path, opts));
  return { status: res.statusCode, body: JSON.parse(res.body) as Record<string, unknown> };
}

describe('api router auth and routing', () => {
  it('returns 401 without a token subject', async () => {
    const res = await call(stubDb([membership('t1', 'A')]), 'GET', '/v1/dashboard', { claims: {} });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('health checks the database', async () => {
    const res = await call(stubDb([]), 'GET', '/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('returns 403 NO_TENANT for users without membership', async () => {
    const res = await call(stubDb([]), 'GET', '/v1/dashboard');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('NO_TENANT');
  });

  it('returns 400 TENANT_REQUIRED for multi-tenant users without a header', async () => {
    const res = await call(stubDb([membership('t1', 'A'), membership('t2', 'B')]), 'GET', '/v1/dashboard');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('TENANT_REQUIRED');
  });

  it('rejects a tenant header the user does not belong to', async () => {
    const res = await call(stubDb([membership('t1', 'A')]), 'GET', '/v1/dashboard', { headers: { 'x-tenant-id': 't2' } });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('TENANT_ACCESS_DENIED');
  });

  it('serves the simulator registry for a valid member', async () => {
    const res = await call(stubDb([membership('t1', 'A')]), 'GET', '/v1/simulators');
    expect(res.status).toBe(200);
    const items = res.body.items as { code: string }[];
    expect(items.length).toBeGreaterThanOrEqual(12);
    expect(items.map((i) => i.code)).toContain('IVA');
  });

  it('returns 404 for unknown routes', async () => {
    const res = await call(stubDb([membership('t1', 'A')]), 'GET', '/v1/unknown');
    expect(res.status).toBe(404);
  });

  it('rejects invalid simulator input with 422', async () => {
    const db = stubDb([membership('t1', 'A')]);
    (db as unknown as { company: { findFirst: () => Promise<null> } }).company = { findFirst: async () => null };
    (db as unknown as { $transaction: (fn: (tx: unknown) => Promise<unknown>) => Promise<unknown> }).$transaction = async (fn) => fn(db);
    (db as unknown as { $queryRaw: () => Promise<unknown[]> }).$queryRaw = async () => [];
    const res = await call(db, 'POST', '/v1/simulators/IVA', { body: undefined });
    expect([400, 422]).toContain(res.status);
  });
});

describe('upload routes', () => {
  // withTenant refuses a non-UUID tenant before any handler runs, so these use a real one.
  const TENANT = '11111111-1111-4111-8111-111111111111';

  function stubTxDb(role: string) {
    const db = stubDb([membership(TENANT, 'A', role)]) as unknown as Record<string, unknown>;
    db.$transaction = async (fn: (tx: unknown) => Promise<unknown>) => fn(db);
    db.$queryRaw = async () => [];
    return db as unknown as PrismaClient;
  }

  it('requires the CSV content, not just metadata', async () => {
    const res = await call(stubTxDb('OWNER'), 'POST', '/v1/uploads', { body: { companyId: 'c1', fileName: 'x.csv' } });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INPUT_INVALID');
  });

  it('requires a company and a file name', async () => {
    const res = await call(stubTxDb('OWNER'), 'POST', '/v1/uploads', { body: { content: 'a,b' } });
    expect(res.status).toBe(422);
    expect(res.body.message).toMatch(/companyId/);
  });

  it('rejects a body that is not JSON', async () => {
    const db = stubTxDb('OWNER');
    const res = await createHandler(db, crypto)({ ...event('POST', '/v1/uploads'), body: 'not json' });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).code).toBe('INVALID_JSON');
  });

  it('refuses to let a viewer decide an exception', async () => {
    const res = await call(stubTxDb('VIEWER'), 'POST', '/v1/uploads/b1/decisions', { body: { decision: 'TRUST_RULE', matchStates: ['AMOUNT_MISMATCH'] } });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('refuses to let staff apply an upload', async () => {
    const res = await call(stubTxDb('STAFF'), 'POST', '/v1/uploads/b1/apply', { body: {} });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('lets an accountant apply an upload', async () => {
    const db = stubTxDb('ACCOUNTANT');
    (db as unknown as { uploadBatch: { findFirst: () => Promise<null> } }).uploadBatch = { findFirst: async () => null };
    const res = await call(db, 'POST', '/v1/uploads/b1/apply', { body: {} });
    expect(res.status).toBe(404);
  });

  it('requires a decision scope so a bulk decision is never unbounded', async () => {
    const res = await call(stubTxDb('OWNER'), 'POST', '/v1/uploads/b1/decisions', { body: { decision: 'TRUST_RULE' } });
    expect(res.status).toBe(422);
    expect(res.body.message).toMatch(/rowNumbers|matchStates/);
  });

  it('rejects an unknown decision verb', async () => {
    const res = await call(stubTxDb('OWNER'), 'POST', '/v1/uploads/b1/decisions', { body: { decision: 'DELETE_EVERYTHING', matchStates: ['UNMATCHED'] } });
    expect(res.status).toBe(422);
    expect(res.body.message).toMatch(/Unknown decision/);
  });

  it('rejects an unknown match state filter', async () => {
    const res = await call(stubTxDb('OWNER'), 'GET', '/v1/uploads/b1', { query: { matchState: 'MAYBE' } });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('INPUT_INVALID');
  });

  it('rejects non-integer row numbers', async () => {
    const res = await call(stubTxDb('OWNER'), 'POST', '/v1/uploads/b1/decisions', { body: { decision: 'REJECT', rowNumbers: [1.5] } });
    expect(res.status).toBe(422);
  });
});

describe('public plan catalogue', () => {
  it('serves the catalogue without a session', async () => {
    const res = await call(stubDb([]), 'GET', '/v1/plans', { claims: {} });
    expect(res.status).toBe(200);
    const families = (res.body.families as { ACCOUNTANT: unknown[]; COMPANY: unknown[] });
    expect(families.ACCOUNTANT).toHaveLength(3);
    expect(families.COMPANY).toHaveLength(4);
  });

  it('never leaks tenant data in the public catalogue', async () => {
    const res = await call(stubDb([]), 'GET', '/v1/plans', { claims: {} });
    expect(JSON.stringify(res.body)).not.toMatch(/tenantId|companyId|nuit/i);
  });

  it('exposes nested, numeric limits so the client can render them', async () => {
    const res = await call(stubDb([]), 'GET', '/v1/plans', { claims: {} });
    const [free] = (res.body.families as { ACCOUNTANT: { code: string; family: string; limits: Record<string, unknown> }[] }).ACCOUNTANT;
    expect(free.code).toBe('ACCOUNTANT_FREE');
    expect(free.family).toBe('ACCOUNTANT');
    expect(free.limits.maxCompanies).toBe(3);
    expect(free.limits.features).toContain('FISCAL_CALENDAR');
    expect(Array.isArray(free.limits.simulatorAccess)).toBe(true);
  });

  it('serialises unlimited limits as a number rather than null', async () => {
    const res = await call(stubDb([]), 'GET', '/v1/plans', { claims: {} });
    const premium = (res.body.families as { ACCOUNTANT: { code: string; limits: Record<string, unknown> }[] }).ACCOUNTANT
      .find((p) => p.code === 'ACCOUNTANT_PREMIUM')!;
    const cap = premium.limits.maxCompanies;
    expect(cap).not.toBeNull();
    expect(typeof cap === 'number' && cap >= 999_999).toBe(true);
  });

  it('publishes ordered revenue bands', async () => {
    const res = await call(stubDb([]), 'GET', '/v1/plans', { claims: {} });
    const bands = res.body.revenueThresholds as { plan: string; minMzn: number; maxMzn: number | null }[];
    expect(bands.map((b) => b.plan)).toEqual(['COMPANY_MICRO', 'COMPANY_PEQUENA', 'COMPANY_MEDIA', 'COMPANY_GRANDE']);
    expect(bands.map((b) => [b.minMzn, b.maxMzn])).toEqual([
      [0, 2_500_000],
      [2_500_000, 25_000_000],
      [25_000_000, 100_000_000],
      [100_000_000, null],
    ]);
  });

  it('suggests a COMPANY tier from declared revenue without a session', async () => {
    const res = await call(stubDb([]), 'GET', '/v1/plans/suggest', { claims: {}, query: { annualRevenueMzn: '30000000' } });
    expect(res.status).toBe(200);
    expect((res.body.suggested as { code: string }).code).toBe('COMPANY_MEDIA');
    expect(res.body.annualRevenueMzn).toBe(30_000_000);
  });

  it('rejects a missing or negative revenue', async () => {
    const missing = await call(stubDb([]), 'GET', '/v1/plans/suggest', { claims: {} });
    expect(missing.status).toBe(422);
    const negative = await call(stubDb([]), 'GET', '/v1/plans/suggest', { claims: {}, query: { annualRevenueMzn: '-1' } });
    expect(negative.status).toBe(422);
  });

  it('does not make the tenant-scoped routes public', async () => {
    const res = await call(stubDb([]), 'GET', '/v1/subscription', { claims: {} });
    expect(res.status).toBe(401);
  });
});
