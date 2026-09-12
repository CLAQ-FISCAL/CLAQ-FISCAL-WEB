import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Smartphone,
  Building,
  CheckCircle2,
  AlertCircle,
  Copy,
  ArrowRight,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../../context/AppStateContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName?: string;
  planPrice?: string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  planName,
  planPrice
}) => {
  const { t } = useTranslation();
  const { addToast } = useAppState();
  const resolvedPlanName = planName ?? t('checkout:planName');
  const resolvedPlanPrice = planPrice ?? t('checkout:planPrice');

  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'emola' | 'card' | 'bank'>('mpesa');
  const [phone, setPhone] = useState('841234567');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
addToast('info', t('checkout:toastPaymentPendingTitle'), t('checkout:toastPaymentPendingMessage'));
    }, 600);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast('info', t('checkout:toastCopiedTitle'), t('checkout:toastCopiedMessage', { label }));
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '580px', width: '90%', padding: '0', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ backgroundColor: 'var(--navy-900)', color: '#FFFFFF', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{t('checkout:title')}</h3>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
              {resolvedPlanName} • {resolvedPlanPrice}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {paymentSuccess ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={36} />
            </div>
            <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)' }}>{t('checkout:successTitle')}</h4>
            <p style={{ fontSize: '13.5px', color: 'var(--slate-500)', marginTop: '8px', maxWidth: '380px', margin: '8px auto 24px' }}>
              {t('checkout:successMessage')}
            </p>
            <button
              onClick={() => {
                setPaymentSuccess(false);
                onClose();
              }}
              className="btn btn-primary-gold"
              style={{ padding: '10px 28px' }}
            >
              {t('checkout:closeAndContinue')}
            </button>
          </div>
        ) : (
          <div style={{ padding: '24px' }}>
            {/* Method Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setPaymentMethod('mpesa')}
                style={{
                  padding: '12px 6px',
                  borderRadius: '10px',
                  border: paymentMethod === 'mpesa' ? '2px solid #EF4444' : '1px solid var(--slate-200)',
                  backgroundColor: paymentMethod === 'mpesa' ? '#FEF2F2' : '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Smartphone size={20} color="#EF4444" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#991B1B' }}>M-Pesa</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('emola')}
                style={{
                  padding: '12px 6px',
                  borderRadius: '10px',
                  border: paymentMethod === 'emola' ? '2px solid #F59E0B' : '1px solid var(--slate-200)',
                  backgroundColor: paymentMethod === 'emola' ? '#FFFBEB' : '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Smartphone size={20} color="#D97706" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#92400E' }}>E-Mola</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                style={{
                  padding: '12px 6px',
                  borderRadius: '10px',
                  border: paymentMethod === 'card' ? '2px solid #2563EB' : '1px solid var(--slate-200)',
                  backgroundColor: paymentMethod === 'card' ? '#EFF6FF' : '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <CreditCard size={20} color="#2563EB" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#1E40AF' }}>SIMO / Visa</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank')}
                style={{
                  padding: '12px 6px',
                  borderRadius: '10px',
                  border: paymentMethod === 'bank' ? '2px solid var(--navy-800)' : '1px solid var(--slate-200)',
                  backgroundColor: paymentMethod === 'bank' ? 'var(--slate-100)' : '#FFFFFF',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Building size={20} color="var(--navy-800)" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--navy-900)' }}>{t('checkout:bankOption')}</span>
              </button>
            </div>

            {/* Form Bodies */}
            {paymentMethod === 'mpesa' && (
              <form onSubmit={handlePay}>
                <div className="form-group">
                  <label className="form-label">{t('checkout:mpesaLabel')}</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ padding: '10px 14px', backgroundColor: 'var(--slate-100)', borderRadius: '8px', border: '1px solid var(--slate-300)', fontSize: '13px', fontWeight: 700 }}>
                      +258
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="84 123 4567"
                      required
                    />
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--slate-500)', marginTop: '6px' }}>
                    {t('checkout:mpesaHint')}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn btn-primary-gold"
                  style={{ width: '100%', padding: '12px', marginTop: '12px' }}
                >
                  {isProcessing ? t('checkout:processingMpesa') : t('checkout:payMpesa', { price: resolvedPlanPrice })}
                </button>
              </form>
            )}

            {paymentMethod === 'emola' && (
              <form onSubmit={handlePay}>
                <div className="form-group">
                  <label className="form-label">{t('checkout:emolaLabel')}</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ padding: '10px 14px', backgroundColor: 'var(--slate-100)', borderRadius: '8px', border: '1px solid var(--slate-300)', fontSize: '13px', fontWeight: 700 }}>
                      +258
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      defaultValue="861234567"
                      placeholder="86 123 4567"
                      required
                    />
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--slate-500)', marginTop: '6px' }}>
                    {t('checkout:emolaHint')}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn btn-primary-gold"
                  style={{ width: '100%', padding: '12px', marginTop: '12px' }}
                >
                  {isProcessing ? t('checkout:processingEmola') : t('checkout:payEmola', { price: resolvedPlanPrice })}
                </button>
              </form>
            )}

            {paymentMethod === 'card' && (
              <form onSubmit={handlePay}>
                <div className="form-group">
                  <label className="form-label">{t('checkout:cardNumberLabel')}</label>
                  <input type="text" className="form-control" placeholder="4000 1234 5678 9010" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">{t('checkout:expiry')}</label>
                    <input type="text" className="form-control" placeholder="MM/AA" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CVV / CVC</label>
                    <input type="password" maxLength={4} className="form-control" placeholder="123" required />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn btn-primary-gold"
                  style={{ width: '100%', padding: '12px', marginTop: '12px' }}
                >
                  {isProcessing ? t('checkout:processingCard') : t('checkout:authorizePayment')}
                </button>
              </form>
            )}

            {paymentMethod === 'bank' && (
              <div>
                <div style={{ backgroundColor: 'var(--slate-50)', padding: '14px', borderRadius: '10px', border: '1px solid var(--slate-200)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>{t('checkout:entity')}</span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--slate-900)' }}>99001 (CLAQ)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>{t('checkout:reference')}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#2563EB' }}>400 889 900</span>
                      <Copy size={14} style={{ cursor: 'pointer' }} onClick={() => copyToClipboard('400889900', t('checkout:reference'))} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>{t('common:amount')}:</span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--slate-900)' }}>3 500,00 MZN</span>
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--slate-600)', lineHeight: 1.5, marginBottom: '16px' }}>
                  {t('checkout:bankChannelsIntro')}: <strong>Millennium BIM</strong>, <strong>BCI</strong> {t('checkout:and')} <strong>Standard Bank Moçambique</strong>.
                </p>

                <button
                  type="button"
                  onClick={handlePay}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '12px' }}
                >
                  <CheckCircle2 size={16} />
                  <span>{t('checkout:paidAlready')}</span>
                </button>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px', fontSize: '11px', color: 'var(--slate-400)' }}>
              <Lock size={12} />
              <span>{t('checkout:secureTransactions')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
