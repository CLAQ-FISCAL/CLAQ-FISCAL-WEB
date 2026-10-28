// Production Type-Safe API Client for CLAQ Fiscal Alert — Cognito + Gateway Ready
// Gateway: https://wajcsa99fc.execute-api.af-south-1.amazonaws.com/v1 (stage v1, NOT /api/v1)
// Local dev: http://localhost:4000/api/v1 (fallback /api/v1)
// Auth: Amplify Cognito SRP → Bearer IdToken on every request (Gateway Authorizer)
// Fallback: localStorage claq_cognito_idToken for sync fast path; fetchAuthSession for refresh

import type {
  MeResponse,
  Subscription,
  PlanCatalog,
  PlanDto,
  RuleDto,
  SimulatorCatalogItem,
  SimulatorRunResult,
  BackendCompany,
  UploadBatchSummary,
  StagedBatchView,
  MatchStateName,
  RowDecisionName,
  DecideResult,
  ApplyResult,
} from '../types';

// Production fallback for Vercel and other static hosts. A relative `/v1`
// points back to the frontend host, where no API route exists. Local builds
// can still override this with VITE_API_URL (for example, http://localhost:4000/api/v1).
const PRODUCTION_API_URL = 'https://wajcsa99fc.execute-api.af-south-1.amazonaws.com/v1';
const API_BASE_URL = import.meta.env.PROD
  ? PRODUCTION_API_URL
  : import.meta.env.VITE_API_URL || '/v1';

// Helper to retrieve Cognito IdToken — tries Amplify session first, falls back to localStorage
async function getAuthToken(): Promise<string | null> {
  // Fast path: localStorage cache written by AppStateContext on login
  const cached = localStorage.getItem('claq_cognito_idToken');
  // Try Amplify session for auto-refresh (lazy import to avoid cycle)
  try {
    const { fetchAuthSession } = await import('aws-amplify/auth');
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString() || session.tokens?.accessToken?.toString();
    if (idToken) {
      // Keep cache in sync
      if (idToken !== cached) localStorage.setItem('claq_cognito_idToken', idToken);
      return idToken;
    }
  } catch {
    // Amplify not configured or no session — use cache or legacy token
  }
  // Legacy fallback: old backend JWT stored as claq_token
  const legacy = localStorage.getItem('claq_token');
  return cached || legacy || null;
}

async function getHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = await getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Active tenant (required by the Gateway when a user belongs to more than one tenant)
  const tenantId = localStorage.getItem('claq_active_tenant');
  if (tenantId) {
    headers['X-Tenant-Id'] = tenantId;
  }
  return headers;
}

async function handleResponse<T>(res: Response, endpoint: string): Promise<T> {
  if (!res.ok) {
    // Try to parse error body for better message
    let body: any = null;
    try {
      body = await res.json();
    } catch {
      // ignore
    }
    const message = body?.error || body?.message || res.statusText;
    const code = typeof body?.code === 'string' ? body.code : '';
    // For 401, clear stale token so next login is clean — but don't logout here (AppStateContext decides)
    if (res.status === 401) {
      console.warn(`API ${endpoint} 401 — token may be expired. Will attempt refresh on next call.`);
    }
    throw new Error(`HTTP ${res.status}:${code ? ` ${code}:` : ''} ${message}`);
  }
  return (await res.json()) as T;
}

export class ApiClient {
  private static async getPublic<T>(endpoint: string): Promise<T> {
    // Public catalog endpoints are needed before sign-in. Keep this a simple
    // cross-origin GET so browsers do not send an authenticated CORS preflight.
    const res = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'GET' });
    return await handleResponse<T>(res, endpoint);
  }

  public static async get<T>(endpoint: string): Promise<T> {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers,
        // Gateway strips cookies — use header auth only. Keep omit to avoid CORS preflight issues with credentials.
        // Local dev with cookie fallback can still work via header.
      });
      return await handleResponse<T>(res, endpoint);
    } catch (e) {
      // Only warn for network/offline — don't spam on 401 (expected when not logged in)
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes('401')) {
        console.warn(`API GET ${endpoint} offline, falling back to local state:`, e);
      }
      throw e;
    }
  }

  public static async post<T>(endpoint: string, body: any): Promise<T> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return await handleResponse<T>(res, endpoint);
  }

  public static async patch<T>(endpoint: string, body?: any): Promise<T> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return await handleResponse<T>(res, endpoint);
  }

  public static async put<T>(endpoint: string, body?: any): Promise<T> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return await handleResponse<T>(res, endpoint);
  }

  public static async delete<T>(endpoint: string): Promise<T> {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    return await handleResponse<T>(res, endpoint);
  }

  // ─── Typed convenience wrappers (audience / plans / simulators) ───────────

  public static getMe(): Promise<MeResponse> {
    return this.get<MeResponse>('/me');
  }

  public static getSubscription(): Promise<Subscription> {
    return this.get<Subscription>('/subscription');
  }

  public static getPlans(): Promise<PlanCatalog> {
    return this.getPublic<PlanCatalog>('/plans');
  }

  public static activateDemoPlan(input: { planCode: string; tenantName?: string }): Promise<{ tenantId: string; tenantName: string; plan: string; demo: true }> {
    return this.post('/demo/subscribe', input);
  }

  public static suggestPlan(annualRevenueMzn: number): Promise<{ annualRevenueMzn: number; suggested: PlanDto }> {
    return this.getPublic<{ annualRevenueMzn: number; suggested: PlanDto }>(
      `/plans/suggest?annualRevenueMzn=${encodeURIComponent(annualRevenueMzn)}`
    );
  }

  public static listSimulators(): Promise<{ items: SimulatorCatalogItem[] }> {
    return this.get<{ items: SimulatorCatalogItem[] }>('/simulators');
  }

  public static runSimulator(
    code: string,
    inputs: Record<string, number | string>,
    options?: { at?: string; companyId?: string }
  ): Promise<SimulatorRunResult> {
    return this.post<SimulatorRunResult>(`/simulators/${encodeURIComponent(code)}`, {
      inputs,
      ...(options?.at ? { at: options.at } : {}),
      ...(options?.companyId ? { companyId: options.companyId } : {}),
    });
  }

  public static getExchangeRates(base = 'USD'): Promise<{ base: string; rates: { target: string; rate: string; source: string; fetchedAt: string }[] }> {
    return this.get(`/exchange-rates?base=${encodeURIComponent(base)}`);
  }

  public static getRule(code: string): Promise<RuleDto> {
    return this.get<RuleDto>(`/rules/${encodeURIComponent(code)}`);
  }

  // ─── Companies ────────────────────────────────────────────────────────────

  public static listCompanies(): Promise<{ items: BackendCompany[] }> {
    return this.get<{ items: BackendCompany[] }>('/companies');
  }

  public static createCompany(input: { legalName: string; nuit?: string; municipality?: string; taxRegime?: string }): Promise<BackendCompany> {
    return this.post<BackendCompany>('/companies', input);
  }

  // ─── Data uploads (staging + reconciliation) ──────────────────────────────

  public static listUploads(): Promise<{ items: UploadBatchSummary[] }> {
    return this.get<{ items: UploadBatchSummary[] }>('/uploads');
  }

  public static stageUpload(input: { companyId: string; fileName: string; content: string }): Promise<StagedBatchView> {
    return this.post<StagedBatchView>('/uploads', input);
  }

  public static getUploadBatch(
    id: string,
    filters?: { matchState?: MatchStateName[]; decision?: RowDecisionName[] }
  ): Promise<StagedBatchView> {
    const params = new URLSearchParams();
    if (filters?.matchState?.length) params.set('matchState', filters.matchState.join(','));
    if (filters?.decision?.length) params.set('decision', filters.decision.join(','));
    const qs = params.toString();
    return this.get<StagedBatchView>(`/uploads/${encodeURIComponent(id)}${qs ? `?${qs}` : ''}`);
  }

  public static decideUploadRows(
    id: string,
    body: { decision: RowDecisionName; rowNumbers?: number[]; matchStates?: MatchStateName[] }
  ): Promise<DecideResult> {
    return this.post<DecideResult>(`/uploads/${encodeURIComponent(id)}/decisions`, body);
  }

  public static applyUpload(id: string): Promise<ApplyResult> {
    return this.post<ApplyResult>(`/uploads/${encodeURIComponent(id)}/apply`, {});
  }
}
