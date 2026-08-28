// Production Type-Safe API Client for CLAQ Fiscal Alert — Cognito + Gateway Ready
// Gateway: https://wajcsa99fc.execute-api.af-south-1.amazonaws.com/v1 (stage v1, NOT /api/v1)
// Local dev: http://localhost:4000/api/v1 (fallback /api/v1)
// Auth: Amplify Cognito SRP → Bearer IdToken on every request (Gateway Authorizer)
// Fallback: localStorage claq_cognito_idToken for sync fast path; fetchAuthSession for refresh

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

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
    // For 401, clear stale token so next login is clean — but don't logout here (AppStateContext decides)
    if (res.status === 401) {
      console.warn(`API ${endpoint} 401 — token may be expired. Will attempt refresh on next call.`);
    }
    throw new Error(`HTTP ${res.status}: ${message}`);
  }
  return (await res.json()) as T;
}

export class ApiClient {
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
}
