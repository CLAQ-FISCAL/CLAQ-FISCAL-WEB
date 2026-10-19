import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { ApiClient } from '../api/client';
import {
  FiscalObligation,
  SimulationRecord,
  Client,
  AlertItem,
  PlanCatalog,
  Subscription,
  MeResponse,
  RuleDto,
  SimulatorCatalogItem,
  SimulatorRunResult,
} from '../types';
import { resolveCalcRules, type CalcRules } from '../lib/calculations/calcRules';

export const QUERY_KEYS = {
  OBLIGATIONS: ['obligations'],
  SIMULATIONS: ['simulations'],
  CLIENTS: ['clients'],
  ALERTS: ['alerts'],
  EXCHANGE_RATES: ['exchange_rates'],
  PLANS: ['plans'],
  SUBSCRIPTION: ['subscription'],
  ME: ['me'],
  RULES: ['rules'],
  SIMULATORS: ['simulators'],
  COMPANIES: ['companies'],
  UPLOADS: ['uploads']
};

export function useObligations() {
  return useQuery<FiscalObligation[]>({
    queryKey: QUERY_KEYS.OBLIGATIONS,
    queryFn: async () => {
      try {
        const res = await ApiClient.get<{ data: FiscalObligation[] }>('/obligations');
        return res.data;
      } catch {
        const saved = localStorage.getItem('claq_obligations');
        return saved ? JSON.parse(saved) : [];
      }
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
}

export function useSettleObligation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        return await ApiClient.patch(`/obligations/${id}/settle`);
      } catch {
        return { success: true };
      }
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData<FiscalObligation[]>(QUERY_KEYS.OBLIGATIONS, old =>
        old ? old.map(o => (o.id === id ? { ...o, status: 'pago' as const } : o)) : []
      );
    }
  });
}

export function useSimulations() {
  return useQuery<SimulationRecord[]>({
    queryKey: QUERY_KEYS.SIMULATIONS,
    queryFn: async () => {
      try {
        const res = await ApiClient.get<{ data: SimulationRecord[] }>('/simulations');
        return res.data;
      } catch {
        const saved = localStorage.getItem('claq_simulations');
        return saved ? JSON.parse(saved) : [];
      }
    }
  });
}

export function useClients() {
  return useQuery<Client[]>({
    queryKey: QUERY_KEYS.CLIENTS,
    queryFn: async () => {
      try {
        const res = await ApiClient.get<{ data: Client[] }>('/clients');
        return res.data;
      } catch {
        const saved = localStorage.getItem('claq_clients');
        return saved ? JSON.parse(saved) : [];
      }
    }
  });
}

export function useAlerts() {
  return useQuery<AlertItem[]>({
    queryKey: QUERY_KEYS.ALERTS,
    queryFn: async () => {
      try {
        const res = await ApiClient.get<{ data: AlertItem[] }>('/alerts');
        return res.data;
      } catch {
        const saved = localStorage.getItem('claq_alerts');
        return saved ? JSON.parse(saved) : [];
      }
    }
  });
}

// ─── Audience / Plans / Subscription (claq-backend contracts) ───────────────

/** Plan catalogue + revenue thresholds. Public endpoint — safe to call pre-login. */
export function usePlans() {
  return useQuery<PlanCatalog>({
    queryKey: QUERY_KEYS.PLANS,
    queryFn: () => ApiClient.getPlans(),
    staleTime: 1000 * 60 * 60,
    retry: 1
  });
}

/** Suggested COMPANY plan for a given annual revenue (qualifier step). */
export function useSuggestPlan(annualRevenueMzn: number | null) {
  return useQuery({
    queryKey: [...QUERY_KEYS.PLANS, 'suggest', annualRevenueMzn],
    queryFn: () => ApiClient.suggestPlan(annualRevenueMzn as number),
    enabled: typeof annualRevenueMzn === 'number' && annualRevenueMzn >= 0,
    staleTime: 1000 * 60 * 60,
    retry: 1
  });
}

/** Authoritative subscription for the authenticated tenant. */
export function useSubscription(enabled = true, tenantId?: string | null) {
  return useQuery<Subscription>({
    queryKey: [...QUERY_KEYS.SUBSCRIPTION, tenantId ?? 'auto'],
    queryFn: () => ApiClient.getSubscription(),
    enabled,
    staleTime: 1000 * 60 * 10,
    retry: 1
  });
}

/** Current user's identity + tenants (used to resolve X-Tenant-Id). */
export function useMe(enabled = true) {
  return useQuery<MeResponse>({
    queryKey: QUERY_KEYS.ME,
    queryFn: () => ApiClient.getMe(),
    enabled,
    staleTime: 1000 * 60 * 10,
    retry: 1
  });
}

/** Server-driven simulator catalogue (source of truth for titles/inputs). */
export function useSimulatorCatalog(enabled = true) {
  return useQuery<SimulatorCatalogItem[]>({
    queryKey: QUERY_KEYS.SIMULATORS,
    queryFn: async () => (await ApiClient.listSimulators()).items,
    enabled,
    staleTime: 1000 * 60 * 30,
    retry: 1
  });
}

/** Run a simulator on the server (authoritative calculation + persisting). */
export function useRunSimulator() {
  return useMutation<
    SimulatorRunResult,
    Error,
    { code: string; inputs: Record<string, number | string>; at?: string; companyId?: string }
  >({
    mutationFn: ({ code, inputs, at, companyId }) =>
      ApiClient.runSimulator(code, inputs, { at, companyId })
  });
}

/** Official Banco de Moçambique exchange rates (replaces hardcoded constants). */
export function useExchangeRates(base = 'USD', enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEYS.EXCHANGE_RATES, base],
    queryFn: () => ApiClient.getExchangeRates(base),
    enabled,
    staleTime: 1000 * 60 * 30,
    retry: 1
  });
}

/**
 * Fetch approved rule values for the given rule codes and resolve them into a
 * `CalcRules` object. Each code is fetched independently; when a code is
 * unavailable the corresponding default (offline fallback) is used, so
 * calculations keep working without the backend.
 */
export function useSimulatorRules(codes: string[], enabled = true): {
  rules: CalcRules;
  isLoading: boolean;
  isError: boolean;
} {
  const results = useQueries({
    queries: codes.map((code) => ({
      queryKey: [...QUERY_KEYS.RULES, code],
      queryFn: () => ApiClient.getRule(code),
      enabled,
      staleTime: 1000 * 60 * 60,
      retry: 1
    }))
  });

  const rulesByCode: Partial<Record<string, RuleDto>> = {};
  codes.forEach((code, index) => {
    const data = results[index]?.data as RuleDto | undefined;
    if (data) rulesByCode[code] = data;
  });

  return {
    rules: resolveCalcRules(rulesByCode),
    isLoading: results.some((r) => r.isLoading),
    isError: results.length > 0 && results.every((r) => r.isError)
  };
}
