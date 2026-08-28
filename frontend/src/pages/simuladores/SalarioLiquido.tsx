import React, { useState } from 'react';
import { ArrowRight, Info, CheckCircle2 } from 'lucide-react';
import { SimulatorLayout } from '../../components/simulators/SimulatorLayout';
import { calculateSalarioLiquido } from '../../lib/calculations/mocambique';
import { formatMZN } from '../../utils/formatters';

interface Props {
  onNavigate: (path: string) => void;
}

export const SalarioLiquido: React.FC<Props> = ({ onNavigate }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [salarioBase, setSalarioBase] = useState('');
  const [subsidios, setSubsidios] = useState('');
  const [horasExtras, setHorasExtras] = useState('');
  const [bonus, setBonus] = useState('');

  const result = calculateSalarioLiquido({
    salarioBase: Number(salarioBase) || 0,
    subsidios: Number(subsidios) || 0,
    horasExtras: Number(horasExtras) || 0,
    bonus: Number(bonus) || 0,
  });

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep(2);
  };

  return (
    <SimulatorLayout
      onNavigate={onNavigate}
      categoria="Laboral (RH)"
      nome="Salário Líquido"
      currentStep={currentStep}
      onStepChange={setCurrentStep}
    >
      {currentStep === 1 && (
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '20px' }}>
            1. Dados da Remuneração
          </h2>

          <form onSubmit={handleCalculate}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Salário Base (MZN)</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  placeholder="Salário base mensal"
                  value={salarioBase}
                  onChange={(e) => setSalarioBase(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Subsídios (MZN)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="Transporte + Alimentação"
                    value={subsidios}
                    onChange={(e) => setSubsidios(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Horas Extras (MZN)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="Valor das horas extras"
                    value={horasExtras}
                    onChange={(e) => setHorasExtras(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Bónus (MZN)</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  placeholder="Prémios e bónus"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                />
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--blue-50)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '24px' }}>
              <Info size={20} color="var(--blue-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E3A8A' }}>Importante</h4>
                <p style={{ fontSize: '12.5px', color: '#1E40AF', marginTop: '2px', lineHeight: 1.4 }}>
                  O salário líquido é o <b>Bruto − INSS (3%) − IRPS (tabela progressiva)</b>. Os subsídios
                  de transporte e alimentação são isentos de IRPS até aos limites legais.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary-blue btn-lg">
                <span>Calcular Salário Líquido</span>
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
                Folha Salarial
              </h3>
              <span className="badge badge-green" style={{ fontSize: '11.5px' }}>
                <CheckCircle2 size={13} />
                <span>Cálculo concluído</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Remuneração Bruta', value: result.bruto, color: 'var(--slate-900)' },
                { label: 'INSS Trabalhador (3%)', value: result.inss, color: 'var(--red-600)', negative: true },
                { label: 'Retenção IRPS', value: result.irps, color: 'var(--red-600)', negative: true },
              ].map((item, i) => (
                <div key={i} style={{ padding: '16px 18px', borderRadius: '12px', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--slate-700)' }}>{item.label}</span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: item.color }}>
                    {item.negative ? '− ' : ''}{formatMZN(item.value)}
                  </span>
                </div>
              ))}

              <div style={{ padding: '20px 24px', borderRadius: '14px', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', border: '1.5px solid #2563EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E3A8A' }}>
                    Salário Líquido do Trabalhador
                  </h3>
                  <p style={{ fontSize: '12px', color: '#1E40AF', marginTop: '2px' }}>
                    Bruto − INSS − IRPS
                  </p>
                </div>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#1E3A8A' }}>{formatMZN(result.liquido)}</span>
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