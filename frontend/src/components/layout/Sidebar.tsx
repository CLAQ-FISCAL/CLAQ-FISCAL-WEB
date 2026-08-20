import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Bell,
  Calculator,
  FileSpreadsheet,
  BookOpen,
  Users,
  Mail,
  Settings,
  HelpCircle,
  Crown,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ClaqLogo } from '../common/ClaqLogo';
import { useAppState } from '../../context/AppStateContext';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  collapsed = false
}) => {
  const { unreadAlertsCount, setIsAIAssistantOpen } = useAppState();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/calendario', label: 'Calendário Fiscal', icon: Calendar },
    { path: '/alertas', label: 'Alertas', icon: Bell, badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined },
    { path: '/biblioteca-legal', label: 'Biblioteca Legal', icon: BookOpen },
    { path: '/simuladores', label: 'Simuladores', icon: Calculator },
    { path: '/relatorios', label: 'Relatórios', icon: FileSpreadsheet },
    { path: '/clientes', label: 'Meus Clientes', icon: Users },
    { path: '/newsletter', label: 'Newsletter', icon: Mail },
    { path: '/configuracoes', label: 'Configurações', icon: Settings },
    { path: '/suporte', label: 'Ajuda e Suporte', icon: HelpCircle }
  ];

  return (
    <aside
      className="sidebar"
      style={{
        width: collapsed ? '80px' : '264px',
        backgroundColor: '#0B132B',
        color: '#94A3B8',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255, 255, 255, 0.07)',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '24px 20px 20px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          cursor: 'pointer'
        }}
        onClick={() => onNavigate('/dashboard')}
      >
        <ClaqLogo variant="dark" size={collapsed ? 'sm' : 'md'} showSubtitle={!collapsed} />
      </div>

      {/* Navigation List */}
      <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path));

          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: isActive ? '#2563EB' : 'transparent',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13.5px',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                textAlign: 'left'
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#94A3B8';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={18} strokeWidth={isActive ? 2.3 : 1.9} color={isActive ? '#FFFFFF' : '#94A3B8'} />
                {!collapsed && <span>{item.label}</span>}
              </div>

              {!collapsed && item.badge !== undefined && (
                <span
                  style={{
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '999px',
                    lineHeight: 1
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Upgrade Card / Support Card */}
      {!collapsed && (
        <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* AI Helper Quick Action */}
          <button
            onClick={() => setIsAIAssistantOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '10px 12px',
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              border: '1px solid rgba(37, 99, 235, 0.3)',
              borderRadius: '10px',
              color: '#60A5FA',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.12)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={15} color="#60A5FA" />
              <span>Assistente Fiscal AI</span>
            </div>
            <ChevronRight size={14} />
          </button>

          {/* Seja Premium Card */}
          <div
            style={{
              background: 'linear-gradient(180deg, #111E3E 0%, #0F172A 100%)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '12px',
              padding: '16px 14px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px auto'
              }}
            >
              <Crown size={19} color="#F59E0B" />
            </div>
            <h4 style={{ color: '#FFFFFF', fontSize: '13.5px', fontWeight: 700, marginBottom: '4px' }}>
              Seja Premium
            </h4>
            <p style={{ color: '#94A3B8', fontSize: '11.5px', lineHeight: 1.4, marginBottom: '12px' }}>
              Tenha acesso a todos os recursos, integrações e alertas em tempo real.
            </p>
            <button
              onClick={() => onNavigate('/configuracoes')}
              className="btn btn-primary-gold"
              style={{ width: '100%', padding: '8px 12px', fontSize: '12.5px', borderRadius: '8px' }}
            >
              Upgrade Agora
            </button>
          </div>

          {/* Footer Copyright */}
          <div style={{ padding: '4px 6px', textAlign: 'center' }}>
            <p style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>
              CLAQ CONSULTORES, LDA
            </p>
            <p style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>
              Transformamos obrigação em tranquilidade.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
};
