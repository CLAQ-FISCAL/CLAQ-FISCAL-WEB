import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ClaqLogo } from '../components/common/ClaqLogo';
import { LanguageToggle } from '../i18n/LanguageToggle';
import { usePlans, useSuggestPlan } from '../hooks/useFiscalQueries';
import { getPlanDisplayName } from '../lib/planDisplay';
import { saveAudience, saveIntentPlan } from '../lib/audience';
import type { Audience, PlanDto } from '../types';

interface PlanSelectProps {
  onSelect: (audience: Audience, planCode: string | null) => void;
  initialAudience?: Audience;
}

const UNLIMITED_THRESHOLD = 999999;

const humanizeFeature = (feature: string): string =>
  feature
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

const formatMzn = (value: number): string => `${new Intl.NumberFormat('pt-MZ').format(value)} MZN`;

/** Annual saving as a whole percentage, e.g. 15 for a 15% discount. */
const annualDiscountPercent = (monthly: number | null, annual: number | null): number | null => {
  if (!monthly || !annual) return null;
  const full = monthly * 12;
  if (full <= 0 || annual >= full) return null;
  return Math.round((1 - annual / full) * 100);
};

const PlanCard: React.FC<{
  plan: PlanDto;
  selected?: boolean;
  recommended?: boolean;
  onSelect?: () => void;
}> = ({ plan, selected, recommended, onSelect }) => {
  const { t } = useTranslation();
  const unlimited = plan.limits.maxCompanies >= UNLIMITED_THRESHOLD;
  const monthly = plan.priceMznMonthly ?? plan.priceMzn ?? null;
  const annual = plan.priceMznAnnual ?? null;
  const trialDays = plan.trialDays ?? 0;
  const customPricing = Boolean(plan.customPricing);
  const discountPercent = annualDiscountPercent(monthly, annual);
  const isFree = !monthly;
  const interactive = typeof onSelect === 'function';

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!interactive}
      style={{
        textAlign: 'left',
        width: '100%',
        cursor: interactive ? 'pointer' : 'default',
        borderRadius: '18px',
        padding: '22px 20px',
        backgroundColor: selected ? 'rgba(245, 158, 11, 0.10)' : '#FFFFFF',
        border: selected ? '2px solid #F59E0B' : '1px solid #E2E8F0',
        boxShadow: selected
          ? '0 12px 30px -12px rgba(245, 158, 11, 0.45)'
          : '0 10px 30px -18px rgba(15, 23, 42, 0.35)',
        transition: 'all 0.18s ease',
        fontFamily: 'var(--font-sans)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
          {getPlanDisplayName(plan.code, plan.label, key => t(key))}
        </span>
        {recommended && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.03em',
              color: '#78350F',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FCD34D',
              borderRadius: '999px',
              padding: '3px 9px'
            }}
          >
            <TrendingUp size={12} />
            {t('onboarding:suggestedPlan')}
          </span>
        )}
      </div>

      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '4px', flexWrap: 'wrap' }}>
        {customPricing && (
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{t('onboarding:startingFrom')}</span>
        )}
        <span style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
          {isFree ? t('onboarding:free') : formatMzn(monthly as number)}
        </span>
        {!isFree && <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{t('onboarding:perMonth')}</span>}
      </div>

      {trialDays > 0 && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '8px',
            fontSize: '11px',
            fontWeight: 800,
            color: '#047857',
            backgroundColor: '#D1FAE5',
            border: '1px solid #6EE7B7',
            borderRadius: '999px',
            padding: '3px 9px'
          }}
        >
          <Sparkles size={12} />
          {t('onboarding:trialDays', { days: trialDays })}
        </span>
      )}

      {annual !== null && (
        <div style={{ marginTop: '6px', fontSize: '12.5px', color: '#334155', fontWeight: 600 }}>
          {t('onboarding:annualPrice')}: <strong>{formatMzn(annual)}</strong>
          {discountPercent !== null && (
            <span style={{ color: '#047857', fontWeight: 800 }}> {t('onboarding:annualDiscount', { percent: discountPercent })}</span>
          )}
        </div>
      )}

      {customPricing && (
        <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#64748B' }}>{t('onboarding:customPricing')}</p>
      )}

      {plan.description && (
        <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#64748B', lineHeight: 1.5 }}>
          {plan.description}
        </p>
      )}

      <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '12.5px', color: '#334155', fontWeight: 600 }}>
          {t('onboarding:maxCompaniesLabel')}:{' '}
          <strong>{unlimited ? t('onboarding:noLimit') : plan.limits.maxCompanies}</strong>
        </div>
        <div style={{ fontSize: '12.5px', color: '#334155', fontWeight: 600 }}>
          {t('onboarding:maxUsersLabel')}:{' '}
          <strong>
            {plan.limits.maxUsers >= UNLIMITED_THRESHOLD
              ? t('onboarding:noLimit')
              : plan.limits.maxUsers}
          </strong>
        </div>
      </div>

      {plan.limits.features.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '14px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {plan.limits.features.map(feature => (
            <li key={feature} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12.5px', color: '#475569' }}>
              <Check size={14} color="#10B981" strokeWidth={3} />
              {humanizeFeature(feature)}
            </li>
          ))}
        </ul>
      )}

      {interactive && (
        <div
          style={{
            marginTop: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12.5px',
            fontWeight: 800,
            color: selected ? '#B45309' : '#0F172A'
          }}
        >
          {selected ? <Check size={14} strokeWidth={3} /> : null}
          {t('onboarding:selectPlan')}
        </div>
      )}
    </button>
  );
};

export const PlanSelect: React.FC<PlanSelectProps> = ({ onSelect, initialAudience }) => {
  const { t } = useTranslation();

  const [audience, setAudience] = useState<Audience | null>(initialAudience ?? null);
  const [revenueInput, setRevenueInput] = useState('');
  const [debouncedRevenue, setDebouncedRevenue] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const revenue = useMemo(() => {
    const digits = revenueInput.replace(/\D/g, '');
    return digits ? Number(digits) : null;
  }, [revenueInput]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedRevenue(revenue), 400);
    return () => clearTimeout(id);
  }, [revenue]);

  const plansQuery = usePlans();
  const suggestQuery = useSuggestPlan(audience === 'empresa' ? debouncedRevenue : null);

  const accountantPlans = plansQuery.data?.families.ACCOUNTANT ?? [];
  const companyPlans = plansQuery.data?.families.COMPANY ?? [];

  const handleRevenueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    setRevenueInput(digits ? new Intl.NumberFormat('pt-MZ').format(Number(digits)) : '');
  };

  const chooseAudience = (next: Audience) => {
    setAudience(next);
    setSelectedPlan(null);
  };

  const confirm = (planCode: string | null) => {
    if (!audience || !planCode) return;
    saveAudience(audience);
    saveIntentPlan(planCode);
    onSelect(audience, planCode);
  };

  const renderBack = () => (
    <button
      type="button"
      onClick={() => setAudience(null)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: 'none',
        border: 'none',
        color: '#CBD5E1',
        fontSize: '13px',
        fontWeight: 700,
        cursor: 'pointer',
        padding: 0,
        marginBottom: '20px'
      }}
    >
      <ArrowLeft size={15} />
      {t('onboarding:back')}
    </button>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#070E1E',
        fontFamily: 'var(--font-sans)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px 24px',
        overflow: 'hidden'
      }}
    >
      <div style={{ position: 'fixed', top: '20px', right: '24px', zIndex: 1000 }}>
        <LanguageToggle variant="dark" />
      </div>

      <div style={{ position: 'absolute', top: '40px', left: '40px', zIndex: 2 }}>
        <ClaqLogo variant="dark" size="md" />
      </div>

      <div style={{ width: '100%', maxWidth: audience === 'empresa' ? '520px' : '960px', zIndex: 2 }}>
        {!audience && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h1
                style={{
                  fontSize: '30px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  letterSpacing: '-0.5px',
                  margin: 0
                }}
              >
                {t('onboarding:pillarTitle')}
              </h1>
              <p style={{ fontSize: '14.5px', color: '#94A3B8', marginTop: '10px', fontWeight: 500 }}>
                {t('onboarding:pillarSubtitle')}
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '22px'
              }}
            >
              {(
                [
                  {
                    key: 'empresa' as Audience,
                    icon: <Building2 size={26} color="#F59E0B" strokeWidth={2.2} />,
                    title: t('onboarding:companyTitle'),
                    desc: t('onboarding:companyDesc'),
                    cta: t('onboarding:companyCta')
                  },
                  {
                    key: 'contabilidade' as Audience,
                    icon: <Briefcase size={26} color="#F59E0B" strokeWidth={2.2} />,
                    title: t('onboarding:accountantTitle'),
                    desc: t('onboarding:accountantDesc'),
                    cta: t('onboarding:accountantCta')
                  }
                ]
              ).map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => chooseAudience(item.key)}
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '20px',
                    padding: '28px 26px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    transition: 'all 0.18s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    fontFamily: 'var(--font-sans)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.6)';
                    e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.06)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                      {item.title}
                    </h2>
                    <p style={{ fontSize: '13.5px', color: '#94A3B8', marginTop: '8px', lineHeight: 1.55, margin: '8px 0 0' }}>
                      {item.desc}
                    </p>
                  </div>
                  <span
                    style={{
                      marginTop: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      fontSize: '13.5px',
                      fontWeight: 800,
                      color: '#F59E0B'
                    }}
                  >
                    {item.cta}
                    <ArrowRight size={16} />
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {audience === 'empresa' && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '36px 34px', boxShadow: '0 30px 70px -20px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {renderBack()}
            <h1 style={{ fontSize: '23px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.4px' }}>
              {t('onboarding:companyQualifyTitle')}
            </h1>
            <p style={{ fontSize: '13.5px', color: '#64748B', marginTop: '8px', fontWeight: 500 }}>
              {t('onboarding:companyQualifySubtitle')}
            </p>

            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', margin: '22px 0 6px' }}>
              {t('onboarding:annualRevenueLabel')}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={revenueInput}
              onChange={handleRevenueChange}
              placeholder={t('onboarding:annualRevenuePlaceholder')}
              style={{
                width: '100%',
                padding: '13px 14px',
                fontSize: '15px',
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: '12px',
                outline: 'none'
              }}
            />

            <div style={{ marginTop: '22px' }}>
              {suggestQuery.isFetching && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '13px' }}>
                  <Loader2 size={16} className="claq-spin" />
                  {t('onboarding:loadingPlans')}
                </div>
              )}

              {!suggestQuery.isFetching && suggestQuery.data?.suggested && (
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>
                    {t('onboarding:recommendedFor')}
                  </div>
                  <PlanCard
                    plan={suggestQuery.data.suggested}
                    recommended
                    selected={selectedPlan === suggestQuery.data.suggested.code}
                    onSelect={() => setSelectedPlan(suggestQuery.data!.suggested.code)}
                  />
                </div>
              )}

              {companyPlans.length > 0 && (
                <div style={{ marginTop: '18px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>
                    All company plans
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: '16px'
                    }}
                  >
                    {companyPlans.map((plan) => (
                      <PlanCard
                        key={plan.code}
                        plan={plan}
                        recommended={suggestQuery.data?.suggested?.code === plan.code}
                        selected={selectedPlan === plan.code}
                        onSelect={() => setSelectedPlan(plan.code)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {!suggestQuery.isFetching && suggestQuery.isError && (
                <div style={{ fontSize: '12.5px', color: '#94A3B8' }}>
                  {t('onboarding:plansUnavailable')}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => confirm(selectedPlan)}
              disabled={!selectedPlan}
              style={{
                marginTop: '26px',
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '14px',
                borderRadius: '13px',
                border: 'none',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                fontSize: '14.5px',
                fontWeight: 800,
                cursor: selectedPlan ? 'pointer' : 'not-allowed',
                opacity: selectedPlan ? 1 : 0.55,
                fontFamily: 'var(--font-sans)'
              }}
            >
              {t('onboarding:continueButton')}
              <ArrowRight size={17} />
            </button>
          </div>
        )}

        {audience === 'contabilidade' && (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '36px 34px', boxShadow: '0 30px 70px -20px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {renderBack()}
            <h1 style={{ fontSize: '23px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.4px' }}>
              {t('onboarding:accountantQualifyTitle')}
            </h1>
            <p style={{ fontSize: '13.5px', color: '#64748B', marginTop: '8px', fontWeight: 500 }}>
              {t('onboarding:accountantQualifySubtitle')}
            </p>

            <div style={{ marginTop: '24px' }}>
              {plansQuery.isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '13px' }}>
                  <Loader2 size={16} className="claq-spin" />
                  {t('onboarding:loadingPlans')}
                </div>
              )}

              {plansQuery.isError && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '13px', color: '#64748B' }}>{t('onboarding:plansUnavailable')}</span>
                  <button
                    type="button"
                    onClick={() => plansQuery.refetch()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 14px',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#0F172A',
                      cursor: 'pointer'
                    }}
                  >
                    <RefreshCw size={14} />
                    {t('onboarding:retry')}
                  </button>
                </div>
              )}

              {accountantPlans.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '16px'
                  }}
                >
                  {accountantPlans.map(plan => (
                    <PlanCard
                      key={plan.code}
                      plan={plan}
                      selected={selectedPlan === plan.code}
                      onSelect={() => setSelectedPlan(plan.code)}
                    />
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => confirm(selectedPlan)}
              disabled={!selectedPlan}
              style={{
                marginTop: '26px',
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '14px',
                borderRadius: '13px',
                border: 'none',
                backgroundColor: '#0F172A',
                color: '#FFFFFF',
                fontSize: '14.5px',
                fontWeight: 800,
                cursor: selectedPlan ? 'pointer' : 'not-allowed',
                opacity: selectedPlan ? 1 : 0.55,
                fontFamily: 'var(--font-sans)'
              }}
            >
              {t('onboarding:continueButton')}
              <ArrowRight size={17} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
