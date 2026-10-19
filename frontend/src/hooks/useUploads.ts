import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiClient } from '../api/client';
import { QUERY_KEYS } from './useFiscalQueries';
import type {
  ApplyResult,
  BackendCompany,
  DecideResult,
  MatchStateName,
  RowDecisionName,
  StagedBatchView,
  UploadBatchSummary
} from '../types';

/** Companies belonging to the active tenant (source of the upload companyId). */
export function useCompanies(enabled = true) {
  return useQuery<BackendCompany[]>({
    queryKey: QUERY_KEYS.COMPANIES,
    queryFn: async () => (await ApiClient.listCompanies()).items,
    enabled,
    staleTime: 1000 * 60 * 5,
    retry: 1
  });
}

/** Recent upload batches for the tenant (newest first). */
export function useUploads(enabled = true) {
  return useQuery<UploadBatchSummary[]>({
    queryKey: QUERY_KEYS.UPLOADS,
    queryFn: async () => (await ApiClient.listUploads()).items,
    enabled,
    staleTime: 1000 * 30,
    retry: 1
  });
}

/** One batch view, optionally narrowed to a slice of rows. */
export function useUploadBatch(
  id: string | null,
  filters?: { matchState?: MatchStateName[]; decision?: RowDecisionName[] },
  enabled = true
) {
  return useQuery<StagedBatchView>({
    queryKey: [...QUERY_KEYS.UPLOADS, id, filters ?? {}],
    queryFn: () => ApiClient.getUploadBatch(id as string, filters),
    enabled: enabled && !!id,
    retry: 1
  });
}

/** Stage a CSV: land it in staging and reconcile it against approved templates. */
export function useStageUpload() {
  const queryClient = useQueryClient();
  return useMutation<StagedBatchView, Error, { companyId: string; fileName: string; content: string }>({
    mutationFn: (input) => ApiClient.stageUpload(input),
    onSuccess: (batch) => {
      queryClient.setQueryData([...QUERY_KEYS.UPLOADS, batch.id, {}], batch);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.UPLOADS });
    }
  });
}

/** Record a human verdict on staging rows (single row or a whole match-state slice). */
export function useDecideUploadRows(uploadId: string | null) {
  const queryClient = useQueryClient();
  return useMutation<
    DecideResult,
    Error,
    { decision: RowDecisionName; rowNumbers?: number[]; matchStates?: MatchStateName[] }
  >({
    mutationFn: (body) => ApiClient.decideUploadRows(uploadId as string, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.UPLOADS });
    }
  });
}

/** Apply decided rows to obligations / templates. */
export function useApplyUpload(uploadId: string | null) {
  const queryClient = useQueryClient();
  return useMutation<ApplyResult, Error, void>({
    mutationFn: () => ApiClient.applyUpload(uploadId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.UPLOADS });
    }
  });
}
