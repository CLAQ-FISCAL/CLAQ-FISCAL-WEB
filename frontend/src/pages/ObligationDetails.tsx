import React from 'react';
import { ArrowLeft, Building2, CalendarDays, Clock3, FileText, Mail, Phone, Percent } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../context/AppStateContext';
import { FiscalObligation } from '../types';
import { formatMZN } from '../utils/formatters';

interface ObligationDetailsProps {
  obligationId: string;
  onNavigate: (path: string) => void;
}

const SUPPORT_PHONE = '258841234567';
const SUPPORT_EMAIL = 'office@claqconsulting.co.mz';

const getStatus = (obligation: FiscalObligation): 'paid' | 'overdue' | 'upcoming' => {
  if (obligation.status === 'pago') return 'paid';
  const due = new Date(`${obligation.dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today ? 'overdue' : 'upcoming';
};

export const ObligationDetails: React.FC<ObligationDetailsProps> = ({ obligationId, onNavigate }) => {
  const { t, i18n } = useTranslation();
  const { obligations, activeClient, clients } = useAppState();
  const obligation = obligations.find(item => item.id === obligationId);

  if (!obligation) {
    return (
      <div className="card" style={{ padding: 28, maxWidth: 780, margin: '0 auto' }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('/alertas')}>
          <ArrowLeft size={16} /> {t('alerts:backToAlerts')}
        </button>
        <h1 style={{ marginTop: 24, fontSize: 22, color: 'var(--slate-900)' }}>{t('alerts:obligationNotFound')}</h1>
      </div>
    );
  }

  const status = getStatus(obligation);
  const obligationClient = obligation.companyId
    ? clients.find(client => client.id === obligation.companyId)
      ?? (activeClient?.id === obligation.companyId ? activeClient : null)
    : null;
  const dueDate = new Intl.DateTimeFormat(i18n.language === 'pt' ? 'pt-MZ' : 'en', {
    day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date(`${obligation.dueDate}T00:00:00`));
  const fee = obligation.amount != null ? obligation.amount * 0.01 : null;
  const emailSubject = t('alerts:serviceEmailSubject', { title: obligation.title });
  const emailBody = t('alerts:serviceEmailBody', {
    title: obligation.title,
    category: obligation.category,
    dueDate,
    amount: obligation.amount == null ? t('alerts:amountNotSet') : formatMZN(obligation.amount),
    company: obligationClient?.name ?? ''
  });
  const emailHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  const detailRows = [
    { label: t('alerts:categoryLabel'), value: obligation.category },
    { label: t('alerts:periodLabel'), value: obligation.period || '—' },
    { label: t('alerts:dueDateLabel'), value: dueDate },
    { label: t('alerts:authorityLabel'), value: obligation.authority },
    { label: t('alerts:statusLabel'), value: t(`alerts:status${status[0].toUpperCase()}${status.slice(1)}`) },
    { label: t('alerts:amountLabel'), value: obligation.amount == null ? t('alerts:amountNotSet') : formatMZN(obligation.amount) }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1000, margin: '0 auto' }}>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => onNavigate('/alertas')}
        style={{ alignSelf: 'flex-start' }}
      >
        <ArrowLeft size={16} /> {t('alerts:backToAlerts')}
      </button>

      <section className="card" style={{ padding: '24px clamp(20px, 4vw, 36px)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--gold-50)', color: 'var(--gold-700)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <FileText size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span className="badge">{obligation.category}</span>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--slate-900)', marginTop: 9 }}>{obligation.title}</h1>
            <p style={{ color: 'var(--slate-500)', marginTop: 6 }}>{t('alerts:obligationDetailsSubtitle')}</p>
            {obligationClient?.name && (
              <p style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--slate-600)', fontSize: 13, marginTop: 10 }}>
                <Building2 size={15} /> {obligationClient.name}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 24 }}>
          {detailRows.map(row => (
            <div key={row.label} style={{ border: '1px solid var(--slate-200)', borderRadius: 12, padding: '13px 15px', background: 'var(--slate-50)' }}>
              <div style={{ fontSize: 12, color: 'var(--slate-500)', marginBottom: 5 }}>{row.label}</div>
              <strong style={{ color: 'var(--slate-900)', fontSize: 14 }}>{row.value}</strong>
            </div>
          ))}
        </div>

        {obligation.description && (
          <div style={{ borderTop: '1px solid var(--slate-200)', marginTop: 22, paddingTop: 18 }}>
            <h2 style={{ fontSize: 15, color: 'var(--slate-800)', marginBottom: 7 }}>{t('alerts:descriptionLabel')}</h2>
            <p style={{ color: 'var(--slate-600)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{obligation.description}</p>
          </div>
        )}
      </section>

      <section style={{ borderRadius: 16, padding: '22px clamp(20px, 4vw, 30px)', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', color: 'var(--blue-700)', background: '#DBEAFE', flexShrink: 0 }}>
            <Percent size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--slate-900)' }}>{t('alerts:resolutionTitle')}</h2>
            <p style={{ color: 'var(--slate-700)', lineHeight: 1.55, marginTop: 6 }}>{t('alerts:resolutionBody')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', marginTop: 12, color: 'var(--slate-700)', fontSize: 13 }}>
              <span><strong>{t('alerts:serviceFeeLabel')}:</strong> 1%{fee == null ? '' : ` (${formatMZN(fee)})`}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Clock3 size={15} /> {t('alerts:responseTime')}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
              <a href={`tel:+${SUPPORT_PHONE}`} className="btn btn-primary-gold" style={{ textDecoration: 'none' }}>
                <Phone size={16} /> {t('alerts:callAgent')}
              </a>
              <a href={emailHref} className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                <Mail size={16} /> {t('alerts:emailAgent')}
              </a>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--slate-500)', fontSize: 12 }}>
                <CalendarDays size={14} /> {t('alerts:businessHoursNote')}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
