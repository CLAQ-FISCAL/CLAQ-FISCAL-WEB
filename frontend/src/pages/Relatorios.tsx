import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../context/AppStateContext';
import { formatMZN, formatDate } from '../utils/formatters';

interface RelatoriosProps {
  onNavigate: (path: string) => void;
}

export const Relatorios: React.FC<RelatoriosProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { obligations, addToast } = useAppState();
  const [typeFilter, setTypeFilter] = useState('all');

  const currentYear = new Date().getFullYear();
  const dateRange = `01/01/${currentYear} – 31/12/${currentYear}`;

  const pagasCount = obligations.filter(o => o.status === 'pago').length;
  const pendentesCount = obligations.filter(o => o.status === 'pendente' || o.status === 'a_vencer').length;
  const vencidasCount = obligations.filter(o => o.status === 'vencido').length;
  const totalCount = obligations.length;

  // Dynamic Financial Aggregation
  const paidObligations = obligations.filter(o => o.status === 'pago');
  const taxesPaid = paidObligations
    .filter(o => o.category === 'IVA' || o.category === 'IRPC' || o.category === 'IRPS')
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  const inssPaid = paidObligations
    .filter(o => o.category === 'INSS')
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  const municipalPaid = paidObligations
    .filter(o => o.category === 'TAE' || o.category === 'Alvara')
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  const totalPaid = taxesPaid + inssPaid + municipalPaid;

  const sanitizeCsvCell = (val: string | number | undefined): string => {
    const str = String(val ?? '');
    if (/^[=+\-@\t\r]/.test(str)) {
      return `"'${str.replace(/"/g, '""')}"`;
    }
    return `"${str.replace(/"/g, '""')}"`;
  };

  const handleExportReport = () => {
    const csvRows = [
      [t('reports:csvTitle')],
      [t('reports:csvPeriod'), dateRange],
      [t('reports:csvPaidObligations'), pagasCount],
      [t('reports:csvPending'), pendentesCount],
      [t('reports:csvOverdue'), vencidasCount],
      [t('reports:csvTotal'), totalCount],
      [t('reports:csvTaxesPaid'), taxesPaid.toFixed(2)],
      [t('reports:csvINSSContributions'), inssPaid.toFixed(2)],
      [t('reports:csvMunicipalFees'), municipalPaid.toFixed(2)],
      [t('reports:csvTotalPaid'), totalPaid.toFixed(2)]
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(row => row.map(cell => sanitizeCsvCell(cell)).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${t('reports:csvFileName', { year: currentYear })}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', t('reports:toastExportTitle'), t('reports:toastExportMsg'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>
            {t('reports:pageTitle')}
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--slate-500)', marginTop: '2px' }}>
            {t('reports:pageSubtitle')}
          </p>
        </div>

        <button onClick={handleExportReport} className="btn btn-secondary" style={{ fontSize: '13px' }}>
          <Download size={16} />
          <span>{t('reports:exportReport')}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)', padding: '7px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--slate-700)' }}>
            <Calendar size={16} color="var(--blue-600)" />
            <span>{dateRange}</span>
          </div>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="form-control"
            style={{ width: '180px', padding: '7px 12px', fontSize: '13px' }}
          >
            <option value="all">{t('reports:allTypes')}</option>
            <option value="taxes">{t('reports:filterTaxes')}</option>
            <option value="inss">{t('reports:filterSocialSecurity')}</option>
            <option value="municipal">{t('reports:filterMunicipal')}</option>
          </select>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            {t('reports:paid')}
          </span>
          <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--slate-900)', marginTop: '6px' }}>
            {pagasCount}
          </h3>
          <span className="badge" style={{ marginTop: '8px', backgroundColor: '#ECFDF5', color: '#059669' }}>
            {totalCount > 0 ? t('reports:percentCompleted', { percent: Math.round((pagasCount / totalCount) * 100) }) : '0%'}
          </span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            {t('reports:pending')}
          </span>
          <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--slate-900)', marginTop: '6px' }}>
            {pendentesCount}
          </h3>
          <span className="badge" style={{ marginTop: '8px', backgroundColor: '#FFFBEB', color: '#D97706' }}>
            {t('reports:toBeSettled')}
          </span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            {t('reports:overdue')}
          </span>
          <h3 style={{ fontSize: '28px', fontWeight: 800, color: vencidasCount > 0 ? '#DC2626' : 'var(--slate-900)', marginTop: '6px' }}>
            {vencidasCount}
          </h3>
          <span className="badge" style={{ marginTop: '8px', backgroundColor: vencidasCount > 0 ? '#FEF2F2' : '#ECFDF5', color: vencidasCount > 0 ? '#DC2626' : '#059669' }}>
            {vencidasCount > 0 ? t('reports:attentionNeeded') : t('reports:noDelays')}
          </span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            {t('reports:totalRegistered')}
          </span>
          <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--slate-900)', marginTop: '6px' }}>
            {totalCount}
          </h3>
          <span className="badge" style={{ marginTop: '8px', backgroundColor: '#EFF6FF', color: '#2563EB' }}>
            {t('reports:fiscalYear', { year: currentYear })}
          </span>
        </div>
      </div>

      {/* Financial Breakdown Card */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '16px' }}>
          {t('reports:financialBreakdown')}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)' }}>
            <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>{t('reports:taxesPaidBreakdown')}</p>
            <h4 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--slate-900)', marginTop: '4px' }}>
              {formatMZN(taxesPaid)}
            </h4>
          </div>

          <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)' }}>
            <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>{t('reports:inssPaidBreakdown')}</p>
            <h4 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--slate-900)', marginTop: '4px' }}>
              {formatMZN(inssPaid)}
            </h4>
          </div>

          <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)' }}>
            <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>{t('reports:municipalBreakdown')}</p>
            <h4 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--slate-900)', marginTop: '4px' }}>
              {formatMZN(municipalPaid)}
            </h4>
          </div>

          <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#EFF6FF', border: '1px solid rgba(37,99,235,0.2)' }}>
            <p style={{ fontSize: '12px', color: '#1E40AF', fontWeight: 700 }}>{t('reports:totalDisbursed')}</p>
            <h4 style={{ fontSize: '22px', fontWeight: 800, color: '#1D4ED8', marginTop: '4px' }}>
              {formatMZN(totalPaid)}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
};
