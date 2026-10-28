import type { Audience } from '../types';

export const AUDIENCE_STORAGE_KEY = 'claq_audience';
export const INTENT_PLAN_STORAGE_KEY = 'claq_intent_plan';
const PENDING_DEMO_PLAN_KEY = 'claq_pending_demo_plan';

export interface PendingDemoPlan {
  email: string;
  planCode: string;
  tenantName?: string;
}

export function readAudience(): Audience | null {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(AUDIENCE_STORAGE_KEY);
  return value === 'empresa' || value === 'contabilidade' ? value : null;
}

export function saveAudience(audience: Audience): void {
  localStorage.setItem(AUDIENCE_STORAGE_KEY, audience);
}

export function clearAudience(): void {
  localStorage.removeItem(AUDIENCE_STORAGE_KEY);
}

export function readIntentPlan(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(INTENT_PLAN_STORAGE_KEY);
}

export function saveIntentPlan(code: string | null): void {
  if (code) {
    localStorage.setItem(INTENT_PLAN_STORAGE_KEY, code);
  } else {
    localStorage.removeItem(INTENT_PLAN_STORAGE_KEY);
  }
}

/** Return a pending demo plan only when it belongs to the currently signed-in account. */
export function readPendingDemoPlanFor(email: string | null | undefined): PendingDemoPlan | null {
  if (!email) return null;
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const raw = localStorage.getItem(PENDING_DEMO_PLAN_KEY);
    const plan = raw ? JSON.parse(raw) as Partial<PendingDemoPlan> : null;
    const pendingUserRaw = localStorage.getItem('claq_pending_user');
    const pendingUser = pendingUserRaw ? JSON.parse(pendingUserRaw) as { email?: string } : null;
    const planEmail = (plan?.email || pendingUser?.email || '').trim().toLowerCase();
    if (plan?.planCode && planEmail === normalizedEmail) {
      const matchedPlan: PendingDemoPlan = {
        email: planEmail,
        planCode: plan.planCode,
        ...(typeof plan.tenantName === 'string' ? { tenantName: plan.tenantName } : {}),
      };
      // Migrate pending choices created before plans were associated with an email.
      if (!plan.email) localStorage.setItem(PENDING_DEMO_PLAN_KEY, JSON.stringify(matchedPlan));
      return matchedPlan;
    }
    // Older registrations kept only a global plan choice. Associate it only when
    // the saved profile already belongs to this email, never when switching users.
    if (plan?.email || planEmail) return null;
    const intentPlanCode = localStorage.getItem(INTENT_PLAN_STORAGE_KEY);
    if (!intentPlanCode?.startsWith('ACCOUNTANT_')) return null;
    const savedUserRaw = localStorage.getItem('claq_user');
    const savedUser = savedUserRaw ? JSON.parse(savedUserRaw) as { email?: string; companyName?: string; name?: string } : null;
    const intentOwner = (localStorage.getItem('claq_intent_plan_email') || savedUser?.email || '').trim().toLowerCase();
    if (intentOwner !== normalizedEmail) return null;
    localStorage.setItem('claq_intent_plan_email', normalizedEmail);
    const migrated: PendingDemoPlan = {
      email: normalizedEmail,
      planCode: intentPlanCode,
      ...(savedUser?.companyName || savedUser?.name ? { tenantName: savedUser.companyName || savedUser.name } : {}),
    };
    localStorage.setItem(PENDING_DEMO_PLAN_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return null;
  }
}
