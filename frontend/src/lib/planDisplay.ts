const planNameKeys: Record<string, string> = {
  ACCOUNTANT_FREE: 'onboarding:planNames.starterPortfolio',
  ACCOUNTANT_PRO: 'onboarding:planNames.growingPortfolio',
  ACCOUNTANT_PREMIUM: 'onboarding:planNames.expandedPortfolio',
  COMPANY_MICRO: 'onboarding:planNames.microCompany',
  COMPANY_PEQUENA: 'onboarding:planNames.smallCompany',
  COMPANY_MEDIA: 'onboarding:planNames.mediumCompany',
  COMPANY_GRANDE: 'onboarding:planNames.largeCompany',
  DEMO: 'onboarding:planNames.demo'
};

export function getPlanDisplayName(
  planCode: string | null | undefined,
  fallback: string | null | undefined,
  translate: (key: string) => string
): string {
  const translationKey = planCode ? planNameKeys[planCode] : undefined;
  if (translationKey) return translate(translationKey);

  const legacyPlanNames: Record<string, string> = {
    PME: 'onboarding:planNames.sme',
    Contabilidade: 'onboarding:planNames.accounting',
    Enterprise: 'onboarding:planNames.enterprise',
    Básico: 'onboarding:planNames.basic'
  };
  const legacyKey = fallback ? legacyPlanNames[fallback] : undefined;
  return legacyKey ? translate(legacyKey) : fallback || translate('onboarding:planNames.default');
}
