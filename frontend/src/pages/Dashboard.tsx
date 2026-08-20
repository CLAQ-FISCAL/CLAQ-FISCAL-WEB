import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Users,
  FileText,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  AlertTriangle,
  Info,
  Clock,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Calculator,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Percent,
  Briefcase,
  Layers
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { INITIAL_NEWS } from '../data/initialData';

interface DashboardProps {
  onNavigate: (path: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const {
    user,
    obligations,
    alerts,
    unreadAlertsCount,
    setIsWhatsAppModalOpen,
    setIsAIAssistantOpen,
    openAIAssistantWithPrompt
  } = useAppState();

  const [selectedCalDate, setSelectedCalDate] = useState<number | null>(30);

  // June 2026 Calendar Grid Days:
  // In June 2026, June 1 is a Monday (SEG).
  const calendarDays = [
    { day: 22, isCurrentMonth: false },
    { day: 23, isCurrentMonth: false },
    { day: 24, isCurrentMonth: false },
    { day: 25, isCurrentMonth: false },
    { day: 26, isCurrentMonth: false },
    { day: 27, isCurrentMonth: false },
    { day: 28, isCurrentMonth: false },
    { day: 29, isCurrentMonth: false },
    { day: 30, isCurrentMonth: true, hasTax: 'IVA', badgeColor: '#2563EB' },
    { day: 1, isCurrentMonth: true },
    { day: 2, isCurrentMonth: true },
    { day: 3, isCurrentMonth: true },
    { day: 4, isCurrentMonth: true },
    { day: 5, isCurrentMonth: true },
    { day: 6, isCurrentMonth: true },
    { day: 7, isCurrentMonth: true },
    { day: 8, isCurrentMonth: true },
    { day: 9, isCurrentMonth: true },
    { day: 10, isCurrentMonth: true, hasTax: 'INSS', badgeColor: '#F59E0B' },
    { day: 11, isCurrentMonth: true },
    { day: 12, isCurrentMonth: true },
    { day: 13, isCurrentMonth: true },
    { day: 14, isCurrentMonth: true },
    { day: 15, isCurrentMonth: true },
    { day: 16, isCurrentMonth: true },
    { day: 17, isCurrentMonth: true },
    { day: 18, isCurrentMonth: true },
    { day: 19, isCurrentMonth: true },
    { day: 20, isCurrentMonth: true, hasTax: 'TAE', badgeColor: '#10B981' }
  ];

  const simulatorCards = [
    { id: 'iva', label: 'IVA', color: '#9333EA', bg: '#FAF5FF', path: '/simuladores' },
    { id: 'irps', label: 'IRPS', color: '#059669', bg: '#ECFDF5', path: '/simuladores' },
    { id: 'inss', label: 'INSS', color: '#D97706', bg: '#FFFBEB', path: '/simuladores' },
    { id: 'salario', label: 'Salário Líquido', color: '#2563EB', bg: '#EFF6FF', path: '/simuladores' },
    { id: 'multas', label: 'Multas', color: '#DC2626', bg: '#FEF2F2', path: '/simuladores' },
    { id: 'custo', label: 'Custo do Trabalhador', color: '#0D9488', bg: '#F0FDFA', path: '/simuladores' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Welcome Title */}
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--slate-900)' }}>
          Olá, {user?.name || 'Carlos Apollo'}! 👋
        </h1>
        <p style={{ fontSize: '14.5px', color: 'var(--slate-500)', marginTop: '4px' }}>
          Aqui está o resumo das suas obrigações fiscais, laborais e alertas para Junho de 2026.
        </p>
      </div>

      {/* 4 Metric KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
        {/* Metric 1: Próxima Obrigação */}
        <div
          className="card card-hover"
          style={{
            padding: '20px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderLeft: '4px solid var(--red-500)',
            cursor: 'pointer'
          }}
          onClick={() => onNavigate('/calendario')}
        >
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Próxima Obrigação
            </span>
            <p style={{ fontSize: '13.5px', color: 'var(--slate-700)', fontWeight: 600, marginTop: '2px' }}>
              IVA - Junho/2026
            </p>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)', marginTop: '4px' }}>
              30/06/2026
            </h3>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--red-600)', marginTop: '2px', display: 'block' }}>
              Vence em 3 dias
            </span>
          </div>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'var(--blue-50)',
              border: '1px solid var(--blue-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CalendarIcon size={22} color="var(--blue-600)" />
          </div>
        </div>

        {/* Metric 2: INSS */}
        <div
          className="card card-hover"
          style={{
            padding: '20px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
          onClick={() => onNavigate('/calendario')}
        >
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              INSS (Junho/2026)
            </span>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)', marginTop: '8px' }}>
              10/07/2026
            </h3>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gold-700)', marginTop: '2px', display: 'block' }}>
              Vence em 8 dias
            </span>
          </div>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'var(--emerald-50)',
              border: '1px solid var(--emerald-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Users size={22} color="var(--emerald-600)" />
          </div>
        </div>

        {/* Metric 3: Licenças */}
        <div
          className="card card-hover"
          style={{
            padding: '20px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
          onClick={() => onNavigate('/calendario')}
        >
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Licenças
            </span>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)', marginTop: '8px' }}>
              2 a renovar
            </h3>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', marginTop: '2px', display: 'block' }}>
              Este mês
            </span>
          </div>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'var(--gold-50)',
              border: '1px solid var(--gold-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FileText size={22} color="var(--gold-600)" />
          </div>
        </div>

        {/* Metric 4: Situação Fiscal */}
        <div
          className="card card-hover"
          style={{
            padding: '20px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
          onClick={() => onNavigate('/relatorios')}
        >
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Situação Fiscal
            </span>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--emerald-600)', marginTop: '8px' }}>
              Regular
            </h3>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--emerald-600)', marginTop: '2px', display: 'block' }}>
              Sem pendências
            </span>
          </div>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'var(--emerald-50)',
              border: '1px solid var(--emerald-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShieldCheck size={22} color="var(--emerald-600)" />
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT (65% Left / 35% Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '24px' }}>
        
        {/* LEFT COLUMN: Mini Calendar, Simuladores Quick Grid & WhatsApp Banner */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Mini Calendar June 2026 */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CalendarIcon size={18} color="var(--blue-600)" />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--slate-900)' }}>
                    CALENDÁRIO FISCAL
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--slate-100)', padding: '4px 8px', borderRadius: '8px' }}>
                  <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--slate-600)', display: 'flex' }}>
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-800)', minWidth: '85px', textAlign: 'center' }}>
                    Junho 2026
                  </span>
                  <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--slate-600)', display: 'flex' }}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <button
                onClick={() => onNavigate('/calendario')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--blue-600)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Ver calendário completo →
              </button>
            </div>

            {/* Days Grid Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', marginBottom: '10px' }}>
              {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map((dayName, idx) => (
                <span key={idx} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)' }}>
                  {dayName}
                </span>
              ))}
            </div>

            {/* Days Grid Cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center' }}>
              {calendarDays.map((cDay, idx) => {
                const isSelected = selectedCalDate === cDay.day && cDay.isCurrentMonth;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (cDay.isCurrentMonth) setSelectedCalDate(cDay.day);
                    }}
                    style={{
                      height: '52px',
                      borderRadius: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isSelected ? 'var(--blue-50)' : 'transparent',
                      border: isSelected ? '1.5px solid var(--blue-600)' : '1px solid transparent',
                      cursor: cDay.isCurrentMonth ? 'pointer' : 'default',
                      opacity: cDay.isCurrentMonth ? 1 : 0.4,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '13.5px',
                        fontWeight: isSelected || cDay.hasTax ? 700 : 500,
                        color: isSelected ? 'var(--blue-600)' : cDay.hasTax ? '#FFFFFF' : 'var(--slate-700)',
                        backgroundColor: cDay.hasTax ? cDay.badgeColor : 'transparent',
                        width: cDay.hasTax ? '26px' : 'auto',
                        height: cDay.hasTax ? '26px' : 'auto',
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {cDay.day}
                    </span>
                    {cDay.hasTax && (
                      <span style={{ fontSize: '9px', fontWeight: 700, color: cDay.badgeColor, marginTop: '2px' }}>
                        • {cDay.hasTax}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SIMULADORES Quick Grid */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-900)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Simuladores Fiscais & Laborais
              </h3>
              <button
                onClick={() => onNavigate('/simuladores')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--blue-600)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Abrir centro completo →
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              {simulatorCards.map(sim => (
                <div
                  key={sim.id}
                  onClick={() => onNavigate(sim.path)}
                  className="card card-hover"
                  style={{
                    padding: '16px 12px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: '12px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--slate-200)'
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: sim.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 8px auto'
                    }}
                  >
                    <Calculator size={20} color={sim.color} />
                  </div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-800)', lineHeight: 1.2 }}>
                    {sim.label}
                  </h4>
                  <span style={{ fontSize: '11px', color: 'var(--slate-400)', marginTop: '4px', display: 'block' }}>
                    Simular
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp Callout Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', zIndex: 2 }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  backgroundColor: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  flexShrink: 0
                }}
              >
                <MessageSquare size={26} color="#FFFFFF" />
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#1E3A8A' }}>
                  Receba alertas no WhatsApp!
                </h4>
                <p style={{ fontSize: '13px', color: '#1E40AF', marginTop: '2px', maxWidth: '420px', lineHeight: 1.4 }}>
                  Conecte o seu WhatsApp e receba lembretes automáticos sobre todas as suas obrigações fiscais antes dos prazos.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="btn btn-primary-blue"
              style={{ zIndex: 2, borderRadius: '10px', padding: '10px 18px', fontSize: '13.5px' }}
            >
              Conectar agora
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Alertas Importantes, Notícias & Resumo de Conformidade */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* ALERTAS IMPORTANTES */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--slate-900)', letterSpacing: '0.04em' }}>
                ALERTAS IMPORTANTES
              </h3>
              <button
                onClick={() => onNavigate('/alertas')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--blue-600)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Ver todos →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Critical Alert 1 */}
              <div
                onClick={() => onNavigate('/calendario')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--red-50)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={18} color="var(--red-600)" />
                  <div>
                    <h5 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--red-600)' }}>
                      IVA - Junho/2026
                    </h5>
                    <p style={{ fontSize: '11.5px', color: '#991B1B' }}>
                      Vence em 3 dias (30/06/2026)
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--red-600)" />
              </div>

              {/* Warning Alert 2 */}
              <div
                onClick={() => onNavigate('/calendario')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--gold-50)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={18} color="var(--gold-600)" />
                  <div>
                    <h5 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold-700)' }}>
                      INSS - Junho/2026
                    </h5>
                    <p style={{ fontSize: '11.5px', color: '#92400E' }}>
                      Vence em 8 dias (10/07/2026)
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--gold-600)" />
              </div>

              {/* Info Alert 3 */}
              <div
                onClick={() => onNavigate('/calendario')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--blue-50)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Info size={18} color="var(--blue-600)" />
                  <div>
                    <h5 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--blue-600)' }}>
                      TAE Municipal
                    </h5>
                    <p style={{ fontSize: '11.5px', color: '#1E40AF' }}>
                      Vence em 20 dias (20/07/2026)
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--blue-600)" />
              </div>

              {/* Info Alert 4 */}
              <div
                onClick={() => onNavigate('/calendario')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#FAF5FF',
                  border: '1px solid rgba(126, 34, 206, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={18} color="#7E22CE" />
                  <div>
                    <h5 style={{ fontSize: '13px', fontWeight: 700, color: '#7E22CE' }}>
                      Alvará Comercial
                    </h5>
                    <p style={{ fontSize: '11.5px', color: '#6B21A8' }}>
                      Renovação em 45 dias (15/08/2026)
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} color="#7E22CE" />
              </div>
            </div>
          </div>

          {/* ÚLTIMAS NOTÍCIAS FISCAIS */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--slate-900)', letterSpacing: '0.04em' }}>
                ÚLTIMAS NOTÍCIAS FISCAIS
              </h3>
              <button
                onClick={() => onNavigate('/newsletter')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--blue-600)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Ver todas →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {INITIAL_NEWS.slice(0, 4).map(news => (
                <div
                  key={news.id}
                  onClick={() => onNavigate('/newsletter')}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      backgroundColor: news.badgeType === 'blue' ? 'var(--blue-50)' : news.badgeType === 'green' ? 'var(--emerald-50)' : news.badgeType === 'purple' ? '#FAF5FF' : 'var(--gold-50)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <FileText size={16} color={news.badgeType === 'blue' ? 'var(--blue-600)' : news.badgeType === 'green' ? 'var(--emerald-600)' : news.badgeType === 'purple' ? '#7E22CE' : 'var(--gold-600)'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <h5 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-800)', lineHeight: 1.3 }}>
                        {news.title}
                      </h5>
                      <span style={{ fontSize: '11px', color: 'var(--slate-400)', whiteSpace: 'nowrap', marginLeft: '6px' }}>
                        {news.date}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '2px', lineHeight: 1.4 }}>
                      {news.summary}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RESUMO DE CONFORMIDADE (Donut Chart 85%) */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--slate-900)', letterSpacing: '0.04em' }}>
                RESUMO DE CONFORMIDADE
              </h3>
              <button
                onClick={() => onNavigate('/relatorios')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--blue-600)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Ver relatório completo →
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {/* Circular SVG Donut Chart showing 85% */}
              <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  {/* Background Circle */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="3.8"
                  />
                  {/* Active 85% Emerald Progress */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3.8"
                    strokeDasharray="85, 100"
                    strokeLinecap="round"
                  />
                </svg>
                {/* Center Percentage Label */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--slate-900)', lineHeight: 1 }}>
                    85%
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--slate-500)', fontWeight: 600, marginTop: '2px' }}>
                    Conformidade
                  </span>
                </div>
              </div>

              {/* Status Breakdown Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, fontSize: '12.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                    <span style={{ color: 'var(--slate-700)' }}>Em dia</span>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>12</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                    <span style={{ color: 'var(--slate-700)' }}>A vencer em breve</span>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>3</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                    <span style={{ color: 'var(--slate-700)' }}>Vencidas</span>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>0</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />
                    <span style={{ color: 'var(--slate-700)' }}>A renovar</span>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>2</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
