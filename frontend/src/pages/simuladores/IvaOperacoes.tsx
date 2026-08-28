import React, { useState } from 'react';
import { ArrowRight, Info, CheckCircle2 } from 'lucide-react';
import { SimulatorLayout } from '../../components/simulators/SimulatorLayout';
import { calculateIvaOperacoes } from '../../lib/calculations/mocambique';
import { formatMZN } from '../../utils/formatters';

interface Props {
  onNavigate: (path: string) => void;
}

export const IvaOperacoes: React.FC<Props> = ({ onNavigate }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [baseTributavel, setBaseTributavel] = useState('');
  const [taxaIva, setTaxaIva] = useState('0.16');
  const [ivaSuportado, setIvaSuportado] = useState('');

  const result = calculateIvaOperacoes({
    baseTributavel: Number(baseTributavel) || 0,
    taxaIva: Number(taxaIva),
    ivaSuportado: Number(ivaSuportado) || 0,
  });

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep(2);
  };

  return (
    <SimulatorLayout
      onNavigate={onNavigate}
      categoria="Fiscal"
      nome="IVA – Operações"
      currentStep={currentStep}
      onStepChange={setCurrentStep}
    >
      {currentStep === 1 && (
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '20px' }}>
            1. Dados das Operações de IVA
          </h2>

          <form onSubmit={handleCalculate}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Base Tributável (MZN)</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  placeholder="Valor das vendas sujeitas a IVA"
                  value={baseTributavel}
                  onChange={(e) => setBaseTributavel(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Taxa IVA</label>
                <select className="form-control" value={taxaIva} onChange={(e) => setTaxaIva(e.target.value)}>
                  <option value="0.16">16% — Taxa Normal</option>
                  <option value="0.05">5% — Taxa Reduzida</option>
                  <option value="0">Isento</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">IVA Suportado Dedutível (MZN)</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  placeholder="IVA incluído nas compras dedutíveis"
                  value={ivaSuportado}
                  onChange={(e) => setIvaSuportado(e.target.value)}
                />
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'var(--blue-50)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                marginBottom: '24px',
              }}
            >
              <Info size={20} color="var(--blue-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E3A8A' }}>Importante</h4>
                <p style={{ fontSize: '12.5px', color: '#1E40AF', marginTop: '2px', lineHeight: 1.4 }}>
                  O IVA é dedutível nas operações sujeitas e não isentas. Se o IVA suportado for superior ao
                  liquidado, o diferencial constitui <b>crédito de IVA</b> recuperável.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary-blue btn-lg">
                <span>Calcular IVA</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        </div>
      )}

      {currentStep >= 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)' }}>
                Resultado do IVA
              </h3>
              <span className="badge badge-green" style={{ fontSize: '11.5px' }}>
                <CheckCircle2 size={13} />
                <span>Cálculo concluído</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'IVA Liquidado', value: result.ivaLiquidado, color: 'var(--slate-900)' },
                { label: 'IVA Suportado (Dedutível)', value: result.ivaDedutivel, color: 'var(--emerald-600)' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '16px 18px', borderRadius: '12px', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--slate-700)' }}>{item.label}</span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: item.color }}>{formatMZN(item.value)}</span>
                </div>
              ))}

              <div style={{ padding: '20px 24px', borderRadius: '14px', background: result.status === 'a_pagar' ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' : 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)', border: `1.5px solid ${result.status === 'a_pagar' ? '#F59E0B' : '#10B981'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: result.status === 'a_pagar' ? '#92400E' : '#065F46' }}>
                    {result.status === 'a_pagar' ? 'IVA a Pagar' : 'IVA a Recuperar (Crédito)'}
                  </h3>
                </div>
                <span style={{ fontSize: '24px', fontWeight: 900, color: result.status === 'a_pagar' ? '#92400E' : '#065F46' }}>
                  {formatMZN(Math.abs(result.ivaApurado))}
                </span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '16px' }}>
              Memória de Cálculo
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {result.lines.map((line, i) => (
                <div key={i} style={{ padding: '14px 18px', backgroundColor: 'var(--slate-50)', borderRadius: '10px', borderLeft: `4px solid ${line.kind === 'total' ? 'var(--blue-600)' : 'var(--slate-300)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--slate-800)' }}>{line.label}</span>
                    <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>{line.formula}</p>
                  </div>
                  <span style={{ fontSize: '14.5px', fontWeight: 800, color: line.kind === 'total' ? 'var(--blue-600)' : 'var(--slate-900)' }}>
                    {formatMZN(line.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </SimulatorLayout>
  );
};
