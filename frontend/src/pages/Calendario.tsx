import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  Info,
  ArrowRight,
  X,
  Calculator
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { FiscalObligation, ObligationCategory, TaxAuthority } from '../types';
import { formatMZN, formatDate, formatRelativeDays } from '../utils/formatters';

interface CalendarioProps {
  onNavigate: (path: string) => void;
}

export const Calendario: React.FC<CalendarioProps> = ({ onNavigate }) => {
  const {
    obligations,
    markObligationPaid,
    addObligation,
    activeClient
  } = useAppState();

  const [currentMonth, setCurrentMonth] = useState('Junho 2026');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAuthority, setFilterAuthority] = useState<string>('all');
  const [selectedDayObligation, setSelectedDayObligation] = useState<FiscalObligation | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Obligation form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ObligationCategory>('IVA');
  const [newDueDate, setNewDueDate] = useState('2026-06-30');
  const [newAmount, setNewAmount] = useState('50000');
  const [newAuthority, setNewAuthority] = useState<TaxAuthority>('AT');
  const [newDescription, setNewDescription] = useState('');

  // June 2026 calendar days setup (30 days, June 1 starts on Monday)
  const fullCalendarDays = [
    { day: 26, isCurrentMonth: false },
    { day: 27, isCurrentMonth: false },
    { day: 28, isCurrentMonth: false },
    { day: 29, isCurrentMonth: false },
    { day: 30, isCurrentMonth: false },
    { day: 31, isCurrentMonth: false },
    { day: 1, isCurrentMonth: true },
    { day: 2, isCurrentMonth: true },
    { day: 3, isCurrentMonth: true },
    { day: 4, isCurrentMonth: true },
    { day: 5, isCurrentMonth: true },
    { day: 6, isCurrentMonth: true },
    { day: 7, isCurrentMonth: true },
    { day: 8, isCurrentMonth: true },
    { day: 9, isCurrentMonth: true },
    { day: 10, isCurrentMonth: true, obligationKey: 'obl-inss-jun26', label: 'INSS', badgeColor: '#F59E0B' },
    { day: 11, isCurrentMonth: true },
    { day: 12, isCurrentMonth: true },
    { day: 13, isCurrentMonth: true },
    { day: 14, isCurrentMonth: true },
    { day: 15, isCurrentMonth: true },
    { day: 16, isCurrentMonth: true },
    { day: 17, isCurrentMonth: true },
    { day: 18, isCurrentMonth: true },
    { day: 19, isCurrentMonth: true },
    { day: 20, isCurrentMonth: true, obligationKey: 'obl-tae-2026', label: 'TAE', badgeColor: '#10B981' },
    { day: 21, isCurrentMonth: true },
    { day: 22, isCurrentMonth: true },
    { day: 23, isCurrentMonth: true },
    { day: 24, isCurrentMonth: true },
    { day: 25, isCurrentMonth: true },
    { day: 26, isCurrentMonth: true },
    { day: 27, isCurrentMonth: true },
    { day: 28, isCurrentMonth: true },
    { day: 29, isCurrentMonth: true },
    { day: 30, isCurrentMonth: true, obligationKey: 'obl-iva-jun26', label: 'IVA', badgeColor: '#2563EB' },
    { day: 1, isCurrentMonth: false },
    { day: 2, isCurrentMonth: false },
    { day: 3, isCurrentMonth: false },
    { day: 4, isCurrentMonth: false },
    { day: 5, isCurrentMonth: false }
  ];

  const filteredObligations = obligations.filter(obl => {
    if (filterCategory !== 'all' && obl.category !== filterCategory) return false;
    if (filterAuthority !== 'all' && obl.authority !== filterAuthority) return false;
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addObligation({
      title: newTitle,
      category: newCategory,
      period: 'Personalizado',
      dueDate: newDueDate,
      status: 'a_vencer',
      amount: Number(newAmount) || 0,
      authority: newAuthority,
      description: newDescription || 'Obrigação fiscal registada pelo utilizador.',
      daysRemaining: 10
    });
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDescription('');
  };

  const handleExportCalendar = () => {
    const csvRows = [
      ['Titulo', 'Categoria', 'Data Limite', 'Orgao', 'Valor (MZN)', 'Estado'],
      ...obligations.map(o => [o.title, o.category, o.dueDate, o.authority, o.amount || 0, o.status])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Calendario_Fiscal_CLAQ_2026.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header & Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>
            Calendário Fiscal
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--slate-500)', marginTop: '2px' }}>
            Acompanhe todas as obrigações fiscais, laborais e municipais em Moçambique.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-secondary"
            style={{ fontSize: '13px' }}
          >
            <Plus size={16} />
            <span>Adicionar Obrigação</span>
          </button>
          <button
            onClick={handleExportCalendar}
            className="btn btn-secondary"
            style={{ fontSize: '13px' }}
          >
            <Download size={16} />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="card"
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        {/* Month Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn btn-ghost" style={{ padding: '6px' }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-800)', minWidth: '110px', textAlign: 'center' }}>
            {currentMonth}
          </span>
          <button className="btn btn-ghost" style={{ padding: '6px' }}>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} color="var(--slate-400)" />
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="form-control"
              style={{ width: '190px', padding: '7px 12px', fontSize: '13px' }}
            >
              <option value="all">Todas as obrigações</option>
              <option value="IVA">IVA (Imposto Valor Acrescentado)</option>
              <option value="INSS">INSS (Segurança Social)</option>
              <option value="IRPS">IRPS (Rendimentos Singulares)</option>
              <option value="IRPC">IRPC (Pessoas Colectivas)</option>
              <option value="TAE">TAE (Taxa de Actividade)</option>
              <option value="Alvara">Alvará Comercial</option>
            </select>
          </div>

          <div>
            <select
              value={filterAuthority}
              onChange={e => setFilterAuthority(e.target.value)}
              className="form-control"
              style={{ width: '180px', padding: '7px 12px', fontSize: '13px' }}
            >
              <option value="all">Todos os órgãos</option>
              <option value="AT">Autoridade Tributária (AT)</option>
              <option value="INSS">INSS Moçambique</option>
              <option value="Municipio">Município / Autarquia</option>
              <option value="BAU">Balcão de Atendimento Único</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Full-Month Calendar Grid */}
      <div className="card" style={{ padding: '24px' }}>
        {/* Days Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', textAlign: 'center', marginBottom: '14px' }}>
          {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map((dName, idx) => (
            <span key={idx} style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-400)' }}>
              {dName}
            </span>
          ))}
        </div>

        {/* Days Cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
          {fullCalendarDays.map((cDay, idx) => {
            const obl = cDay.obligationKey ? obligations.find(o => o.id === cDay.obligationKey) : null;
            return (
              <div
                key={idx}
                onClick={() => {
                  if (obl) setSelectedDayObligation(obl);
                }}
                style={{
                  minHeight: '84px',
                  borderRadius: '12px',
                  border: obl ? `1.5px solid ${cDay.badgeColor}` : '1px solid var(--slate-200)',
                  backgroundColor: obl ? `${cDay.badgeColor}0A` : cDay.isCurrentMonth ? '#FFFFFF' : 'var(--slate-50)',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: obl ? 'pointer' : 'default',
                  opacity: cDay.isCurrentMonth ? 1 : 0.45,
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: obl ? 800 : 600,
                      color: obl ? '#FFFFFF' : 'var(--slate-700)',
                      backgroundColor: obl ? cDay.badgeColor : 'transparent',
                      width: obl ? '26px' : 'auto',
                      height: obl ? '26px' : 'auto',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {cDay.day}
                  </span>
                </div>

                {obl && (
                  <div
                    style={{
                      backgroundColor: cDay.badgeColor,
                      color: '#FFFFFF',
                      padding: '3px 6px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textAlign: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {cDay.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Widgets Below: PRÓXIMAS OBRIGAÇÕES and RESUMO DO MÊS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '24px' }}>
        
        {/* PRÓXIMAS OBRIGAÇÕES */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--slate-900)', letterSpacing: '0.04em' }}>
              PRÓXIMAS OBRIGAÇÕES
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--slate-500)', fontWeight: 600 }}>
              Ver todas ({filteredObligations.length})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredObligations.slice(0, 4).map(obl => (
              <div
                key={obl.id}
                onClick={() => setSelectedDayObligation(obl)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--slate-200)',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: obl.category === 'IVA' ? 'var(--blue-50)' : obl.category === 'INSS' ? 'var(--gold-50)' : 'var(--emerald-50)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CalendarIcon size={18} color={obl.category === 'IVA' ? 'var(--blue-600)' : obl.category === 'INSS' ? 'var(--gold-600)' : 'var(--emerald-600)'} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--slate-800)' }}>
                      {obl.title}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '2px' }}>
                      Referência: {obl.period} • Órgão: {obl.authority}
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: obl.status === 'pago' ? 'var(--emerald-600)' : obl.daysRemaining && obl.daysRemaining <= 3 ? 'var(--red-600)' : 'var(--gold-700)',
                      display: 'block'
                    }}
                  >
                    {obl.status === 'pago' ? 'Liquidada' : obl.daysRemaining !== undefined ? formatRelativeDays(obl.daysRemaining) : 'Pendente'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--slate-400)' }}>
                    {formatDate(obl.dueDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RESUMO DO MÊS */}
        <div className="card" style={{ padding: '22px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--slate-900)', letterSpacing: '0.04em', marginBottom: '16px' }}>
            RESUMO DO MÊS (JUNHO 2026)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: 'var(--gold-50)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--gold-500)' }} />
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--gold-700)' }}>A vencer</span>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gold-700)' }}>3</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: 'var(--red-50)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--red-500)' }} />
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--red-600)' }}>Vencidas</span>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--red-600)' }}>0</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: 'var(--emerald-50)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--emerald-500)' }} />
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--emerald-600)' }}>Pagas / Cumpridas</span>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--emerald-600)' }}>8</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: 'var(--slate-100)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--slate-500)' }} />
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--slate-700)' }}>Total</span>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-800)' }}>11</span>
            </div>
          </div>
        </div>

      </div>

      {/* Obligation Detail Modal */}
      {selectedDayObligation && (
        <div className="modal-overlay" onClick={() => setSelectedDayObligation(null)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarIcon size={18} color="var(--blue-600)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-900)' }}>
                    Detalhes da Obrigação Fiscal
                  </h3>
                  <span className="badge badge-amber" style={{ fontSize: '11px', marginTop: '2px' }}>
                    {selectedDayObligation.category}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedDayObligation(null)} className="btn btn-ghost" style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)' }}>
                  {selectedDayObligation.title}
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--slate-600)', marginTop: '4px', lineHeight: 1.5 }}>
                  {selectedDayObligation.description}
                </p>
              </div>

              <div style={{ backgroundColor: 'var(--slate-50)', padding: '14px', borderRadius: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12.5px' }}>
                <div>
                  <span style={{ color: 'var(--slate-500)', fontSize: '11px', fontWeight: 600 }}>DATA LIMITE</span>
                  <p style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '2px' }}>{formatDate(selectedDayObligation.dueDate)}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--slate-500)', fontSize: '11px', fontWeight: 600 }}>ÓRGÃO TRIBUTÁRIO</span>
                  <p style={{ fontWeight: 700, color: 'var(--slate-900)', marginTop: '2px' }}>{selectedDayObligation.authority}</p>
                </div>
                {selectedDayObligation.amount && (
                  <div>
                    <span style={{ color: 'var(--slate-500)', fontSize: '11px', fontWeight: 600 }}>VALOR ESTIMADO</span>
                    <p style={{ fontWeight: 700, color: 'var(--blue-600)', marginTop: '2px' }}>{formatMZN(selectedDayObligation.amount)}</p>
                  </div>
                )}
                <div>
                  <span style={{ color: 'var(--slate-500)', fontSize: '11px', fontWeight: 600 }}>STATUS</span>
                  <p style={{ fontWeight: 700, color: selectedDayObligation.status === 'pago' ? 'var(--emerald-600)' : 'var(--gold-700)', marginTop: '2px' }}>
                    {selectedDayObligation.status === 'pago' ? 'Liquidada' : 'A Vencer'}
                  </p>
                </div>
              </div>

              {selectedDayObligation.penaltyRisk && (
                <div style={{ padding: '12px', backgroundColor: 'var(--red-50)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '12px', color: 'var(--red-600)' }}>
                  <b>Aviso de Penalização:</b> {selectedDayObligation.penaltyRisk}
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', backgroundColor: 'var(--slate-50)' }}>
              <button
                onClick={() => {
                  setSelectedDayObligation(null);
                  onNavigate('/simuladores');
                }}
                className="btn btn-secondary btn-sm"
              >
                <Calculator size={15} />
                <span>Abrir Simulador</span>
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    markObligationPaid(selectedDayObligation.id);
                    setSelectedDayObligation(null);
                  }}
                  className="btn btn-primary-blue btn-sm"
                >
                  <CheckCircle2 size={15} />
                  <span>Marcar como Paga</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Obligation Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--slate-900)' }}>
                Adicionar Obrigação Personalizada
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="btn btn-ghost" style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Nome da Obrigação</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Imposto de Selo Contrato de Arrendamento"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Categoria</label>
                    <select
                      className="form-control"
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value as ObligationCategory)}
                    >
                      <option value="IVA">IVA</option>
                      <option value="INSS">INSS</option>
                      <option value="IRPS">IRPS</option>
                      <option value="IRPC">IRPC</option>
                      <option value="TAE">TAE</option>
                      <option value="IS">Imposto de Selo</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Órgão Competente</label>
                    <select
                      className="form-control"
                      value={newAuthority}
                      onChange={e => setNewAuthority(e.target.value as TaxAuthority)}
                    >
                      <option value="AT">Autoridade Tributária (AT)</option>
                      <option value="INSS">INSS</option>
                      <option value="Municipio">Conselho Municipal</option>
                      <option value="BAU">BAU</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Data Limite de Pagamento</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newDueDate}
                      onChange={e => setNewDueDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Valor Estimado (MZN)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0.00"
                      value={newAmount}
                      onChange={e => setNewAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição / Notas</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Instruções para liquidação e guias..."
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: 'var(--slate-50)' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary-blue">
                  Registar Obrigação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
