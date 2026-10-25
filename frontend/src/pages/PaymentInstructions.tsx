import React, { useMemo, useState } from 'react';
import { ArrowLeft, Building2, Check, Copy, FileText, Phone, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ClaqLogo } from '../components/common/ClaqLogo';
import { LanguageToggle } from '../i18n/LanguageToggle';
import { usePlans } from '../hooks/useFiscalQueries';
import { getPlanDisplayName } from '../lib/planDisplay';
import { readAudience, readIntentPlan } from '../lib/audience';

interface PaymentInstructionsProps {
  onBack: () => void;
  onContinue: () => void;
}

const formatMzn = (value: number) => `${new Intl.NumberFormat('pt-MZ').format(value)} MZN`;
const SUPPORT_PHONE = '258841234567';

const bankAccounts = [
  {
    bank: 'Millennium BIM',
    holder: 'AIDA HERMENGILDO CHIQUEPO',
    accountNumber: '',
    nib: '0001 0000 0112 4504 7055 7',
    nuib: '202410000484268',
    iban: 'MZ59 0001 0000 0112 4504 7055 7',
    swift: 'BIMOMZMXXXX'
  },
  {
    bank: 'FNB',
    holder: 'Carlos Lourenço Quintão',
    accountNumber: '4817325610001',
    nib: '001400004817325610191',
    nuib: '202410000484268',
    iban: 'MZ59001400004817325610191',
    swift: 'FIRNMZMX'
  }
];

export const PaymentInstructions: React.FC<PaymentInstructionsProps> = ({ onBack, onContinue }) => {
  const { t } = useTranslation();
  const plansQuery = usePlans();
  const planCode = readIntentPlan();
  const audience = readAudience();
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>(() =>
    localStorage.getItem('claq_billing_interval') === 'year' ? 'year' : 'month'
  );
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptError, setReceiptError] = useState('');
  const [contactStarted, setContactStarted] = useState(false);
  const [copiedValue, setCopiedValue] = useState('');

  const plan = useMemo(() => {
    const catalog = plansQuery.data?.families;
    return [...(catalog?.ACCOUNTANT ?? []), ...(catalog?.COMPANY ?? [])].find(item => item.code === planCode);
  }, [planCode, plansQuery.data]);
  const price = billingInterval === 'year'
    ? plan?.priceMznAnnual ?? null
    : plan?.priceMznMonthly ?? plan?.priceMzn ?? null;
  const planName = getPlanDisplayName(plan?.code, plan?.label, key => t(key));
  const flow = localStorage.getItem('claq_payment_flow') ?? 'signup';

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      window.setTimeout(() => setCopiedValue(''), 1600);
    } catch {
      // The account details remain selectable for manual copying if clipboard access is blocked.
    }
  };

  const startWhatsAppPayment = () => {
    const message = t('payment:whatsappMessage', {
      plan: planName,
      interval: billingInterval === 'year' ? t('payment:annual') : t('payment:monthly'),
      amount: price === null ? t('common:notAvailable') : formatMzn(price)
    });
    window.open(`https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    setContactStarted(true);
  };

  const handleReceiptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file && (file.type !== 'application/pdf' || file.size > 10 * 1024 * 1024)) {
      setReceipt(null);
      setReceiptError(t(file.type !== 'application/pdf' ? 'payment:pdfOnly' : 'payment:pdfTooLarge'));
      event.target.value = '';
      return;
    }
    setReceiptError('');
    setReceipt(file);
  };

  return (
    <main style={{ minHeight: '100vh', background: '#070E1E', padding: '28px 20px 48px', fontFamily: 'var(--font-sans)' }}>
      <div style={{ position: 'absolute', top: 20, right: 24 }}><LanguageToggle variant="dark" /></div>
      <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
        <ClaqLogo variant="dark" size="lg" />
        <section style={{ marginTop: '26px', background: '#FFFFFF', borderRadius: '22px', padding: '30px', boxShadow: '0 24px 60px rgba(0,0,0,.3)' }}>
          <button type="button" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 18, padding: 0, border: 0, background: 'none', color: '#64748B', fontWeight: 700, cursor: 'pointer' }}>
            <ArrowLeft size={15} />{t('common:back')}
          </button>
          <h1 style={{ margin: 0, color: '#0F172A', fontSize: 25, fontWeight: 800 }}>{t('payment:title')}</h1>
          <p style={{ margin: '7px 0 22px', color: '#64748B', fontSize: 14 }}>{t('payment:subtitle')}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 22 }}>
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 14, padding: 18, background: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748B', fontSize: 12, fontWeight: 700 }}><Building2 size={16} />{t('payment:selectedPlan')}</div>
              <h2 style={{ margin: '9px 0 4px', fontSize: 18, color: '#0F172A' }}>{planName}</h2>
              <strong style={{ fontSize: 20, color: '#0F172A' }}>{price === null ? t('common:notAvailable') : formatMzn(price)}</strong>
              <span style={{ marginLeft: 5, fontSize: 12, color: '#64748B' }}>{billingInterval === 'year' ? t('payment:perYear') : t('payment:perMonth')}</span>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                {(['month', 'year'] as const).map(interval => (
                  <button key={interval} type="button" onClick={() => {
                    setBillingInterval(interval);
                    localStorage.setItem('claq_billing_interval', interval);
                  }} className={billingInterval === interval ? 'btn btn-primary-gold' : 'btn btn-secondary'} style={{ padding: '8px 12px', fontSize: 12 }}>
                    {interval === 'month' ? t('payment:monthly') : t('payment:annual')}
                  </button>
                ))}
              </div>
            </div>

            {bankAccounts.map(account => (
              <div key={account.bank} style={{ border: '1px solid #E2E8F0', borderRadius: 14, padding: 18 }}>
                <h2 style={{ margin: '0 0 5px', fontSize: 17, color: '#0F172A' }}>{account.bank}</h2>
                <p style={{ margin: '0 0 13px', fontSize: 12, color: '#64748B' }}>{t('payment:accountHolder')}: <strong style={{ color: '#334155' }}>{account.holder}</strong></p>
                {([
                  ...(account.accountNumber ? [[t('payment:accountNumber'), account.accountNumber] as [string, string]] : []),
                  ['NIB', account.nib],
                  ['NUIB', account.nuib],
                  ['IBAN', account.iban],
                  ['SWIFT', account.swift]
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '5px 0', borderTop: '1px solid #F1F5F9' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: '#94A3B8', fontSize: 10, fontWeight: 700 }}>{label}</div>
                      <div style={{ color: '#334155', fontSize: 12, wordBreak: 'break-word' }}>{value}</div>
                    </div>
                    <button type="button" aria-label={t('payment:copy', { label })} onClick={() => copyValue(value)} style={{ padding: 5, border: 0, background: 'transparent', color: copiedValue === value ? '#059669' : '#64748B', cursor: 'pointer' }}>
                      {copiedValue === value ? <Check size={15} /> : <Copy size={15} />}
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ border: '1px solid #FCD34D', background: '#FFFBEB', borderRadius: 12, padding: 14, marginBottom: 18, color: '#78350F', fontSize: 13, lineHeight: 1.55 }}>
            {t('payment:verificationNotice')}
          </div>

          <label style={{ display: 'grid', gap: 8, marginBottom: 8, color: '#334155', fontSize: 13, fontWeight: 700 }}>
            {t('payment:receiptLabel')}
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px dashed #CBD5E1', borderRadius: 10, padding: 12, color: '#64748B', fontWeight: 500 }}>
              <Upload size={17} />
              <input type="file" accept="application/pdf,.pdf" onChange={handleReceiptChange} style={{ maxWidth: '100%' }} />
            </span>
          </label>
          {receipt && <p style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#047857', fontSize: 12, margin: '8px 0' }}><FileText size={15} />{receipt.name}{t('payment:attachInWhatsApp')}</p>}
          {receiptError && <p role="alert" style={{ color: '#B91C1C', fontSize: 12 }}>{receiptError}</p>}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
            <button type="button" onClick={startWhatsAppPayment} disabled={!receipt} className="btn btn-primary-gold">
              {t('payment:sendProofWhatsApp')}
            </button>
            <a href={`tel:+${SUPPORT_PHONE}`} onClick={() => setContactStarted(true)} className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              <Phone size={15} />{t('payment:callAgent')}
            </a>
            <button type="button" disabled={!contactStarted} onClick={onContinue} className="btn btn-secondary" style={{ marginLeft: 'auto' }}>
              {flow === 'upgrade' ? t('payment:returnToAccount') : t('payment:continueToLogin')}
            </button>
          </div>
          <p style={{ margin: '12px 0 0', color: '#64748B', fontSize: 12, lineHeight: 1.5 }}>{t(audience === 'contabilidade' ? 'payment:accountantNotice' : 'payment:manualReviewNotice')}</p>
        </section>
      </div>
    </main>
  );
};
