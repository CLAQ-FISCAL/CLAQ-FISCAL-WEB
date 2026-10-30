import React, { useMemo, useRef, useState } from 'react';
import {
  Bell,
  Building,
  Camera,
  Check,
  CheckCircle2,
  CreditCard,
  Database,
  Lock,
  Mail,
  MessageSquare,
  Shield,
  Sliders,
  Smartphone,
  User,
  Users,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../context/AppStateContext';
import { useAudience } from '../hooks/useAudience';
import { usePaymentHistory, usePlans } from '../hooks/useFiscalQueries';
import { getPlanDisplayName } from '../lib/planDisplay';
import { readIntentPlan } from '../lib/audience';
import './Configuracoes.css';

type SettingsTab = 'profile' | 'preferences' | 'alerts' | 'security' | 'plan' | 'integrations';

interface ConfiguracoesProps {
  onNavigate: (path: string) => void;
  initialTab?: SettingsTab;
}

const isUnlimited = (limit: number | null): boolean => limit !== null && limit >= 999999;

export const Configuracoes: React.FC<ConfiguracoesProps> = ({ onNavigate, initialTab = 'preferences' }) => {
  const { t, i18n } = useTranslation();
  const { subscription, isAccountant } = useAudience();
  const plansQuery = usePlans();
  const { activeTenantId } = useAppState();
  const paymentsQuery = usePaymentHistory(Boolean(subscription), activeTenantId);
  const {
    user,
    updateUser,
    settings,
    toggleNotificationChannel,
    toggleAlertTiming,
    addToast
  } = useAppState();

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const displayedPlanCode = subscription?.plan ?? readIntentPlan();

  const photoInputRef = useRef<HTMLInputElement>(null);

  // Profile fields state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [role, setRole] = useState(user?.role || t('config:defaultRole'));
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [companyNuit, setCompanyNuit] = useState(user?.companyNuit || '');
  const [companyAddress] = useState(user?.companyAddress || '');

  const currentPlanName = getPlanDisplayName(
    displayedPlanCode,
    subscription?.label || user?.plan,
    key => t(key)
  );
  const currentPlan = [...(plansQuery.data?.families.ACCOUNTANT ?? []), ...(plansQuery.data?.families.COMPANY ?? [])]
    .find(plan => plan.code === displayedPlanCode);
  const latestPayment = paymentsQuery.data?.items?.[0];
  const paymentMethodKey: Record<string, string> = {
    MPESA: 'M-Pesa',
    EMOLA: 'e-Mola',
    SIMO: t('config:paymentSimo'),
    BANK_TRANSFER: t('config:paymentBankTransfer')
  };
  const formattedDueDate = subscription?.billingPeriodEnd
    ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(subscription.billingPeriodEnd))
    : t('payment:noDueDate');
  const billingFrequencyLabel = subscription?.billingInterval === 'year'
    ? t('payment:annual')
    : subscription?.billingInterval === 'month'
      ? t('payment:monthly')
      : null;
  const planRenewalLabel = subscription?.billingPeriodEnd
    ? billingFrequencyLabel
      ? t('config:planNextRenewal', { date: formattedDueDate, interval: billingFrequencyLabel })
      : t('config:planValidUntil', { date: formattedDueDate })
    : t('payment:noDueDate');
  const planFeatures = subscription?.limits.features ?? currentPlan?.limits.features ?? [];
  const companiesUsed = subscription?.usage.companies ?? 0;
  const companiesLimit = subscription?.limits.maxCompanies ?? currentPlan?.limits.maxCompanies ?? null;
  const usersUsed = subscription?.usage.users ?? 0;
  const usersLimit = subscription?.limits.maxUsers ?? currentPlan?.limits.maxUsers ?? null;
  const humanizeFeature = (feature: string) => feature.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  const formatLimit = (limit: number | null): string => {
    if (limit === null) return t('common:notAvailable');
    if (isUnlimited(limit)) return t('onboarding:noLimit');
    return new Intl.NumberFormat(i18n.language).format(limit);
  };
  const usagePercent = (used: number, limit: number | null): number | null => {
    if (limit === null || limit <= 0 || isUnlimited(limit)) return null;
    return Math.min(100, Math.round((used / limit) * 100));
  };
  const companiesPercent = usagePercent(companiesUsed, companiesLimit);
  const usersPercent = usagePercent(usersUsed, usersLimit);
  const avatarInitials = useMemo(() => {
    const source = (name || user?.name || 'CLAQ').trim();
    if (!source) return 'C';
    const parts = source.split(/\s+/).filter(Boolean);
    const initials = parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0])
      : parts[0][0];
    return (initials || 'C').toUpperCase();
  }, [name, user?.name]);

  const settingsTabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: t('config:tabProfile'), icon: User },
    { id: 'preferences', label: t('config:tabPreferences'), icon: Sliders },
    { id: 'alerts', label: t('config:tabAlerts'), icon: Bell },
    { id: 'security', label: t('config:tabSecurity'), icon: Shield },
    { id: 'plan', label: t('config:tabPlan'), icon: CreditCard },
    { id: 'integrations', label: t('config:tabIntegrations'), icon: Database }
  ];

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;

    if (event.key === 'ArrowRight') nextIndex = (index + 1) % settingsTabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + settingsTabs.length) % settingsTabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = settingsTabs.length - 1;
    else return;

    event.preventDefault();
    const nextTab = settingsTabs[nextIndex];
    setActiveTab(nextTab.id);
    onNavigate(`/configuracoes/${nextTab.id}`);
    document.getElementById(`settings-tab-${nextTab.id}`)?.focus();
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedExtensions = /\.(jpe?g|png|webp)$/i;
    if (!allowedTypes.includes(file.type) && !(file.type === '' && allowedExtensions.test(file.name))) {
      addToast('error', t('config:toastPhotoTitle'), t('config:photoInvalidType'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      addToast('error', t('config:toastPhotoTitle'), t('config:photoTooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        addToast('error', t('config:toastPhotoTitle'), t('config:photoReadError'));
        return;
      }
      try {
        updateUser({ avatarUrl: reader.result });
      } catch {
        addToast('error', t('config:toastPhotoTitle'), t('config:photoSaveError'));
      }
    };
    reader.onerror = () => addToast('error', t('config:toastPhotoTitle'), t('config:photoReadError'));
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    if (photoInputRef.current) photoInputRef.current.value = '';
    try {
      updateUser({ avatarUrl: '' });
      addToast('success', t('config:toastPhotoRemovedTitle'), t('config:toastPhotoRemovedMessage'));
    } catch {
      addToast('error', t('config:toastPhotoTitle'), t('config:photoSaveError'));
    }
  };

  const preferenceChannels: {
    key: keyof typeof settings.notifications;
    title: string;
    description: string;
    icon: React.ElementType;
    tone: string;
  }[] = [
    {
      key: 'email',
      title: t('config:channelEmail'),
      description: t('config:channelEmailDesc', { email: user?.email || t('config:notConfigured') }),
      icon: Mail,
      tone: 'blue'
    },
    {
      key: 'whatsapp',
      title: t('config:channelWhatsApp'),
      description: t('config:channelWhatsAppDesc'),
      icon: MessageSquare,
      tone: 'green'
    },
    {
      key: 'inApp',
      title: t('config:channelInApp'),
      description: t('config:channelInAppDesc'),
      icon: Bell,
      tone: 'purple'
    },
    {
      key: 'sms',
      title: t('config:channelSms'),
      description: t('config:channelSmsDesc'),
      icon: Smartphone,
      tone: 'slate'
    }
  ];

  const alertChannels: {
    key: keyof typeof settings.notifications;
    title: string;
    detail: string;
    configured: boolean;
    icon: React.ElementType;
    tone: string;
  }[] = [
    {
      key: 'email',
      title: t('config:channelEmail'),
      detail: user?.email || t('config:notConfigured'),
      configured: Boolean(user?.email),
      icon: Mail,
      tone: 'blue'
    },
    {
      key: 'whatsapp',
      title: t('config:channelWhatsApp'),
      detail: settings.isWhatsAppConnected && settings.whatsappNumber
        ? settings.whatsappNumber
        : t('config:notConfigured'),
      configured: Boolean(settings.isWhatsAppConnected && settings.whatsappNumber),
      icon: MessageSquare,
      tone: 'green'
    },
    {
      key: 'inApp',
      title: t('config:channelInApp'),
      detail: t('config:channelInAppDesc'),
      configured: true,
      icon: Bell,
      tone: 'purple'
    },
    {
      key: 'sms',
      title: t('config:channelSms'),
      detail: user?.phone || t('config:notConfigured'),
      configured: Boolean(user?.phone),
      icon: Smartphone,
      tone: 'slate'
    }
  ];

  const alertTimings: { key: keyof typeof settings.alertTiming; label: string }[] = [
    { key: 'd7', label: t('config:timing7') },
    { key: 'd3', label: t('config:timing3') },
    { key: 'd1', label: t('config:timing1') },
    { key: 'd0', label: t('config:timing0') }
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name,
      email,
      phone,
      role,
      companyName,
      companyNuit,
      companyAddress
    });
  };

  const handleSavePreferences = () => {
    addToast('success', t('config:toastPrefTitle'), t('config:toastPrefMessage'));
  };

  return (
    <div className="settings-page">
      <header className="settings-page-header">
        <h1 className="settings-page-title">{t('config:title')}</h1>
        <p className="settings-page-subtitle">{t('config:subtitle')}</p>
      </header>

      <div className="settings-tabs" role="tablist" aria-label={t('config:tabsLabel')}>
        {settingsTabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`settings-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`settings-panel-${tab.id}`}
              className={`settings-tab${isActive ? ' is-active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                onNavigate(`/configuracoes/${tab.id}`);
              }}
              onKeyDown={event => handleTabKeyDown(event, index)}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'preferences' && (
        <section
          className="card settings-card"
          role="tabpanel"
          id="settings-panel-preferences"
          aria-labelledby="settings-tab-preferences"
        >
          <div className="settings-section-head">
            <div className="settings-section-head-main">
              <span className="settings-icon-tile is-blue" aria-hidden="true"><Sliders size={18} /></span>
              <div>
                <h2 className="settings-section-title">{t('config:tabPreferences')}</h2>
                <p className="settings-section-desc">{t('config:preferencesSectionDesc')}</p>
              </div>
            </div>
          </div>

          <div className="settings-grid-2">
            <div>
              <h3 className="settings-subsection-title">{t('config:notificationsTitle')}</h3>
              <p className="settings-subsection-desc">{t('config:notificationsSubtitle')}</p>

              <div className="settings-channel-list">
                {preferenceChannels.map(channel => {
                  const Icon = channel.icon;

                  return (
                    <label key={channel.key} className="settings-channel">
                      <span className="settings-channel-main">
                        <span className={`settings-icon-tile is-${channel.tone}`} aria-hidden="true"><Icon size={18} /></span>
                        <span>
                          <span className="settings-channel-title">{channel.title}</span>
                          <span className="settings-channel-desc">{channel.description}</span>
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        className={`settings-checkbox is-${channel.tone}`}
                        checked={settings.notifications[channel.key]}
                        onChange={() => toggleNotificationChannel(channel.key)}
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="settings-subsection-title">{t('config:timingTitle')}</h3>
              <p className="settings-subsection-desc">{t('config:timingSubtitle')}</p>

              <div className="settings-timing-panel">
                {alertTimings.map(timing => (
                  <label key={timing.key} className="settings-timing-option">
                    <input
                      type="checkbox"
                      className="settings-checkbox"
                      checked={settings.alertTiming[timing.key]}
                      onChange={() => toggleAlertTiming(timing.key)}
                    />
                    <span>{timing.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="settings-form-actions settings-form-actions--between">
            <span className="settings-save-note">{t('config:preferencesAutoSave')}</span>
            <button type="button" onClick={handleSavePreferences} className="btn btn-primary-gold btn-lg">
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>{t('config:savePreferences')}</span>
            </button>
          </div>
        </section>
      )}

      {activeTab === 'profile' && (
        <section
          className="card settings-card"
          role="tabpanel"
          id="settings-panel-profile"
          aria-labelledby="settings-tab-profile"
        >
          <div className="settings-section-head">
            <div className="settings-section-head-main">
              <span className="settings-icon-tile is-blue" aria-hidden="true"><User size={18} /></span>
              <div>
                <h2 className="settings-section-title">{t('config:profileTitle')}</h2>
                <p className="settings-section-desc">{t('config:profileSectionDesc')}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="settings-form">
            <div className="settings-avatar-row">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={name} className="settings-avatar" />
              ) : (
                <div className="settings-avatar settings-avatar-fallback" role="img" aria-label={name || t('config:profileTitle')}>
                  {avatarInitials}
                </div>
              )}
              <div className="settings-avatar-meta">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                  aria-label={t('config:changePhoto')}
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="btn btn-secondary btn-sm"
                >
                  <Camera size={15} aria-hidden="true" />
                  <span>{t('config:changePhoto')}</span>
                </button>
                {user?.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="btn btn-secondary btn-sm"
                    aria-label={t('config:removePhoto')}
                  >
                    <X size={15} aria-hidden="true" />
                    <span>{t('config:removePhoto')}</span>
                  </button>
                )}
                <p className="settings-avatar-note">{t('config:photoFormats')}</p>
              </div>
            </div>

            <div className="settings-form-grid">
              <div className="form-group settings-field">
                <label className="form-label" htmlFor="settings-name">
                  {t('config:labelFullName')} <span className="settings-required" aria-hidden="true">*</span>
                </label>
                <input
                  id="settings-name"
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="form-group settings-field">
                <label className="form-label" htmlFor="settings-email">
                  {t('config:labelEmail')} <span className="settings-required" aria-hidden="true">*</span>
                </label>
                <input
                  id="settings-email"
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group settings-field">
                <label className="form-label" htmlFor="settings-phone">{t('config:labelPhone')}</label>
                <input
                  id="settings-phone"
                  type="tel"
                  className="form-control"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  autoComplete="tel"
                  required
                />
              </div>

              <div className="form-group settings-field">
                <label className="form-label" htmlFor="settings-role">{t('config:labelRole')}</label>
                <input
                  id="settings-role"
                  type="text"
                  className="form-control"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  required
                />
              </div>

              <div className="form-group settings-field">
                <label className="form-label" htmlFor="settings-company">
                  {t('config:labelCompanyName')} <span className="settings-required" aria-hidden="true">*</span>
                </label>
                <input
                  id="settings-company"
                  type="text"
                  className="form-control"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  autoComplete="organization"
                  required
                />
              </div>

              <div className="form-group settings-field">
                <label className="form-label" htmlFor="settings-nuit">
                  {t('config:labelCompanyNuit')} <span className="settings-required" aria-hidden="true">*</span>
                </label>
                <input
                  id="settings-nuit"
                  type="text"
                  className="form-control settings-input-mono"
                  value={companyNuit}
                  onChange={e => setCompanyNuit(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="settings-form-actions">
              <button type="submit" className="btn btn-primary-gold btn-lg">
                <Check size={18} aria-hidden="true" />
                <span>{t('config:saveChanges')}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {activeTab === 'alerts' && (
        <section
          className="card settings-card"
          role="tabpanel"
          id="settings-panel-alerts"
          aria-labelledby="settings-tab-alerts"
        >
          <div className="settings-section-head">
            <div className="settings-section-head-main">
              <span className="settings-icon-tile is-amber" aria-hidden="true"><Bell size={18} /></span>
              <div>
                <h2 className="settings-section-title">{t('config:alertsTitle')}</h2>
                <p className="settings-section-desc">{t('config:alertsSubtitle')}</p>
              </div>
            </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                setActiveTab('preferences');
                onNavigate('/configuracoes/preferences');
              }}>
              <Sliders size={15} aria-hidden="true" />
              <span>{t('config:managePreferences')}</span>
            </button>
          </div>

          <div className="settings-callout">
            <Bell size={17} aria-hidden="true" />
            <div>
              <strong>{t('config:alertsReadOnlyTitle')}</strong>
              <p>{t('config:alertsReadOnlyDesc')}</p>
            </div>
          </div>

          <div className="settings-alert-grid">
            {alertChannels.map(channel => {
              const Icon = channel.icon;
              const enabled = settings.notifications[channel.key];
              const isAvailable = enabled && channel.configured;
              const statusLabel = !enabled
                ? t('config:channelDisabled')
                : channel.configured
                  ? t('config:channelEnabled')
                  : t('config:notConfigured');

              return (
                <article key={channel.key} className={`settings-alert-card${isAvailable ? ' is-on' : ' is-off'}`}>
                  <div className="settings-alert-card-main">
                    <span className={`settings-icon-tile is-${channel.tone}`} aria-hidden="true"><Icon size={18} /></span>
                    <div>
                      <h3 className="settings-alert-card-title">{channel.title}</h3>
                      <p className="settings-alert-card-desc">{channel.detail}</p>
                    </div>
                  </div>
                  <span className={`settings-state-pill${isAvailable ? ' is-on' : ' is-off'}`}>
                    {isAvailable ? <CheckCircle2 size={13} aria-hidden="true" /> : <X size={13} aria-hidden="true" />}
                    {statusLabel}
                  </span>
                </article>
              );
            })}
          </div>

          <div className="settings-timing-summary">
            <div>
              <h3 className="settings-subsection-title">{t('config:timingTitle')}</h3>
              <p className="settings-subsection-desc">{t('config:timingSubtitle')}</p>
            </div>
            <div className="settings-timing-chips">
              {alertTimings.map(timing => (
                <span
                  key={timing.key}
                  className={`settings-timing-chip${settings.alertTiming[timing.key] ? ' is-on' : ' is-off'}`}
                >
                  {settings.alertTiming[timing.key] ? <Check size={13} aria-hidden="true" /> : <X size={13} aria-hidden="true" />}
                  {timing.label}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'security' && (
        <section
          className="card settings-card"
          role="tabpanel"
          id="settings-panel-security"
          aria-labelledby="settings-tab-security"
        >
          <div className="settings-section-head">
            <div className="settings-section-head-main">
              <span className="settings-icon-tile is-slate" aria-hidden="true"><Lock size={18} /></span>
              <div>
                <h2 className="settings-section-title">{t('config:securityTitle')}</h2>
                <p className="settings-section-desc">{t('config:securitySubtitle')}</p>
              </div>
            </div>
          </div>

          <div className="settings-unavailable">
            <span className="settings-unavailable-icon" aria-hidden="true"><Lock size={22} /></span>
            <div>
              <h3>{t('config:securityUnavailableTitle')}</h3>
              <p>{t('config:securityUnavailableDesc')}</p>
            </div>
            <span className="settings-state-pill is-off">{t('config:securityStatus')}</span>
          </div>

          <div className="settings-security-meta">
            <div className="settings-security-item">
              <span className="settings-security-label">{t('config:securityAccountEmail')}</span>
              <strong className="settings-security-value">{user?.email || t('common:notAvailable')}</strong>
            </div>
            <div className="settings-security-item">
              <span className="settings-security-label">{t('config:securityAccountRole')}</span>
              <strong className="settings-security-value">{user?.role || t('common:notAvailable')}</strong>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'plan' && (
        <section
          className="card settings-card"
          role="tabpanel"
          id="settings-panel-plan"
          aria-labelledby="settings-tab-plan"
        >
          <div className="settings-section-head">
            <div className="settings-section-head-main">
              <span className="settings-icon-tile is-amber" aria-hidden="true"><CreditCard size={18} /></span>
              <div>
                <h2 className="settings-section-title">{t('config:planTitle')}</h2>
                <p className="settings-section-desc">{t('config:planSectionDesc')}</p>
              </div>
            </div>
          </div>

          <div className="settings-plan-hero">
            <div className="settings-plan-info">
              <span className="badge badge-amber">{t('config:planBadge')}</span>
              <h3 className="settings-plan-name">{currentPlanName}</h3>
              <p className="settings-plan-renewal">{planRenewalLabel}</p>
              {billingFrequencyLabel && (
                <p className="settings-plan-billing">
                  <CreditCard size={14} aria-hidden="true" />
                  {t('payment:billingFrequency')}: {billingFrequencyLabel}
                </p>
              )}
            </div>

            <div className="settings-plan-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowPlanDetails(true)}>
                {t('config:viewMyPlan')}
              </button>
              <button type="button" className="btn btn-primary-gold" onClick={() => {
                localStorage.setItem('claq_payment_flow', 'upgrade');
                onNavigate(isAccountant ? '/comecar/upgrade' : '/comecar/upgrade-company');
              }}>
                {t('config:planUpgrade')}
              </button>
            </div>
          </div>

          <div className="settings-plan-metrics">
            <article className="settings-metric">
              <div className="settings-metric-head">
                <span className="settings-metric-label">{t('config:metricCompanies')}</span>
                <span className="settings-metric-icon is-blue" aria-hidden="true"><Building size={15} /></span>
              </div>
              <strong className="settings-metric-value">
                {companiesLimit === null
                  ? t('common:notAvailable')
                  : <>{companiesUsed} <span>/ {formatLimit(companiesLimit)}</span></>}
              </strong>
              {companiesLimit !== null && (
                isUnlimited(companiesLimit) ? (
                  <p className="settings-metric-note">{t('onboarding:noLimit')}</p>
                ) : (
                  <div
                    className="settings-progress"
                    role="progressbar"
                    aria-label={t('config:metricCompanies')}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={companiesPercent ?? 0}
                  >
                    <div className="settings-progress-bar" style={{ width: `${companiesPercent ?? 0}%` }} />
                  </div>
                )
              )}
            </article>

            <article className="settings-metric">
              <div className="settings-metric-head">
                <span className="settings-metric-label">{t('config:metricUsers')}</span>
                <span className="settings-metric-icon is-green" aria-hidden="true"><Users size={15} /></span>
              </div>
              <strong className="settings-metric-value">
                {usersLimit === null
                  ? t('common:notAvailable')
                  : <>{usersUsed} <span>/ {formatLimit(usersLimit)}</span></>}
              </strong>
              {usersLimit !== null && (
                isUnlimited(usersLimit) ? (
                  <p className="settings-metric-note">{t('onboarding:noLimit')}</p>
                ) : (
                  <div
                    className="settings-progress"
                    role="progressbar"
                    aria-label={t('config:metricUsers')}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={usersPercent ?? 0}
                  >
                    <div className="settings-progress-bar is-green" style={{ width: `${usersPercent ?? 0}%` }} />
                  </div>
                )
              )}
            </article>

            <article className="settings-metric">
              <div className="settings-metric-head">
                <span className="settings-metric-label">{t('config:metricFeatures')}</span>
                <span className="settings-metric-icon is-amber" aria-hidden="true"><CheckCircle2 size={15} /></span>
              </div>
              <strong className="settings-metric-value">
                {planFeatures.length > 0 ? planFeatures.length : t('common:notAvailable')}
              </strong>
              {planFeatures.length > 0 && (
                <>
                  <p className="settings-metric-note">{t('config:metricFeaturesIncluded')}</p>
                  <div className="settings-feature-preview">
                    {planFeatures.slice(0, 3).map(feature => (
                      <span key={feature} className="settings-feature-chip">{humanizeFeature(feature)}</span>
                    ))}
                  </div>
                </>
              )}
            </article>
          </div>
        </section>
      )}

      {activeTab === 'integrations' && (
        <section
          className="card settings-card"
          role="tabpanel"
          id="settings-panel-integrations"
          aria-labelledby="settings-tab-integrations"
        >
          <div className="settings-section-head">
            <div className="settings-section-head-main">
              <span className="settings-icon-tile is-blue" aria-hidden="true"><Database size={18} /></span>
              <div>
                <h2 className="settings-section-title">{t('config:integrationsTitle')}</h2>
                <p className="settings-section-desc">{t('config:integrationsSectionDesc')}</p>
              </div>
            </div>
          </div>

          <div className="settings-integration-list">
            <article className="settings-integration">
              <div className="settings-integration-main">
                <span className="settings-icon-tile is-green" aria-hidden="true"><MessageSquare size={19} /></span>
                <div>
                  <h3 className="settings-integration-title">{t('config:intWhatsappName')}</h3>
                  <p className="settings-integration-desc">{t('config:intWhatsappDesc')}</p>
                </div>
              </div>
              <span className="settings-state-pill is-on">
                <CheckCircle2 size={13} aria-hidden="true" />
                {t('config:intWhatsappStatus')}
              </span>
            </article>

            <article className="settings-integration">
              <div className="settings-integration-main">
                <span className="settings-icon-tile is-amber" aria-hidden="true"><Building size={19} /></span>
                <div>
                  <h3 className="settings-integration-title">{t('config:intAtName')}</h3>
                  <p className="settings-integration-desc">{t('config:intAtDesc')}</p>
                </div>
              </div>
              <span className="settings-state-pill is-on">
                <CheckCircle2 size={13} aria-hidden="true" />
                {t('config:intAtStatus')}
              </span>
            </article>

            <article className="settings-integration">
              <div className="settings-integration-main">
                <span className="settings-icon-tile is-blue" aria-hidden="true"><Database size={19} /></span>
                <div>
                  <h3 className="settings-integration-title">{t('config:intErpName')}</h3>
                  <p className="settings-integration-desc">{t('config:intErpDesc')}</p>
                </div>
              </div>
              <div className="settings-integration-side">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled
                  aria-describedby="erp-config-unavailable"
                >
                  {t('config:intErpConfigure')}
                </button>
                <span id="erp-config-unavailable" className="settings-integration-note">
                  {t('config:intErpUnavailable')}
                </span>
              </div>
            </article>
          </div>
        </section>
      )}

      {showPlanDetails && (
        <div className="modal-overlay" role="presentation" onClick={() => setShowPlanDetails(false)}>
          <section
            className="modal-card settings-plan-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="current-plan-title"
            onClick={event => event.stopPropagation()}
          >
            <div className="settings-modal-head">
              <div>
                <span className="badge badge-amber">{t('config:planBadge')}</span>
                <h2 id="current-plan-title" className="settings-modal-title">{currentPlanName}</h2>
                <p className="settings-modal-desc">{t('config:planDetailsSubtitle')}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPlanDetails(false)}
                aria-label={t('common:close')}
                className="settings-modal-close"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="settings-modal-body">
              <div className="settings-plan-detail-grid">
                <div className="settings-detail-tile">
                  <span className="settings-detail-label">{t('payment:monthlyPrice')}</span>
                  <strong className="settings-detail-value">
                    {currentPlan?.priceMznMonthly == null
                      ? t('payment:notSet')
                      : `${new Intl.NumberFormat('pt-MZ').format(currentPlan.priceMznMonthly)} MZN`}
                  </strong>
                </div>
                <div className="settings-detail-tile">
                  <span className="settings-detail-label">{t('payment:annualPrice')}</span>
                  <strong className="settings-detail-value">
                    {currentPlan?.priceMznAnnual == null
                      ? t('payment:notSet')
                      : `${new Intl.NumberFormat('pt-MZ').format(currentPlan.priceMznAnnual)} MZN`}
                  </strong>
                </div>
                <div className="settings-detail-tile">
                  <span className="settings-detail-label">{t('payment:paymentMethod')}</span>
                  <strong className="settings-detail-value">
                    {latestPayment ? paymentMethodKey[latestPayment.provider] ?? latestPayment.provider : t('payment:noPaymentRecorded')}
                  </strong>
                </div>
                <div className="settings-detail-tile">
                  <span className="settings-detail-label">{t('payment:billingFrequency')}</span>
                  <strong className="settings-detail-value">{billingFrequencyLabel ?? t('payment:notSet')}</strong>
                </div>
                <div className="settings-detail-tile">
                  <span className="settings-detail-label">{t('payment:nextDueDate')}</span>
                  <strong className="settings-detail-value">{formattedDueDate}</strong>
                </div>
              </div>

              <div>
                <h3 className="settings-modal-section-title">{t('payment:planServices')}</h3>
                <div className="settings-feature-list">
                  {planFeatures.map(feature => (
                    <div key={feature} className="settings-feature">
                      <Check size={15} aria-hidden="true" />
                      <span>{humanizeFeature(feature)}</span>
                    </div>
                  ))}
                  {planFeatures.length === 0 && (
                    <span className="settings-muted">{t('common:notAvailable')}</span>
                  )}
                </div>

                {subscription && (
                  <p className="settings-plan-limits">
                    {t('onboarding:maxCompaniesLabel')}: {formatLimit(subscription.limits.maxCompanies)}
                    {' · '}{t('onboarding:maxUsersLabel')}: {formatLimit(subscription.limits.maxUsers)}
                  </p>
                )}
              </div>
            </div>

            <div className="settings-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowPlanDetails(false)}>
                {t('common:close')}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
