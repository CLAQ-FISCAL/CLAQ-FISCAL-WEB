import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './Sidebar';
import { Header, WhatsAppMark } from './Header';
import { WhatsAppModal } from '../whatsapp/WhatsAppModal';
import { AIAssistantDrawer } from '../ai/AIAssistantDrawer';
import { PDFPreviewModal } from '../simulators/PDFPreviewModal';
import { useAppState } from '../../context/AppStateContext';
import { ClaqLogoMark } from '../common/ClaqLogo';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  X
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentPath,
  onNavigate
}) => {
  const { t } = useTranslation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const {
    toasts,
    removeToast,
    setIsWhatsAppModalOpen,
    setIsAIAssistantOpen
  } = useAppState();

  return (
    <div className="app-container">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        collapsed={sidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Top Header */}
        <Header
          currentPath={currentPath}
          onNavigate={onNavigate}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Page Body Container */}
        <main className="page-body">
          {children}
        </main>
      </div>

      {/* Modals & Slide-out Panels */}
      <WhatsAppModal />
      <AIAssistantDrawer />
      <PDFPreviewModal />

      {/* Floating Action Quick Access (AI & WhatsApp) */}
      <div
        className="whatsapp-fab"
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 80
        }}
      >
        <button
          type="button"
          aria-label={t('layout:openAiAssistant')}
          onClick={() => setIsAIAssistantOpen(true)}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#0F172A',
            border: '1px solid rgba(245, 158, 11, 0.72)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(15, 23, 42, 0.32), 0 2px 8px rgba(245, 158, 11, 0.16)',
            cursor: 'pointer',
            transition: 'transform 0.18s ease, box-shadow 0.18s ease',
            outlineOffset: '3px'
          }}
          title={t('layout:openAiAssistant')}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <ClaqLogoMark size={32} />
        </button>

        <button
          type="button"
          aria-label={t('layout:openWhatsApp')}
          onClick={() => setIsWhatsAppModalOpen(true)}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#25D366',
            border: '2px solid #FFFFFF',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(15, 23, 42, 0.28), 0 2px 8px rgba(37, 211, 102, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title={t('layout:openWhatsApp')}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <WhatsAppMark size={26} />
        </button>
      </div>

      {/* Dynamic Toast Notification Stack */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            onClick={() => removeToast(toast.id)}
          >
            <div style={{ flexShrink: 0, marginTop: '1px' }}>
              {toast.type === 'success' && <CheckCircle2 size={18} color="#10b981" />}
              {toast.type === 'warning' && <AlertTriangle size={18} color="#f59e0b" />}
              {toast.type === 'info' && <Info size={18} color="#3b82f6" />}
              {toast.type === 'error' && <XCircle size={18} color="#ef4444" />}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontSize: '13.5px', 
                fontWeight: 600, 
                color: '#0f172a',
                lineHeight: '1.35',
                marginBottom: '2px'
              }}>
                {toast.title}
              </div>
              <div style={{ 
                fontSize: '12.5px', 
                color: '#64748b', 
                lineHeight: '1.45' 
              }}>
                {toast.message}
              </div>
            </div>

            <button
              onClick={e => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              aria-label="Fechar"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.color = '#0f172a';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
