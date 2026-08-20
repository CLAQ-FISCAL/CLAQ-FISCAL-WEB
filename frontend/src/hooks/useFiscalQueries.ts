import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../api/client';
import { FiscalObligation, SimulationRecord, Client, AlertItem } from '../types';
import { INITIAL_OBLIGATIONS, INITIAL_SIMULATIONS, INITIAL_CLIENTS, INITIAL_ALERTS } from '../data/initialData';

export const QUERY_KEYS = {
  OBLIGATIONS: ['obligations'],
  SIMULATIONS: ['simulations'],
  CLIENTS: ['clients'],
  ALERTS: ['alerts'],
  EXCHANGE_RATES: ['exchange_rates']
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
        return saved ? JSON.parse(saved) : INITIAL_OBLIGATIONS;
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
        return saved ? JSON.parse(saved) : INITIAL_SIMULATIONS;
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
        return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
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
        return saved ? JSON.parse(saved) : INITIAL_ALERTS;
      }
    }
  });
}
