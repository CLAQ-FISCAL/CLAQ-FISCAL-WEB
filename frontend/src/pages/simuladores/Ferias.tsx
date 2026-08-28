import React, { useState } from 'react';
import { ArrowRight, Info, CheckCircle2 } from 'lucide-react';
import { SimulatorLayout } from '../../components/simulators/SimulatorLayout';
import { calculateFerias } from '../../lib/calculations/mocambique';
import { formatMZN } from '../../utils/formatters';

interface Props {
  onNavigate: (path: string) => void;
}

export const Ferias: React.FC<Props> = ({ onNavigate }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [dataAdmissao, setDataAdmissao] = useState('');
  const [salarioBase, setSalarioBase] = useState('');
  const [diasGozados, setDiasGozados] = useState('0');

  const result = calculateFerias({
    dataAdmissao,
    salarioBase: Number(salarioBase) || 0,
    diasGozados: Number(diasGozados) || 0,
  });

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep(2);
  };

  return (
    <SimulatorLayout
      onNavigate={onNavigate}
      categoria="Laboral (RH)"
      nome="Férias"
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
                <label className="form-label">Data de Admissão</label>
                <input
                  type="date"
                  className="form-control"
                  value={dataAdmissao}
                  onChange={(e) => setDataAdmissao(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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

                <div className="form-group">
                  <label className="form-label">Dias de Férias Gozados</label>
                  <input
                    type="number"
                    className="form-control"
                    value={diasGozados}
                    onChange={(e) => setDiasGozados(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--blue-50)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '24px' }}>
              <Info size={20} color="var(--blue-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E3A8A' }}>Importante</h4>
                <p style={{ fontSize: '12.5px', color: '#1E40AF', marginTop: '2px', lineHeight: 1.4 }}>
                  Conforme o <b>art. 98 da Lei do Trabalho (Lei n.º 23/2007)</b>, o trabalhador tem direito a{' '}
                  <b>12 dias de férias no 1º ano</b> e <b>30 dias nos anos seguintes</b>. O subsídio de férias
                  corresponde ao valor das férias.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary-blue btn-lg">
                <span>Calcular Férias</span>
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
                Resultado das Férias
              </h3>
              <span className="badge badge-green" style={{ fontSize: '11.5px' }}>
                <CheckCircle2 size={13} />
                <span>Cálculo concluído</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Dias de Direito (Art. 98 LTM)', value: `${result.diasDireito} dias`, color: 'var(--slate-900)' },
                { label: 'Média Diária', value: formatMZN(result.mediaDiaria), color: 'var(--slate-900)' },
                { label: 'Valor das Férias', value: formatMZN(result.valorFerias), color: 'var(--blue-600)' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '16px 18px', borderRadius: '12px', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--slate-700)' }}>{item.label}</span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: item.color }}>{item.value}</span>
                </div>
              ))}

              <div style={{ padding: '20px 24px', borderRadius: '14px', background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)', border: '1.5px solid #10B981', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#065F46' }}>
                    Subsídio de Férias (100%)
                  </h3>
                  <p style={{ fontSize: '12px', color: '#047857', marginTop: '2px' }}>
                    Valor das férias + subsídio
                  </p>
                </div>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#065F46' }}>{formatMZN(result.subsidioFerias)}</span>
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
                    {line.kind === 'info' && line.label === 'Dias de Direito' ? `${line.value} dias` : formatMZN(line.value)}
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