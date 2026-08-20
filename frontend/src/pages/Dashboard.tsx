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
  Layers,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { INITIAL_NEWS } from '../data/initialData';
import { CalendarEngine } from '../utils/calendarEngine';
import { formatMZN, formatDate } from '../utils/formatters';

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
    openAIAssistantWithPrompt,
    loadStandardMozambiqueTemplate
  } = useAppState();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();
  const currentMonthName = CalendarEngine.getMonthNamePt(currentMonthIndex, currentYear);

  const currentHour = now.getHours();
  const greeting = currentHour < 12 ? 'Bom dia' : currentHour < 18 ? 'Boa tarde' : 'Boa noite';

  const [selectedCalDate, setSelectedCalDate] = useState<string>(CalendarEngine.formatDateYMD(now));

  // Dynamic Month Grid for current live month
  const calendarDays = CalendarEngine.getMonthGrid(currentYear, currentMonthIndex);

  // Dynamic KPIs
  const activeObligations = obligations.filter(o => o.status !== 'pago');
  const paidObligations = obligations.filter(o => o.status === 'pago');
  const overdueObligations = activeObligations.filter(o => CalendarEngine.getDaysRemaining(o.dueDate) < 0);

  const nextObligation = [...activeObligations].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  const inssObligation = obligations.find(o => o.category === 'INSS');
  const licensesCount = obligations.filter(o => o.category === 'Alvara' || o.category === 'TAE').length;

  const totalCount = obligations.length;
  const complianceRate = totalCount === 0 ? 100 : Math.round((paidObligations.length / totalCount) * 100);
  const isFiscalRegular = overdueObligations.length === 0;

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--slate-900)' }}>
            {greeting}, {user?.name || 'Utilizador'}! 👋
          </h1>
          <p style={{ fontSize: '14.5px', color: 'var(--slate-500)', marginTop: '4px' }}>
            Aqui está o resumo das suas obrigações fiscais, laborais e alertas para <strong>{currentMonthName}</strong>.
          </p>
        </div>

        {obligations.length === 0 && (
          <button
            onClick={loadStandardMozambiqueTemplate}
            className="btn btn-primary-gold"
            style={{ padding: '9px 16px', fontSize: '13px' }}
          >
            <RefreshCw size={15} />
            <span>Carregar Modelo Padrão de Moçambique</span>
          </button>
        )}
      </div>

      {/* 4 Metric KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
        {/* Card 1: Next Obligation */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--blue-500)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--slate-400)' }}>
                PRÓXIMA OBRIGAÇÃO
              </p>
              <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--slate-800)', marginTop: '4px' }}>
                {nextObligation ? nextObligation.title : 'Nenhuma pendente'}
              </h4>
              <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--slate-900)', marginTop: '8px' }}>
                {nextObligation ? formatDate(nextObligation.dueDate) : 'Tudo em dia'}
              </p>
              {nextObligation && (
                <span
                  className="badge"
                  style={{
                    marginTop: '8px',
                    backgroundColor: CalendarEngine.getDaysRemaining(nextObligation.dueDate) <= 3 ? '#FEF2F2' : '#EFF6FF',
                    color: CalendarEngine.getDaysRemaining(nextObligation.dueDate) <= 3 ? '#DC2626' : '#2563EB'
                  }}
                >
                  {CalendarEngine.getDaysRemaining(nextObligation.dueDate) < 0
                    ? `Venceu há ${Math.abs(CalendarEngine.getDaysRemaining(nextObligation.dueDate))} dias`
                    : `Vence em ${CalendarEngine.getDaysRemaining(nextObligation.dueDate)} dias`}
                </span>
              )}
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarIcon size={20} color="var(--blue-600)" />
            </div>
          </div>
        </div>

        {/* Card 2: INSS */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--gold-500)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--slate-400)' }}>
                INSS ({currentMonthName.split(' ')[0].toUpperCase()})
              </p>
              <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--slate-800)', marginTop: '4px' }}>
                {inssObligation ? `${formatMZN(inssObligation.amount)}` : 'Folha Mensal'}
              </h4>
              <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--slate-900)', marginTop: '8px' }}>
                {inssObligation ? formatDate(inssObligation.dueDate) : 'Regular'}
              </p>
              <span
                className="badge"
                style={{
                  marginTop: '8px',
                  backgroundColor: inssObligation?.status === 'pago' ? '#ECFDF5' : '#FFFBEB',
                  color: inssObligation?.status === 'pago' ? '#059669' : '#D97706'
                }}
              >
                {inssObligation?.status === 'pago' ? 'Liquidado' : inssObligation ? `Vence em ${CalendarEngine.getDaysRemaining(inssObligation.dueDate)} dias` : 'Em Dia'}
              </span>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--gold-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} color="var(--gold-600)" />
            </div>
          </div>
        </div>

        {/* Card 3: Licenças */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--purple-500)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--slate-400)' }}>
                LICENÇAS & TAXAS
              </p>
              <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--slate-800)', marginTop: '4px' }}>
                TAE / Alvará Comercial
              </h4>
              <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--slate-900)', marginTop: '8px' }}>
                {licensesCount > 0 ? `${licensesCount} registadas` : 'Sem pendências'}
              </p>
              <span className="badge" style={{ marginTop: '8px', backgroundColor: '#FAF5FF', color: '#7E22CE' }}>
                Conformidade Municipal
              </span>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FAF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} color="#9333EA" />
            </div>
          </div>
        </div>

        {/* Card 4: Situação Fiscal */}
        <div className="card" style={{ padding: '20px', borderLeft: isFiscalRegular ? '4px solid var(--emerald-500)' : '4px solid var(--red-500)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--slate-400)' }}>
                SITUAÇÃO FISCAL
              </p>
              <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--slate-800)', marginTop: '4px' }}>
                {user?.companyName || 'Empresa'}
              </h4>
              <p style={{ fontSize: '22px', fontWeight: 800, color: isFiscalRegular ? '#059669' : '#DC2626', marginTop: '8px' }}>
                {isFiscalRegular ? 'Regular' : 'Atenção'}
              </p>
              <span
                className="badge"
                style={{
                  marginTop: '8px',
                  backgroundColor: isFiscalRegular ? '#ECFDF5' : '#FEF2F2',
                  color: isFiscalRegular ? '#059669' : '#DC2626'
                }}
              >
                {isFiscalRegular ? 'Sem multas ou atrasos' : `${overdueObligations.length} obrigações em atraso`}
              </span>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: isFiscalRegular ? '#ECFDF5' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={20} color={isFiscalRegular ? '#10B981' : '#EF4444'} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Row: Live Mini Calendar & Alertas Importantes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        {/* Left: Dynamic Mini Calendar */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CalendarIcon size={20} color="var(--blue-600)" />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)' }}>
                Calendário Fiscal – {currentMonthName}
              </h3>
            </div>

            <button
              onClick={() => onNavigate('/calendario')}
              className="btn-text"
              style={{ fontSize: '13px', fontWeight: 700, color: 'var(--blue-600)', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Ver calendário completo</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Days of week header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--slate-400)' }}>
            <div>SEG</div>
            <div>TER</div>
            <div>QUA</div>
            <div>QUI</div>
            <div>SEX</div>
            <div>SÁB</div>
            <div>DOM</div>
          </div>

          {/* Calendar Grid Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {calendarDays.slice(0, 28).map((dayInfo, idx) => {
              const dayObligations = obligations.filter(o => o.dueDate === dayInfo.dateString);
              const hasTax = dayObligations.length > 0 ? dayObligations[0].category : null;
              const isSelected = selectedCalDate === dayInfo.dateString;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedCalDate(dayInfo.dateString)}
                  style={{
                    height: '56px',
                    borderRadius: '10px',
                    border: isSelected
                      ? '2px solid var(--blue-600)'
                      : dayInfo.isToday
                      ? '1px solid var(--blue-400)'
                      : '1px solid var(--slate-100)',
                    backgroundColor: isSelected
                      ? '#EFF6FF'
                      : dayInfo.isCurrentMonth
                      ? '#FFFFFF'
                      : 'var(--slate-50)',
                    padding: '6px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: dayInfo.isToday || isSelected ? 800 : 600,
                      color: dayInfo.isCurrentMonth ? 'var(--slate-800)' : 'var(--slate-300)'
                    }}
                  >
                    {dayInfo.dayNumber}
                  </span>

                  {hasTax && (
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 800,
                        padding: '2px 5px',
                        borderRadius: '4px',
                        backgroundColor: hasTax === 'IVA' ? '#2563EB' : hasTax === 'INSS' ? '#F59E0B' : '#10B981',
                        color: '#FFFFFF',
                        textAlign: 'center',
                        display: 'inline-block'
                      }}
                    >
                      • {hasTax}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom helper */}
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--slate-500)' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB' }}></span>
                IVA (AT)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }}></span>
                INSS (Segurança Social)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
                TAE (Municipal)
              </span>
            </div>

            <button
              onClick={() => onNavigate('/calendario')}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              <Plus size={14} />
              <span>+ Nova Obrigação</span>
            </button>
          </div>
        </div>

        {/* Right: Dynamic Alertas Importantes */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)' }}>
              Alertas Importantes ({alerts.length})
            </h3>
            <button
              onClick={() => onNavigate('/alertas')}
              className="btn-text"
              style={{ fontSize: '13px', fontWeight: 700, color: 'var(--blue-600)' }}
            >
              Ver todos →
            </button>
          </div>

          {alerts.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <CheckCircle2 size={36} color="var(--emerald-500)" style={{ margin: '0 auto 10px' }} />
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-800)' }}>Tudo em Dia!</h4>
              <p style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '4px' }}>
                Não existem obrigações em atraso ou prazos a vencer nos próximos 7 dias.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {alerts.slice(0, 4).map(alert => (
                <div
                  key={alert.id}
                  onClick={() => onNavigate('/calendario')}
                  className="card-hover"
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--slate-200)',
                    backgroundColor:
                      alert.severity === 'critical'
                        ? '#FEF2F2'
                        : alert.severity === 'warning'
                        ? '#FFFBEB'
                        : '#EFF6FF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {alert.severity === 'critical' ? (
                      <AlertTriangle size={18} color="#DC2626" />
                    ) : alert.severity === 'warning' ? (
                      <Clock size={18} color="#D97706" />
                    ) : (
                      <Info size={18} color="#2563EB" />
                    )}
                    <div>
                      <h5 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-900)' }}>
                        {alert.title}
                      </h5>
                      <p style={{ fontSize: '11.5px', color: 'var(--slate-600)', marginTop: '2px' }}>
                        {alert.daysRemaining < 0
                          ? `Venceu há ${Math.abs(alert.daysRemaining)} dias (${alert.dueDate})`
                          : `Vence em ${alert.daysRemaining} dias (${alert.dueDate})`}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={14} color="var(--slate-400)" />
                </div>
              ))}
            </div>
          )}

          {/* WhatsApp Action Callout */}
          <div
            onClick={() => setIsWhatsAppModalOpen(true)}
            style={{
              marginTop: '16px',
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: '#ECFDF5',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MessageSquare size={16} color="#059669" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#065F46' }}>
                Receber alertas fiscais directos no WhatsApp
              </span>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669' }}>Activar →</span>
          </div>
        </div>
      </div>

      {/* Simulator Quick Hub */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)' }}>
              Simuladores Fiscais & Laborais Rápidos
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--slate-500)', marginTop: '2px' }}>
              Calcule retenções, IVA, INSS e custos laborais com a legislação de Moçambique em vigor.
            </p>
          </div>
          <button
            onClick={() => onNavigate('/simuladores')}
            className="btn btn-primary-gold"
            style={{ padding: '8px 16px', fontSize: '12.5px' }}
          >
            <span>Abrir Centro Completo</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
          {simulatorCards.map(sim => (
            <div
              key={sim.id}
              onClick={() => onNavigate(sim.path)}
              className="card card-hover"
              style={{
                padding: '16px',
                textAlign: 'center',
                backgroundColor: sim.bg,
                borderColor: 'rgba(0,0,0,0.06)',
                cursor: 'pointer'
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#FFFFFF',
                  color: sim.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                <Calculator size={20} />
              </div>
              <h5 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-900)' }}>{sim.label}</h5>
              <p style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '2px' }}>Simular Agora</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row: Dynamic Compliance Summary & Legal News */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '24px' }}>
        {/* Compliance Gauge */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '16px' }}>
            Índice de Conformidade Fiscal
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* SVG Donut */}
            <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="var(--slate-100)"
                  strokeWidth="3.8"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3.8"
                  strokeDasharray={`${complianceRate}, 100`}
                />
              </svg>
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
                <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--slate-900)' }}>
                  {complianceRate}%
                </span>
                <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase' }}>
                  Conforme
                </span>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--slate-600)' }}>Obrigações Pagas:</span>
                <strong style={{ color: '#059669' }}>{paidObligations.length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--slate-600)' }}>A Vencer / Pendentes:</span>
                <strong style={{ color: '#D97706' }}>{activeObligations.length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--slate-600)' }}>Vencidas (Multas):</span>
                <strong style={{ color: overdueObligations.length > 0 ? '#DC2626' : '#059669' }}>
                  {overdueObligations.length}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Legal News & Gazette */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)' }}>
              Últimas Notícias Fiscais
            </h3>
            <button
              onClick={() => onNavigate('/newsletter')}
              className="btn-text"
              style={{ fontSize: '13px', fontWeight: 700, color: 'var(--blue-600)' }}
            >
              Ver todas →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {INITIAL_NEWS.slice(0, 3).map(news => (
              <div
                key={news.id}
                onClick={() => onNavigate('/newsletter')}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--slate-50)',
                  border: '1px solid var(--slate-200)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h5 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-800)' }}>
                    {news.title}
                  </h5>
                  <p style={{ fontSize: '11.5px', color: 'var(--slate-500)', marginTop: '2px' }}>
                    {news.summary.slice(0, 75)}...
                  </p>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--slate-400)', whiteSpace: 'nowrap' }}>
                  {news.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
