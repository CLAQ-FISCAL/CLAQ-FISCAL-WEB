import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  MessageSquare,
  HelpCircle,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Building2,
  CheckCircle2,
  ExternalLink,
  Shield
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../../context/AppStateContext';
import { LanguageToggle } from '../../i18n/LanguageToggle';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNavigate: (path: string) => void;
  currentPath: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onNavigate,
  currentPath
}) => {
  const { t } = useTranslation();
  const {
    user,
    logout,
    alerts,
    unreadAlertsCount,
    markAllAlertsAsRead,
    markAlertAsRead,
    settings,
    setIsWhatsAppModalOpen,
    clients,
    activeClient,
    setActiveClient
  } = useAppState();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isCompanySelectOpen, setIsCompanySelectOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const profileRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);
  const companyRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
        setIsAlertsOpen(false);
      }
      if (companyRef.current && !companyRef.current.contains(e.target as Node)) {
        setIsCompanySelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    if (currentPath.startsWith('/simuladores')) return t('header:pageTitleSimuladores');
    if (currentPath === '/calendario') return t('header:pageTitleCalendario');
    if (currentPath === '/alertas') return t('header:pageTitleAlertas');
    if (currentPath === '/biblioteca-legal') return t('header:pageTitleBiblioteca');
    if (currentPath === '/relatorios') return t('header:pageTitleRelatorios');
    if (currentPath === '/clientes') return t('header:pageTitleClientes');
    if (currentPath === '/newsletter') return t('header:pageTitleNewsletter');
    if (currentPath === '/configuracoes') return t('header:pageTitleConfig');
    if (currentPath === '/suporte') return t('header:pageTitleSuporte');
    return t('header:pageTitleDashboard');
  };

  return (
    <header
      className="header"
      style={{
        height: '68px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--slate-200)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)'
      }}
    >
      {/* Left side: Hamburger toggle + Current Company / Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onToggleSidebar}
          className="btn btn-ghost"
          style={{ padding: '8px', borderRadius: '8px', color: 'var(--slate-600)' }}
          title={t('header:toggleMenu')}
        >
          <Menu size={20} />
        </button>

        {/* Company Switcher Dropdown */}
        <div style={{ position: 'relative' }} ref={companyRef}>
          <button
            onClick={() => setIsCompanySelectOpen(!isCompanySelectOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--slate-50)',
              border: '1px solid var(--slate-200)',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13.5px',
              fontWeight: 600,
              color: 'var(--slate-800)',
              transition: 'background 0.15s ease'
            }}
          >
            <Building2 size={16} color="var(--gold-600)" />
            <span>{activeClient ? activeClient.name : (user?.companyName || t('header:companyDefault'))}</span>
            <ChevronDown size={14} color="var(--slate-400)" />
          </button>

          {isCompanySelectOpen && (
            <div
              style={{
                position: 'absolute',
                top: '115%',
                left: 0,
                width: '260px',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--slate-200)',
                padding: '8px',
                zIndex: 50
              }}
            >
              <div style={{ padding: '6px 8px', fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase' }}>
                {t('header:companySwitchTitle')}
              </div>
              <button
                onClick={() => {
                  setActiveClient(null);
                  setIsCompanySelectOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: !activeClient ? 'var(--blue-50)' : 'transparent',
                  color: !activeClient ? 'var(--blue-600)' : 'var(--slate-700)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span>{user?.companyName || t('header:companySwitchItem')}</span>
                {!activeClient && <CheckCircle2 size={15} color="var(--blue-600)" />}
              </button>

              <div style={{ height: '1px', backgroundColor: 'var(--slate-100)', margin: '6px 0' }} />

              {clients.map(cli => (
                <button
                  key={cli.id}
                  onClick={() => {
                    setActiveClient(cli);
                    setIsCompanySelectOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: activeClient?.id === cli.id ? 'var(--blue-50)' : 'transparent',
                    color: activeClient?.id === cli.id ? 'var(--blue-600)' : 'var(--slate-700)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{cli.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--slate-400)' }}>{t('header:nuitLabel', { nuit: cli.nuit })}</span>
                  </div>
                  {activeClient?.id === cli.id && <CheckCircle2 size={15} color="var(--blue-600)" />}
                </button>
              ))}

              <div style={{ height: '1px', backgroundColor: 'var(--slate-100)', margin: '6px 0' }} />
              <button
                onClick={() => {
                  setIsCompanySelectOpen(false);
                  onNavigate('/clientes');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--gold-600)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <span>{t('header:manageAllClients')}</span>
                <ExternalLink size={13} />
              </button>
            </div>
          )}
        </div>

        <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--slate-200)' }} />
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--slate-700)' }}>
          {getPageTitle()}
        </span>
      </div>

      {/* Right side: Search, WhatsApp button, Help, Notifications, User profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Global Search Bar */}
        <div style={{ position: 'relative', width: '240px' }}>
          <Search
            size={16}
            color="var(--slate-400)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder={t('header:searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                onNavigate(`/biblioteca-legal?q=${encodeURIComponent(searchQuery)}`);
              }
            }}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              fontSize: '13px',
              borderRadius: '8px',
              border: '1px solid var(--slate-200)',
              backgroundColor: 'var(--slate-50)',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={e => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = 'var(--blue-600)';
            }}
            onBlur={e => {
              e.currentTarget.style.backgroundColor = 'var(--slate-50)';
              e.currentTarget.style.borderColor = 'var(--slate-200)';
            }}
          />
        </div>

        {/* Language Toggle */}
        <LanguageToggle variant="light" />

        {/* Conectar WhatsApp Button */}
        <button
          onClick={() => setIsWhatsAppModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '7px 14px',
            backgroundColor: settings.isWhatsAppConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(37, 99, 235, 0.08)',
            border: `1px solid ${settings.isWhatsAppConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(37, 99, 235, 0.2)'}`,
            borderRadius: '8px',
            color: settings.isWhatsAppConnected ? '#059669' : '#2563EB',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <MessageSquare size={16} color={settings.isWhatsAppConnected ? '#10B981' : '#2563EB'} />
          <span>{settings.isWhatsAppConnected ? t('header:whatsappActive') : t('header:whatsappConnect')}</span>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: settings.isWhatsAppConnected ? '#10B981' : '#F59E0B',
              display: 'inline-block'
            }}
          />
        </button>

        {/* Help icon */}
        <button
          onClick={() => onNavigate('/suporte')}
          className="btn btn-ghost"
          style={{ padding: '8px', borderRadius: '8px', color: 'var(--slate-500)' }}
          title={t('header:helpSupport')}
        >
          <HelpCircle size={19} />
        </button>

        {/* Notifications Bell */}
        <div style={{ position: 'relative' }} ref={alertsRef}>
          <button
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className="btn btn-ghost"
            style={{ padding: '8px', borderRadius: '8px', position: 'relative', color: 'var(--slate-500)' }}
            title={t('header:notificationsAlerts')}
          >
            <Bell size={19} />
            {unreadAlertsCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #FFFFFF'
                }}
              >
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Alerts Dropdown Panel */}
          {isAlertsOpen && (
            <div
              style={{
                position: 'absolute',
                top: '120%',
                right: 0,
                width: '360px',
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--slate-200)',
                zIndex: 60,
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--slate-100)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--slate-50)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={16} color="var(--blue-600)" />
                  <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--slate-900)' }}>
                    {t('header:fiscalNotifications')}
                  </span>
                </div>
                {unreadAlertsCount > 0 && (
                  <button
                    onClick={markAllAlertsAsRead}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--blue-600)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {t('header:markAsRead')}
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {alerts.slice(0, 4).map(alert => (
                  <div
                    key={alert.id}
                    onClick={() => {
                      markAlertAsRead(alert.id);
                      if (alert.actionUrl) onNavigate(alert.actionUrl);
                      setIsAlertsOpen(false);
                    }}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--slate-100)',
                      backgroundColor: alert.read ? '#FFFFFF' : '#F8FAFC',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = alert.read ? '#FFFFFF' : '#F8FAFC'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-900)' }}>
                        {alert.title}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: alert.severity === 'critical' ? 'var(--red-600)' : alert.severity === 'warning' ? 'var(--gold-700)' : 'var(--blue-600)'
                        }}
                      >
                        {alert.daysRemaining <= 0
                          ? t('header:dueToday')
                          : t('header:dueInXDays', { count: alert.daysRemaining })}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--slate-600)', lineHeight: 1.4 }}>
                      {alert.message}
                    </p>
                  </div>
                ))}
              </div>

              <div
                style={{
                  padding: '10px 16px',
                  textAlign: 'center',
                  backgroundColor: 'var(--slate-50)',
                  borderTop: '1px solid var(--slate-100)'
                }}
              >
                <button
                  onClick={() => {
                    setIsAlertsOpen(false);
                    onNavigate('/alertas');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--blue-600)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {t('header:viewAllAlerts')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'transparent',
              border: '1px solid transparent',
              padding: '4px 6px',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--slate-100)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name || t('header:userFallback')}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #FFFFFF',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--slate-900)' }}>
                {user?.name || t('header:userFallback')}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--slate-500)', fontWeight: 500 }}>
                {t('header:planLabel', { plan: user?.plan || 'PME' })}
              </span>
            </div>
            <ChevronDown size={14} color="var(--slate-400)" />
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div
              style={{
                position: 'absolute',
                top: '120%',
                right: 0,
                width: '240px',
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--slate-200)',
                padding: '8px',
                zIndex: 60
              }}
            >
              <div style={{ padding: '8px 12px 10px 12px', borderBottom: '1px solid var(--slate-100)' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-900)' }}>{user?.name}</p>
                <p style={{ fontSize: '11.5px', color: 'var(--slate-500)' }}>{user?.email}</p>
                <div style={{ marginTop: '6px', display: 'flex', gap: '6px' }}>
                  <span className="badge badge-amber" style={{ fontSize: '10px' }}>
                    {t('header:planLabel', { plan: user?.plan })}
                  </span>
                  <span className="badge badge-green" style={{ fontSize: '10px' }}>
                    {t('header:activeBadge')}
                  </span>
                </div>
              </div>

              <div style={{ padding: '6px 0' }}>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigate('/configuracoes');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--slate-700)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--slate-50)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <User size={16} />
                  <span>{t('header:myProfile')}</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigate('/configuracoes');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--slate-700)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--slate-50)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <Settings size={16} />
                  <span>{t('header:settings')}</span>
                </button>
              </div>

              <div style={{ borderTop: '1px solid var(--slate-100)', paddingTop: '6px' }}>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                    onNavigate('/login');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--red-600)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--red-50)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <LogOut size={16} />
                  <span>{t('header:logout')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
