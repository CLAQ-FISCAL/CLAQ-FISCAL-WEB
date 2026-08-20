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
import { useAppState } from '../context/AppStateContext';
import { formatMZN, formatDate } from '../utils/formatters';

interface RelatoriosProps {
  onNavigate: (path: string) => void;
}

export const Relatorios: React.FC<RelatoriosProps> = ({ onNavigate }) => {
  const { obligations, addToast } = useAppState();
  const [dateRange, setDateRange] = useState('01/01/2026 – 30/06/2026');
  const [typeFilter, setTypeFilter] = useState('Todos os tipos');

  const pagasCount = obligations.filter(o => o.status === 'pago').length;
  const pendentesCount = obligations.filter(o => o.status === 'pendente' || o.status === 'a_vencer').length;
  const vencidasCount = obligations.filter(o => o.status === 'vencido').length;
  const totalCount = obligations.length;

  const handleExportReport = () => {
    const csvRows = [
      ['RELATORIO DE CONFORMIDADE FISCAL - CLAQ FISCAL ALERT'],
      ['Periodo', dateRange],
      ['Obrigacoes Pagas', pagasCount],
      ['Pendentes', pendentesCount],
      ['Vencidas', vencidasCount],
      ['Total', totalCount],
      ['Impostos Pagos (MZN)', '128450.00'],
      ['Contribuicoes INSS (MZN)', '45230.00'],
      ['Taxas Municipais (MZN)', '12000.00'],
      ['Total Pago (MZN)', '185680.00']
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Relatorio_Conformidade_CLAQ_2026.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Relatório Exportado', 'Ficheiro de conformidade descarregado.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>
            Relatórios
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--slate-500)', marginTop: '2px' }}>
            Consulte leis, decretos e acompanhe a situação de conformidade da sua empresa.
          </p>
        </div>

        <button onClick={handleExportReport} className="btn btn-secondary" style={{ fontSize: '13px' }}>
          <Download size={16} />
          <span>Exportar</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)', padding: '7px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--slate-700)' }}>
            <Calendar size={16} color="var(--blue-600)" />
            <span>01/01/2026 – 30/06/2026</span>
          </div>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="form-control"
            style={{ width: '180px', padding: '7px 12px', fontSize: '13px' }}
          >
            <option value="Todos os tipos">Todos os tipos</option>
            <option value="Impostos">Impostos (IVA / IRPC)</option>
            <option value="INSS">Segurança Social</option>
            <option value="Municipais">Taxas Municipais</option>
          </select>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Obrigações Pagas
          </span>
          <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--emerald-600)', marginTop: '8px' }}>
            {pagasCount || 8}
          </h3>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Pendentes
          </span>
          <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--gold-600)', marginTop: '8px' }}>
            {pendentesCount || 3}
          </h3>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Vencidas
          </span>
          <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--red-600)', marginTop: '8px' }}>
            {vencidasCount || 0}
          </h3>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Total de Obrigações
          </span>
          <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--blue-600)', marginTop: '8px' }}>
            {totalCount || 11}
          </h3>
        </div>
      </div>

      {/* Two Column Section: Gráfico de Obrigações & Resumo Financeiro */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
        {/* Gráfico de Obrigações (Donut) */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '20px' }}>
            Gráfico de Obrigações
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '20px' }}>
            <div style={{ position: 'relative', width: '140px', height: '140px' }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="4"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="4"
                  strokeDasharray="72.7, 100"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="4"
                  strokeDasharray="27.3, 100"
                  strokeDashoffset="-72.7"
                />
              </svg>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                <span>Pagas: <b>8 (72.7%)</b></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                <span>Pendentes: <b>3 (27.3%)</b></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                <span>Vencidas: <b>0 (0%)</b></span>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo Financeiro (MZN) */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '16px' }}>
            Resumo Financeiro (MZN)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--slate-100)', fontSize: '13.5px' }}>
              <span style={{ color: 'var(--slate-600)' }}>Impostos Pagos (IVA, IRPS, IRPC)</span>
              <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>128 450,00 MZN</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--slate-100)', fontSize: '13.5px' }}>
              <span style={{ color: 'var(--slate-600)' }}>Contribuições INSS</span>
              <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>45 230,00 MZN</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--slate-100)', fontSize: '13.5px' }}>
              <span style={{ color: 'var(--slate-600)' }}>Taxas Municipais</span>
              <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>12 000,00 MZN</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: 'var(--slate-50)', borderRadius: '10px', marginTop: '4px', fontSize: '15px' }}>
              <span style={{ fontWeight: 800, color: 'var(--slate-900)' }}>Total Pago</span>
              <span style={{ fontWeight: 900, color: 'var(--blue-600)' }}>185 680,00 MZN</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button
              onClick={() => onNavigate('/calendario')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--blue-600)',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Ver relatório detalhado →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
