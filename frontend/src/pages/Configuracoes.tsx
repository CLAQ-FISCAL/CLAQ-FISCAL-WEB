import React, { useState } from 'react';
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Sliders,
  Smartphone,
  Mail,
  CheckCircle2,
  Lock,
  Building,
  Key,
  Database,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';

export const Configuracoes: React.FC = () => {
  const {
    user,
    updateUser,
    settings,
    updateSettings,
    toggleNotificationChannel,
    toggleAlertTiming,
    addToast
  } = useAppState();

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'alerts' | 'security' | 'plan' | 'integrations'>('preferences');

  // Profile fields state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [role, setRole] = useState(user?.role || 'Administrador');
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [companyNuit, setCompanyNuit] = useState(user?.companyNuit || '');
  const [companyAddress, setCompanyAddress] = useState(user?.companyAddress || '');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name,
      email,
      phone,
      role,
      companyName,
      companyNuit,
      companyAddress
    });
  };

  const handleSavePreferences = () => {
    addToast('success', 'Preferências Salvas!', 'As configurações de alerta e notificação foram actualizadas.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>
          Configurações
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--slate-500)', marginTop: '2px' }}>
          Personalize a sua conta, preferências de notificação e integrações de sistema.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="card" style={{ padding: '0 20px', display: 'flex', gap: '8px', borderBottom: '1px solid var(--slate-200)', overflowX: 'auto' }}>
        {[
          { id: 'profile', label: 'Perfil', icon: User },
          { id: 'preferences', label: 'Preferências', icon: Sliders },
          { id: 'alerts', label: 'Alertas', icon: Bell },
          { id: 'security', label: 'Segurança', icon: Shield },
          { id: 'plan', label: 'Assinatura & Plano', icon: CreditCard },
          { id: 'integrations', label: 'Integrações', icon: Database }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '14px 18px',
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: '13.5px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--blue-600)' : 'var(--slate-600)',
                borderBottom: `2.5px solid ${isActive ? 'var(--blue-600)' : 'transparent'}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} color={isActive ? 'var(--blue-600)' : 'var(--slate-400)'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: PREFERÊNCIAS (Matching Screenshot 7) */}
      {activeTab === 'preferences' && (
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '36px' }}>
            {/* Left: Preferências de Notificação */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '6px' }}>
                Preferências de Notificação
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginBottom: '20px' }}>
                Escolha como deseja receber os seus alertas fiscais e lembretes de prazos.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* E-mail Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: 'var(--slate-50)', borderRadius: '12px', border: '1px solid var(--slate-200)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Mail size={18} color="var(--blue-600)" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-800)' }}>E-mail</h4>
                      <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>Receber alertas por e-mail ({user?.email})</p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={settings.notifications.email}
                    onChange={() => toggleNotificationChannel('email')}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--blue-600)', cursor: 'pointer' }}
                  />
                </div>

                {/* WhatsApp Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: 'var(--slate-50)', borderRadius: '12px', border: '1px solid var(--slate-200)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MessageSquare size={18} color="#10B981" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-800)' }}>WhatsApp</h4>
                      <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>Receber alertas no WhatsApp (+258 84 123 4567)</p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={settings.notifications.whatsapp}
                    onChange={() => toggleNotificationChannel('whatsapp')}
                    style={{ width: '20px', height: '20px', accentColor: '#10B981', cursor: 'pointer' }}
                  />
                </div>

                {/* System Notifications Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: 'var(--slate-50)', borderRadius: '12px', border: '1px solid var(--slate-200)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FAF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bell size={18} color="#7E22CE" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-800)' }}>Notificações no Sistema</h4>
                      <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>Receber notificações dentro da plataforma</p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={settings.notifications.inApp}
                    onChange={() => toggleNotificationChannel('inApp')}
                    style={{ width: '20px', height: '20px', accentColor: '#7E22CE', cursor: 'pointer' }}
                  />
                </div>

                {/* SMS Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: 'var(--slate-50)', borderRadius: '12px', border: '1px solid var(--slate-200)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--slate-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Smartphone size={18} color="var(--slate-600)" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-800)' }}>SMS</h4>
                      <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>Receber alertas por SMS no telemóvel</p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={settings.notifications.sms}
                    onChange={() => toggleNotificationChannel('sms')}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--blue-600)', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Antecedência dos Alertas */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '6px' }}>
                Antecedência dos Alertas
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginBottom: '20px' }}>
                Defina com quantos dias de antecedência deseja receber os lembretes.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--slate-50)', padding: '20px', borderRadius: '12px', border: '1px solid var(--slate-200)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: 'var(--slate-800)', cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={settings.alertTiming.d7}
                    onChange={() => toggleAlertTiming('d7')}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--blue-600)' }}
                  />
                  <span>7 dias antes</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: 'var(--slate-800)', cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={settings.alertTiming.d3}
                    onChange={() => toggleAlertTiming('d3')}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--blue-600)' }}
                  />
                  <span>3 dias antes</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: 'var(--slate-800)', cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={settings.alertTiming.d1}
                    onChange={() => toggleAlertTiming('d1')}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--blue-600)' }}
                  />
                  <span>1 dia antes</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: 'var(--slate-800)', cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={settings.alertTiming.d0}
                    onChange={() => toggleAlertTiming('d0')}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--blue-600)' }}
                  />
                  <span>No dia do vencimento</span>
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px' }}>
            <button onClick={handleSavePreferences} className="btn btn-primary-gold btn-lg">
              <CheckCircle2 size={18} />
              <span>Salvar Preferências</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PERFIL & DADOS PESSOAIS */}
      {activeTab === 'profile' && (
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '24px' }}>
            Meu Perfil & Informações da Empresa
          </h2>

          <form onSubmit={handleSaveProfile}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={name}
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #FFFFFF', boxShadow: 'var(--shadow-md)' }}
              />
              <div>
                <button
                  type="button"
                  onClick={() => addToast('info', 'Foto', 'Funcionalidade de upload de fotografia activada.')}
                  className="btn btn-secondary btn-sm"
                >
                  Alterar Foto
                </button>
                <p style={{ fontSize: '11.5px', color: 'var(--slate-400)', marginTop: '4px' }}>
                  Formatos aceites: JPG, PNG ou WebP. Máximo 2MB.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input type="text" className="form-control" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Função / Cargo</label>
                <input type="text" className="form-control" value={role} onChange={e => setRole(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Nome da Empresa</label>
                <input type="text" className="form-control" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">NUIT da Empresa</label>
                <input type="text" className="form-control" value={companyNuit} onChange={e => setCompanyNuit(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary-gold btn-lg">
                <span>Salvar Alterações</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB CONTENT: ASSINATURA & PLANO */}
      {activeTab === 'plan' && (
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '20px' }}>
            Plano & Faturação
          </h2>

          <div style={{ padding: '24px', backgroundColor: 'var(--slate-50)', borderRadius: '14px', border: '1px solid var(--slate-200)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="badge badge-amber" style={{ fontSize: '11px', marginBottom: '6px' }}>
                  Plano PME Activo
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--slate-900)' }}>
                  CLAQ Fiscal Alert Pro PME
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginTop: '2px' }}>
                  Próxima renovação em 15/12/2026 • Faturação anual
                </p>
              </div>

              <button className="btn btn-primary-gold">
                Fazer Upgrade para Enterprise
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: INTEGRAÇÕES */}
      {activeTab === 'integrations' && (
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '20px' }}>
            Integrações de Software
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', border: '1px solid var(--slate-200)' }}>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-800)' }}>WhatsApp Business Cloud API</h4>
                <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>Envio automático de alertas fiscais para clientes e contabilistas.</p>
              </div>
              <span className="badge badge-green">Conectado ✓</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', border: '1px solid var(--slate-200)' }}>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-800)' }}>Autoridade Tributária (e-Tributação)</h4>
                <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>Sincronização de guias e certidão de quitação fiscal.</p>
              </div>
              <span className="badge badge-green">Activo ✓</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', border: '1px solid var(--slate-200)' }}>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-800)' }}>ERP Primavera / PHC / Moloni</h4>
                <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>Exportação de ficheiro SAF-T MZ e memórias de cálculo.</p>
              </div>
              <button className="btn btn-secondary btn-sm">Configurar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
