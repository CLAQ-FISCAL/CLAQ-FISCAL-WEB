import React, { useState } from 'react';
import {
  Search,
  Info,
  MapPin,
  Send,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../context/AppStateContext';
import { WhatsAppMark } from '../components/layout/Header';
import { ClaqLogoMark } from '../components/common/ClaqLogo';

const SUPPORT_EMAIL = 'office@claqconsulting.co.mz';

export const Suporte: React.FC = () => {
  const { t } = useTranslation();
  const { addToast, setIsWhatsAppModalOpen, setIsAIAssistantOpen } = useAppState();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('tax');
  const [faqSearch, setFaqSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(1);

  const faqs = [
    {
      id: 1,
      q: t('support:faq1Q'),
      a: t('support:faq1A')
    },
    {
      id: 2,
      q: t('support:faq2Q'),
      a: t('support:faq2A')
    },
    {
      id: 3,
      q: t('support:faq3Q'),
      a: t('support:faq3A')
    },
    {
      id: 4,
      q: t('support:faq4Q'),
      a: t('support:faq4A')
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    `${faq.q} ${faq.a}`.toLocaleLowerCase().includes(faqSearch.trim().toLocaleLowerCase())
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      addToast('warning', t('support:validationTitle'), t('support:validationMessage'));
      return;
    }
    const categoryLabel = t(`support:category${category[0].toUpperCase()}${category.slice(1)}`);
    const emailSubject = `[CLAQ Support] ${subject.trim()}`;
    const emailBody = `${t('support:categoryLabel')}: ${categoryLabel}\n\n${message.trim()}`;
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    addToast('info', t('support:requestNotSentTitle'), t('support:requestNotSentMessage'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 3vw, 28px)', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
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
      <div id="support-channels" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
        <button type="button" onClick={() => setIsWhatsAppModalOpen(true)} aria-label={t('support:whatsappActionLabel')} className="card card-hover support-channel-button" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', textAlign: 'left', backgroundColor: '#ECFDF5', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <WhatsAppMark size={26} />
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#065F46' }}>{t('support:whatsappTitle')}</h4>
            <p style={{ fontSize: '12px', color: '#047857' }}>{t('support:whatsappSubtitle')}</p>
          </div>
        </button>

        <button type="button" onClick={() => setIsAIAssistantOpen(true)} aria-label={t('support:aiActionLabel')} className="card card-hover support-channel-button" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', textAlign: 'left', backgroundColor: 'var(--blue-50)', borderColor: 'rgba(37, 99, 235, 0.3)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClaqLogoMark size={32} />
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1E40AF' }}>{t('support:aiTitle')}</h4>
            <p style={{ fontSize: '12px', color: '#1D4ED8' }}>{t('support:aiSubtitle')}</p>
          </div>
        </button>

        <div
          className="card"
          style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 'clamp(16px, 2.5vw, 24px)', alignItems: 'start' }}>
        {/* FAQ Accordion */}
        <div className="card" style={{ padding: 'clamp(16px, 3vw, 24px)', minWidth: 0 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '16px' }}>
            {t('support:faqTitle')}
          </h3>

          <label htmlFor="support-faq-search" style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--slate-200)', borderRadius: '10px', padding: '0 12px', marginBottom: '14px', color: 'var(--slate-400)' }}>
            <Search size={17} aria-hidden="true" />
            <input id="support-faq-search" type="search" value={faqSearch} onChange={e => setFaqSearch(e.target.value)} placeholder={t('support:faqSearchPlaceholder')} aria-label={t('support:faqSearchLabel')} style={{ width: '100%', minWidth: 0, padding: '11px 0', border: 0, outline: 'none', color: 'var(--slate-800)', background: 'transparent', font: 'inherit' }} />
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredFaqs.map(faq => {
              const isOpen = openFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  style={{
                    borderRadius: '10px',
                    border: '1px solid var(--slate-200)',
                    overflow: 'hidden',
                    backgroundColor: isOpen ? 'var(--slate-50)' : '#FFFFFF'
                  }}
                >
                  <button
                    type="button"
                    id={`support-faq-trigger-${faq.id}`}
                    aria-expanded={isOpen}
                    aria-controls={`support-faq-panel-${faq.id}`}
                    onClick={() => setOpenFaq(isOpen ? null : faq.id)}
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

                  <div id={`support-faq-panel-${faq.id}`} role="region" aria-labelledby={`support-faq-trigger-${faq.id}`} hidden={!isOpen} style={{ padding: '0 16px 14px 16px', fontSize: '13px', color: 'var(--slate-600)', lineHeight: 1.55 }}>
                    {faq.a}
                  </div>
                </div>
              );
            })}
            {filteredFaqs.length === 0 && <p role="status" style={{ padding: '16px', borderRadius: '10px', background: 'var(--slate-50)', color: 'var(--slate-600)', fontSize: '13px' }}>{t('support:faqNoResults')}</p>}
          </div>
        </div>

        {/* Contact Form */}
        <div className="card" style={{ padding: 'clamp(16px, 3vw, 24px)', minWidth: 0 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '16px' }}>
            {t('support:contactTitle')}
          </h3>

          <div role="note" style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', padding: '12px', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', fontSize: '12px', lineHeight: 1.5, marginBottom: '16px' }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{t('support:requestNotSentMessage')} <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#92400E', fontWeight: 700 }}>{SUPPORT_EMAIL}</a></span>
          </div>

          <form onSubmit={handleSendMessage}>
            <div className="form-group">
              <label htmlFor="support-subject" className="form-label">{t('support:subjectLabel')}</label>
              <input
                id="support-subject"
                type="text"
                className="form-control"
                placeholder={t('support:subjectPlaceholder')}
                value={subject}
                onChange={e => setSubject(e.target.value)}
                maxLength={120}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="support-category" className="form-label">{t('support:categoryLabel')}</label>
              <select id="support-category" className="form-control" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="tax">{t('support:categoryTax')}</option>
                <option value="account">{t('support:categoryAccount')}</option>
                <option value="technical">{t('support:categoryTechnical')}</option>
                <option value="other">{t('support:categoryOther')}</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="support-message" className="form-label">{t('support:messageLabel')}</label>
              <textarea
                id="support-message"
                className="form-control"
                rows={5}
                placeholder={t('support:messagePlaceholder')}
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={3000}
                required
              />
              <span style={{ display: 'block', marginTop: '6px', color: 'var(--slate-500)', fontSize: '11px', lineHeight: 1.5 }}>{t('support:privacyHelper')}</span>
            </div>

            <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: '12px' }}>
              <Send size={16} />
              <span>{t('support:sendButton')}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
