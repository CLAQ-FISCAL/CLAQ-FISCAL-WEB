import type { Audience } from '../types';

export const AUDIENCE_STORAGE_KEY = 'claq_audience';
export const INTENT_PLAN_STORAGE_KEY = 'claq_intent_plan';

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
