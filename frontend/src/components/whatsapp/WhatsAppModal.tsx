import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  CheckCircle2,
  Send,
  Smartphone,
  ShieldCheck,
  QrCode,
  BellRing
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../../context/AppStateContext';

export const WhatsAppModal: React.FC = () => {
  const { t } = useTranslation();
  const {
    user,
    isWhatsAppModalOpen,
    setIsWhatsAppModalOpen,
    settings,
    connectWhatsApp,
    dispatchTestAlert
  } = useAppState();

  const [phone, setPhone] = useState(settings.whatsappNumber || '+258 84 123 4567');
  const [activeTab, setActiveTab] = useState<'connect' | 'test' | 'templates'>('connect');
  const [selectedTemplate, setSelectedTemplate] = useState('iva_alert');

  if (!isWhatsAppModalOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setIsWhatsAppModalOpen(false)}>
      <div className="modal-card" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--slate-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #0B132B 0%, #0F172A 100%)',
            color: '#FFFFFF'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MessageSquare size={20} color="#10B981" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
                {t('whatsapp:title')}
              </h3>
              <p style={{ fontSize: '12px', color: '#94A3B8' }}>
                {t('whatsapp:subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsWhatsAppModalOpen(false)}
            className="btn btn-ghost"
            style={{ padding: '6px', color: '#94A3B8' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--slate-200)',
            backgroundColor: 'var(--slate-50)',
            padding: '0 24px'
          }}
        >
          <button
            onClick={() => setActiveTab('connect')}
            style={{
              padding: '12px 16px',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '13.5px',
              fontWeight: 600,
              color: activeTab === 'connect' ? 'var(--blue-600)' : 'var(--slate-600)',
              borderBottom: `2px solid ${activeTab === 'connect' ? 'var(--blue-600)' : 'transparent'}`,
              cursor: 'pointer'
            }}
          >
            {t('whatsapp:tabConnect')}
          </button>
          <button
            onClick={() => setActiveTab('test')}
            style={{
              padding: '12px 16px',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '13.5px',
              fontWeight: 600,
              color: activeTab === 'test' ? 'var(--blue-600)' : 'var(--slate-600)',
              borderBottom: `2px solid ${activeTab === 'test' ? 'var(--blue-600)' : 'transparent'}`,
              cursor: 'pointer'
            }}
          >
            {t('whatsapp:tabTest')}
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            style={{
              padding: '12px 16px',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '13.5px',
              fontWeight: 600,
              color: activeTab === 'templates' ? 'var(--blue-600)' : 'var(--slate-600)',
              borderBottom: `2px solid ${activeTab === 'templates' ? 'var(--blue-600)' : 'transparent'}`,
              cursor: 'pointer'
            }}
          >
            {t('whatsapp:tabTemplates')}
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {activeTab === 'connect' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  backgroundColor: '#ECFDF5',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  marginBottom: '20px'
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    flexShrink: 0
                  }}
                >
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#065F46' }}>
                    {t('whatsapp:channelActive')}
                  </h4>
                  <p style={{ fontSize: '12.5px', color: '#047857', marginTop: '2px' }}>
                    {t('whatsapp:channelActiveDescription')}
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('whatsapp:numberLabel')}</label>
                <div style={{ position: 'relative' }}>
                  <Smartphone
                    size={18}
                    color="var(--slate-400)"
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+258 84 000 0000"
                  />
                </div>
                <span style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '4px' }}>
                  {t('whatsapp:compatibleOperators')}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  backgroundColor: 'var(--slate-50)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--slate-600)',
                  marginTop: '16px'
                }}
              >
                <ShieldCheck size={16} color="var(--emerald-600)" />
                <span>{t('whatsapp:privacyNote')}</span>
              </div>
            </div>
          )}

          {activeTab === 'test' && (
            <div>
              <p style={{ fontSize: '13.5px', color: 'var(--slate-600)', marginBottom: '16px' }}>
                {t('whatsapp:testInstructions')}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <button
                  onClick={() => dispatchTestAlert('whatsapp')}
                  className="btn"
                  style={{
                    backgroundColor: '#ECFDF5',
                    color: '#065F46',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <MessageSquare size={22} color="#10B981" />
                  <span style={{ fontWeight: 700 }}>{t('whatsapp:alertWhatsApp')}</span>
                  <span style={{ fontSize: '11px', color: '#047857' }}>+258 84 123 4567</span>
                </button>

                <button
                  onClick={() => dispatchTestAlert('email')}
                  className="btn"
                  style={{
                    backgroundColor: '#EFF6FF',
                    color: '#1E40AF',
                    border: '1px solid rgba(37, 99, 235, 0.3)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <BellRing size={22} color="#2563EB" />
                  <span style={{ fontWeight: 700 }}>{t('whatsapp:alertEmail')}</span>
                  <span style={{ fontSize: '11px', color: '#1D4ED8' }}>carlos.apollo@claq.co.mz</span>
                </button>
              </div>

              {/* Phone WhatsApp Preview Mockup */}
              <div
                style={{
                  backgroundColor: '#0F172A',
                  borderRadius: '14px',
                  padding: '16px',
                  color: '#FFFFFF'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8' }}>
                    {t('whatsapp:previewLabel')}
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: '#1E293B',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    borderLeft: '4px solid #10B981',
                    fontSize: '12.5px',
                    lineHeight: 1.5
                  }}
                >
                  <p style={{ fontWeight: 700, color: '#FBBF24', marginBottom: '4px' }}>
                    {t('whatsapp:previewTitle')}
                  </p>
<p>{t('whatsapp:previewGreeting')} <b>{user?.name || t('whatsapp:administrator')}</b>,</p>
                  <p>{t('whatsapp:previewObligationPrefix')} <b>{t('whatsapp:previewObligationType')}</b> {t('whatsapp:previewObligationSuffix')}</p>
                  <p style={{ marginTop: '6px', color: '#94A3B8', fontSize: '11.5px' }}>
                    {t('whatsapp:previewEstimatedValue')}<br />
                    {t('whatsapp:previewCta')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                onClick={() => setSelectedTemplate('iva_alert')}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  border: `1.5px solid ${selectedTemplate === 'iva_alert' ? 'var(--blue-600)' : 'var(--slate-200)'}`,
                  backgroundColor: selectedTemplate === 'iva_alert' ? 'var(--blue-50)' : '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--slate-900)' }}>
                  {t('whatsapp:template1Title')}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--slate-600)', marginTop: '4px' }}>
                  {t('whatsapp:template1Description')}
                </p>
              </div>

              <div
                onClick={() => setSelectedTemplate('inss_alert')}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  border: `1.5px solid ${selectedTemplate === 'inss_alert' ? 'var(--blue-600)' : 'var(--slate-200)'}`,
                  backgroundColor: selectedTemplate === 'inss_alert' ? 'var(--blue-50)' : '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--slate-900)' }}>
                  {t('whatsapp:template2Title')}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--slate-600)', marginTop: '4px' }}>
                  {t('whatsapp:template2Description')}
                </p>
              </div>

              <div
                onClick={() => setSelectedTemplate('tae_alert')}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  border: `1.5px solid ${selectedTemplate === 'tae_alert' ? 'var(--blue-600)' : 'var(--slate-200)'}`,
                  backgroundColor: selectedTemplate === 'tae_alert' ? 'var(--blue-50)' : '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--slate-900)' }}>
                  {t('whatsapp:template3Title')}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--slate-600)', marginTop: '4px' }}>
                  {t('whatsapp:template3Description')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--slate-200)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            backgroundColor: 'var(--slate-50)'
          }}
        >
          <button onClick={() => setIsWhatsAppModalOpen(false)} className="btn btn-secondary">
            {t('common:close')}
          </button>
          <button
            onClick={() => connectWhatsApp(phone)}
            className="btn btn-primary-gold"
          >
            <CheckCircle2 size={16} />
            <span>{t('whatsapp:saveAndConnect')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
