import type { PlanFamily, PlanFeature, Subscription } from '../types';
import { useAppState } from '../context/AppStateContext';
import { readAudience } from '../lib/audience';
import { useSubscription } from './useFiscalQueries';

export interface AudienceContext {
  /** Authoritative family — from /v1/subscription when available, else stored intent. */
  family: PlanFamily | null;
  subscription: Subscription | null;
  isAccountant: boolean;
  isCompany: boolean;
  hasFeature: (feature: PlanFeature) => boolean;
}

/**
 * Resolves the effective audience/family for navigation & feature gating.
 * The authoritative source is the tenant's subscription; the pre-login audience
 * choice is only an optimistic fallback (e.g. when the API is unreachable).
 */
export function useAudience(): AudienceContext {
  const { isAuthenticated, activeTenantId, tenants } = useAppState();
  const audience = readAudience();
  const tenantResolved = tenants.length <= 1 || !!activeTenantId;
  const subscriptionQuery = useSubscription(isAuthenticated && tenantResolved, activeTenantId);
  const subscription = subscriptionQuery.data ?? null;

  const family: PlanFamily | null =
    subscription?.family ??
    (audience === 'empresa'
      ? 'COMPANY'
      : audience === 'contabilidade'
      ? 'ACCOUNTANT'
      : null);

  const hasFeature = (feature: PlanFeature): boolean => {
    const features = subscription?.limits.features;
    if (!features || features.length === 0) return true;
    return features.includes(feature);
  };

  return {
    family,
    subscription,
    isAccountant: family === 'ACCOUNTANT',
    isCompany: family === 'COMPANY',
    hasFeature
  };
}
