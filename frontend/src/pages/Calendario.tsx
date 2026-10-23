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
  Calculator,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../context/AppStateContext';
import { FiscalObligation, ObligationCategory, TaxAuthority } from '../types';
import { formatMZN, formatDate } from '../utils/formatters';
import { CalendarEngine } from '../utils/calendarEngine';

interface CalendarioProps {
  onNavigate: (path: string) => void;
}

export const Calendario: React.FC<CalendarioProps> = ({ onNavigate }) => {
  const { t, i18n } = useTranslation();
  const {
    obligations,
    markObligationPaid,
    addObligation,
    deleteObligation,
    activeClient
  } = useAppState();

  const [monthOffset, setMonthOffset] = useState(0);
  const now = new Date();
  const displayDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const displayYear = displayDate.getFullYear();
  const displayMonthIndex = displayDate.getMonth();
  const displayMonthLabel = CalendarEngine.getMonthName(displayMonthIndex, displayYear, i18n.language);

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAuthority, setFilterAuthority] = useState<string>('all');
  const [selectedDayObligation, setSelectedDayObligation] = useState<FiscalObligation | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Obligation form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ObligationCategory>('IVA');
  const [newDueDate, setNewDueDate] = useState(() => CalendarEngine.formatDateYMD(new Date(displayYear, displayMonthIndex + 1, 0)));
  const [newAmount, setNewAmount] = useState('50000');
  const [newAuthority, setNewAuthority] = useState<TaxAuthority>('AT');
  const [newDescription, setNewDescription] = useState('');

  // Dynamic Month Grid Matrix
  const fullCalendarDays = CalendarEngine.getMonthGrid(displayYear, displayMonthIndex);

  // Filter Obligations
  const filteredObligations = obligations.filter(obl => {
    if (filterCategory !== 'all' && obl.category !== filterCategory) return false;
    if (filterAuthority !== 'all' && obl.authority !== filterAuthority) return false;
    return true;
  });

  const handleCreateObligation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addObligation({
      title: newTitle,
      category: newCategory,
      period: displayMonthLabel,
      dueDate: newDueDate,
      status: 'a_vencer',
      amount: Number(newAmount) || 0,
      authority: newAuthority,
      description: newDescription || t('calendar:obligationRegistered', { month: displayMonthLabel }),
      daysRemaining: CalendarEngine.getDaysRemaining(newDueDate)
    });

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDescription('');
  };

  const handleMarkPaidWithCelebration = (id: string) => {
    markObligationPaid(id);
    confetti({
      particleCount: 75,
      spread: 60,
      origin: { y: 0.6 }
    });
    setSelectedDayObligation(null);
  };

  const exportCalendarCSV = () => {
    const headers = [
      t('calendar:csvTitle'),
      t('calendar:csvCategory'),
      t('calendar:csvPeriod'),
      t('calendar:csvDueDate'),
      t('calendar:csvAmount'),
      t('calendar:csvEntity'),
      t('calendar:csvStatus')
    ];
    const rows = filteredObligations.map(o => [
      `"${o.title}"`,
      o.category,
      `"${o.period}"`,
      o.dueDate,
      o.amount,
      o.authority,
      o.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${t('calendar:csvFileName', { month: displayMonthLabel.replace(/\s+/g, '_') })}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>
            {t('calendar:pageTitle')}
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--slate-500)', marginTop: '2px' }}>
            {t('calendar:pageSubtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={exportCalendarCSV}
            className="btn btn-secondary"
            style={{ padding: '9px 14px', fontSize: '13px' }}
          >
            <Download size={15} />
            <span>{t('calendar:exportCSV')}</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary-gold"
            style={{ padding: '9px 16px', fontSize: '13px' }}
          >
            <Plus size={15} />
            <span>+ {t('calendar:newObligation')}</span>
          </button>
        </div>
      </div>

      {/* Month Navigation & Filters Row */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        {/* Month Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => setMonthOffset(prev => prev - 1)}
              className="btn-icon"
              style={{ width: '32px', height: '32px', border: '1px solid var(--slate-200)' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)', minWidth: '160px', textAlign: 'center' }}>
              {displayMonthLabel}
            </span>
            <button
              onClick={() => setMonthOffset(prev => prev + 1)}
              className="btn-icon"
              style={{ width: '32px', height: '32px', border: '1px solid var(--slate-200)' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {monthOffset !== 0 && (
            <button
              onClick={() => setMonthOffset(0)}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 700 }}
            >
              {t('common:today')}
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="var(--slate-400)" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-500)' }}>{t('calendar:categoryLabel')}:</span>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="form-control"
              style={{ padding: '6px 10px', fontSize: '12px', width: 'auto' }}
            >
              <option value="all">{t('calendar:allCategories')}</option>
              <option value="IVA">{t('calendar:optIVADesc')}</option>
              <option value="INSS">{t('calendar:optINSSDesc')}</option>
              <option value="IRPS">{t('calendar:optIRPSDesc')}</option>
              <option value="IRPC">{t('calendar:optIRPCDesc')}</option>
              <option value="TAE">{t('calendar:optTAEDesc')}</option>
              <option value="Alvara">{t('calendar:optAlvara')}</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-500)' }}>{t('calendar:entityLabel')}:</span>
            <select
              value={filterAuthority}
              onChange={e => setFilterAuthority(e.target.value)}
              className="form-control"
              style={{ padding: '6px 10px', fontSize: '12px', width: 'auto' }}
            >
              <option value="all">{t('calendar:allEntities')}</option>
              <option value="AT">{t('calendar:optAT')}</option>
              <option value="INSS">INSS</option>
              <option value="Municipio">{t('calendar:optMunicipio')}</option>
              <option value="BAU">{t('calendar:optBAU')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Full-Month Calendar Grid */}
      <div className="card" style={{ padding: '24px' }}>
        {/* Days of Week Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '12px', fontSize: '12px', fontWeight: 700, color: 'var(--slate-400)' }}>
          <div>{t('calendar:dayMonday')}</div>
          <div>{t('calendar:dayTuesday')}</div>
          <div>{t('calendar:dayWednesday')}</div>
          <div>{t('calendar:dayThursday')}</div>
          <div>{t('calendar:dayFriday')}</div>
          <div>{t('calendar:daySaturday')}</div>
          <div>{t('calendar:daySunday')}</div>
        </div>

        {/* 35 / 42 Cells Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {fullCalendarDays.map((dayInfo, idx) => {
            const dayObligations = filteredObligations.filter(o => o.dueDate === dayInfo.dateString);
            const isSelected = selectedDayObligation && dayObligations.some(o => o.id === selectedDayObligation.id);

            return (
              <div
                key={idx}
                onClick={() => {
                  if (dayObligations.length > 0) {
                    setSelectedDayObligation(dayObligations[0]);
                  } else if (dayInfo.isCurrentMonth) {
                    setNewDueDate(dayInfo.dateString);
                    setIsAddModalOpen(true);
                  }
                }}
                style={{
                  minHeight: '92px',
                  borderRadius: '10px',
                  border: isSelected
                    ? '2px solid var(--blue-600)'
                    : dayInfo.isToday
                    ? '2px solid var(--blue-400)'
                    : '1px solid var(--slate-100)',
                  backgroundColor: isSelected
                    ? '#EFF6FF'
                    : dayInfo.isCurrentMonth
                    ? '#FFFFFF'
                    : 'var(--slate-50)',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: dayInfo.isToday || isSelected ? 800 : 600,
                      color: dayInfo.isCurrentMonth ? 'var(--slate-800)' : 'var(--slate-300)'
                    }}
                  >
                    {dayInfo.dayNumber}
                  </span>
                  {dayInfo.isToday && (
                    <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--blue-600)', textTransform: 'uppercase' }}>
                      {t('common:today')}
                    </span>
                  )}
                </div>

                {/* Chips */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                  {dayObligations.map(obl => (
                    <div
                      key={obl.id}
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        padding: '3px 6px',
                        borderRadius: '5px',
                        backgroundColor:
                          obl.status === 'pago'
                            ? '#ECFDF5'
                            : obl.category === 'IVA'
                            ? '#2563EB'
                            : obl.category === 'INSS'
                            ? '#F59E0B'
                            : '#10B981',
                        color: obl.status === 'pago' ? '#059669' : '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={`${obl.title} - ${formatMZN(obl.amount)}`}
                    >
                      <span>{obl.category}</span>
                      {obl.status === 'pago' && <CheckCircle2 size={11} color="#059669" />}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Obligation Drawer / Detail Card */}
      {selectedDayObligation && (
        <div className="card" style={{ padding: '24px', borderLeft: '4px solid var(--blue-600)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge" style={{ backgroundColor: 'var(--blue-50)', color: 'var(--blue-700)' }}>
                  {selectedDayObligation.authority}
                </span>
                <span
                  className="badge"
                  style={{
                    backgroundColor: selectedDayObligation.status === 'pago' ? '#ECFDF5' : '#FFFBEB',
                    color: selectedDayObligation.status === 'pago' ? '#059669' : '#D97706'
                  }}
                >
                  {selectedDayObligation.status === 'pago' ? t('calendar:paidSettled') : t('common:statusDue')}
                </span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)', marginTop: '8px' }}>
                {selectedDayObligation.title}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--slate-500)', marginTop: '4px' }}>
                {selectedDayObligation.description}
              </p>
            </div>

            <button
              onClick={() => setSelectedDayObligation(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginTop: '20px', padding: '16px', backgroundColor: 'var(--slate-50)', borderRadius: '10px' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase' }}>{t('calendar:dueDate')}</p>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--slate-800)', marginTop: '2px' }}>
                {formatDate(selectedDayObligation.dueDate)}
              </h4>
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase' }}>{t('calendar:estimatedAmount')}</p>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--slate-900)', marginTop: '2px' }}>
                {formatMZN(selectedDayObligation.amount)}
              </h4>
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase' }}>{t('calendar:remainingDeadline')}</p>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: CalendarEngine.getDaysRemaining(selectedDayObligation.dueDate) <= 3 ? '#DC2626' : '#2563EB', marginTop: '2px' }}>
                {CalendarEngine.getDaysRemaining(selectedDayObligation.dueDate) < 0
                  ? t('calendar:overdueByDays', { count: Math.abs(CalendarEngine.getDaysRemaining(selectedDayObligation.dueDate)) })
                  : t('calendar:daysLeft', { count: CalendarEngine.getDaysRemaining(selectedDayObligation.dueDate) })}
              </h4>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button
              onClick={() => deleteObligation(selectedDayObligation.id)}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '12.5px', color: '#DC2626' }}
            >
              <Trash2 size={14} />
              <span>{t('common:delete')}</span>
            </button>

            {selectedDayObligation.status !== 'pago' && (
              <button
                onClick={() => handleMarkPaidWithCelebration(selectedDayObligation.id)}
                className="btn btn-primary-gold"
                style={{ padding: '8px 20px', fontSize: '12.5px' }}
              >
                <CheckCircle2 size={16} />
                <span>{t('calendar:markAsPaid')}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Obligation Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '520px', width: '90%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)' }}>
                {t('calendar:registerNewObligation')}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateObligation}>
              <div className="form-group">
                <label className="form-label">{t('calendar:obligationTitle')}</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t('calendar:titlePlaceholder')}
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">{t('calendar:categoryLabel')}</label>
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
                    <option value="Alvara">{t('calendar:optAlvara')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('calendar:taxEntity')}</label>
                  <select
                    className="form-control"
                    value={newAuthority}
                    onChange={e => setNewAuthority(e.target.value as TaxAuthority)}
                  >
                    <option value="AT">{t('calendar:optAT')}</option>
                    <option value="INSS">INSS</option>
                    <option value="Municipio">{t('calendar:optMunicipioShort')}</option>
                    <option value="BAU">BAU</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">{t('calendar:dueDateLabel')}</label>
                  <input
                    type="date"
                    className="form-control"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('calendar:estimatedAmountMZN')}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newAmount}
                    onChange={e => setNewAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('calendar:notesDescription')}</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder={t('calendar:notesPlaceholder')}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-secondary"
                >
                  {t('common:cancel')}
                </button>
                <button type="submit" className="btn btn-primary-gold">
                  {t('calendar:saveObligation')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
