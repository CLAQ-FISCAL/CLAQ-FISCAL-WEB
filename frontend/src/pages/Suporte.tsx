import React, { useState } from 'react';
import {
  HelpCircle,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../context/AppStateContext';

export const Suporte: React.FC = () => {
  const { t } = useTranslation();
  const { addToast, setIsWhatsAppModalOpen, setIsAIAssistantOpen } = useAppState();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: t('support:faq1Q'),
      a: t('support:faq1A')
    },
    {
      q: t('support:faq2Q'),
      a: t('support:faq2A')
    },
    {
      q: t('support:faq3Q'),
      a: t('support:faq3A')
    },
    {
      q: t('support:faq4Q'),
      a: t('support:faq4A')
    }
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      addToast('success', t('support:toastTitle'), t('support:toastMessage'));
      setSubject('');
      setMessage('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>
          {t('support:title')}
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--slate-500)', marginTop: '2px' }}>
          {t('support:subtitle')}
        </p>
      </div>

      {/* Top 3 Quick Channels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div
          onClick={() => setIsWhatsAppModalOpen(true)}
          className="card card-hover"
          style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', backgroundColor: '#ECFDF5', borderColor: 'rgba(16, 185, 129, 0.3)' }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={22} color="#FFFFFF" />
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#065F46' }}>{t('support:whatsappTitle')}</h4>
            <p style={{ fontSize: '12px', color: '#047857' }}>{t('support:whatsappSubtitle')}</p>
          </div>
        </div>

        <div
          onClick={() => setIsAIAssistantOpen(true)}
          className="card card-hover"
          style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', backgroundColor: 'var(--blue-50)', borderColor: 'rgba(37, 99, 235, 0.3)' }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={22} color="#FFFFFF" />
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1E40AF' }}>{t('support:aiTitle')}</h4>
            <p style={{ fontSize: '12px', color: '#1D4ED8' }}>{t('support:aiSubtitle')}</p>
          </div>
        </div>

        <div
          className="card"
          style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--gold-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={22} color="var(--gold-600)" />
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-800)' }}>{t('support:officeTitle')}</h4>
            <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>{t('support:officeSubtitle')}</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: FAQ & Contact Form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* FAQ Accordion */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '16px' }}>
            {t('support:faqTitle')}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    borderRadius: '10px',
                    border: '1px solid var(--slate-200)',
                    overflow: 'hidden',
                    backgroundColor: isOpen ? 'var(--slate-50)' : '#FFFFFF'
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: 'none',
                      backgroundColor: 'transparent',
                      textAlign: 'left',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      color: 'var(--slate-800)',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 16px 14px 16px', fontSize: '13px', color: 'var(--slate-600)', lineHeight: 1.55 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Form */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '16px' }}>
            {t('support:contactTitle')}
          </h3>

          <form onSubmit={handleSendMessage}>
            <div className="form-group">
              <label className="form-label">{t('support:subjectLabel')}</label>
              <input
                type="text"
                className="form-control"
                placeholder={t('support:subjectPlaceholder')}
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('support:messageLabel')}</label>
              <textarea
                className="form-control"
                rows={5}
                placeholder={t('support:messagePlaceholder')}
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary-gold" style={{ width: '100%', padding: '12px' }}>
              <Send size={16} />
              <span>{t('support:sendButton')}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
