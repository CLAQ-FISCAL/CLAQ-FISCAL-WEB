import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { WhatsAppModal } from '../whatsapp/WhatsAppModal';
import { AIAssistantDrawer } from '../ai/AIAssistantDrawer';
import { PDFPreviewModal } from '../simulators/PDFPreviewModal';
import { useAppState } from '../../context/AppStateContext';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  X,
  MessageSquare,
  Bot
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
          onClick={() => setIsAIAssistantOpen(true)}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#0F172A',
            border: '2px solid #F59E0B',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(15, 23, 42, 0.4)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title="Abrir Assistente CLAQ AI"
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <Bot size={22} color="#F59E0B" />
        </button>

        <button
          onClick={() => setIsWhatsAppModalOpen(true)}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            border: '2px solid #FFFFFF',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title="WhatsApp Fiscal Directo"
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <MessageSquare size={22} />
        </button>
      </div>

      {/* Dynamic Toast Notification Stack */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            onClick={() => removeToast(toast.id)}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ marginTop: '2px' }}>
              {toast.type === 'success' && <CheckCircle2 size={18} color="var(--emerald-500)" />}
              {toast.type === 'warning' && <AlertTriangle size={18} color="var(--gold-500)" />}
              {toast.type === 'info' && <Info size={18} color="var(--blue-500)" />}
              {toast.type === 'error' && <XCircle size={18} color="var(--red-500)" />}
            </div>

            <div style={{ flex: 1 }}>
              <h5 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-900)' }}>
                {toast.title}
              </h5>
              <p style={{ fontSize: '12px', color: 'var(--slate-600)', marginTop: '2px', lineHeight: 1.4 }}>
                {toast.message}
              </p>
            </div>

            <button
              onClick={e => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--slate-400)',
                cursor: 'pointer',
                padding: '2px'
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
