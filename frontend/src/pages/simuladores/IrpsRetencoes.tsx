import React, { useState } from 'react';
import { ArrowRight, Info, CheckCircle2 } from 'lucide-react';
import { SimulatorLayout } from '../../components/simulators/SimulatorLayout';
import { calculateIrpsRetencoes } from '../../lib/calculations/mocambique';
import { formatMZN } from '../../utils/formatters';

interface Props {
  onNavigate: (path: string) => void;
}

export const IrpsRetencoes: React.FC<Props> = ({ onNavigate }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [salarioBruto, setSalarioBruto] = useState('');
  const [outrosRendimentos, setOutrosRendimentos] = useState('0');
  const [inssDescontado, setInssDescontado] = useState('');

  const inssCalc = (Number(salarioBruto) || 0) * 0.03;
  const inssFinal = inssDescontado ? Number(inssDescontado) : inssCalc;

  const result = calculateIrpsRetencoes({
    salarioBruto: Number(salarioBruto) || 0,
    outrosRendimentos: Number(outrosRendimentos) || 0,
    inssDescontado: inssFinal,
  });

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep(2);
  };

  return (
    <SimulatorLayout
      onNavigate={onNavigate}
      categoria="Fiscal"
      nome="IRPS – Retenções"
      currentStep={currentStep}
      onStepChange={setCurrentStep}
    >
      {currentStep === 1 && (
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '20px' }}>
            1. Dados do Trabalhador
          </h2>

          <form onSubmit={handleCalculate}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Salário Bruto Mensal (MZN)</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  placeholder="Remuneração mensal bruta"
                  value={salarioBruto}
                  onChange={(e) => setSalarioBruto(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">INSS Descontado (MZN)</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  placeholder={inssCalc ? `Calculado automaticamente: ${inssCalc.toFixed(2)}` : '3% do salário bruto'}
                  value={inssDescontado}
                  onChange={(e) => setInssDescontado(e.target.value)}
                />
                <span style={{ fontSize: '11px', color: 'var(--slate-400)', marginTop: '2px' }}>
                  Se deixar vazio, será calculado automaticamente (3%)
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Outros Rendimentos (MZN)</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  value={outrosRendimentos}
                  onChange={(e) => setOutrosRendimentos(e.target.value)}
                />
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--blue-50)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '24px' }}>
              <Info size={20} color="var(--blue-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E3A8A' }}>Importante</h4>
                <p style={{ fontSize: '12.5px', color: '#1E40AF', marginTop: '2px', lineHeight: 1.4 }}>
                  A retenção mensal de IRPS é calculada com base na <b>tabela progressiva 2024</b> sobre a
                  matéria coletável (Bruto − INSS). O desconto por dependente é de <b>250 MT</b> por dependente.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary-blue btn-lg">
                <span>Calcular IRPS</span>
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
                Resultado do IRPS
              </h3>
              <span className="badge badge-green" style={{ fontSize: '11.5px' }}>
                <CheckCircle2 size={13} />
                <span>Cálculo concluído</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Salário Bruto', value: Number(salarioBruto) || 0, color: 'var(--slate-900)' },
                { label: 'INSS Trabalhador (3%)', value: inssFinal, color: 'var(--red-600)' },
                { label: 'Matéria Coletável', value: result.materiaColetavel, color: 'var(--slate-900)' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '16px 18px', borderRadius: '12px', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--slate-700)' }}>{item.label}</span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: item.color }}>{formatMZN(item.value)}</span>
                </div>
              ))}

              <div style={{ padding: '20px 24px', borderRadius: '14px', background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', border: '1.5px solid #F59E0B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#92400E' }}>IRPS a Retirar</h3>
                  <p style={{ fontSize: '12px', color: '#B45309', marginTop: '2px' }}>
                    Taxa efetiva: {result.irpsEfetivo.toFixed(2)}%
                  </p>
                </div>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#92400E' }}>{formatMZN(result.irpsFinal)}</span>
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
