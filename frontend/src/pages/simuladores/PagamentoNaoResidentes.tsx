import React, { useState } from 'react';
import { ArrowRight, Info, CheckCircle2, DollarSign, TrendingUp, Percent, Briefcase } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { SimulatorLayout } from '../../components/simulators/SimulatorLayout';
import { calculatePagamentoNaoResidentes, MOCK_EXCHANGE_RATES } from '../../lib/calculations/mocambique';
import { formatMZN } from '../../utils/formatters';

interface Props {
  onNavigate: (path: string) => void;
}

export const PagamentoNaoResidentes: React.FC<Props> = ({ onNavigate }) => {
  const { user, saveSimulation, openPDFPreview, addToast } = useAppState();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const [prestador, setPrestador] = useState('');
  const [pais, setPais] = useState('Estados Unidos');
  const [moeda, setMoeda] = useState('USD');
  const [valorFatura, setValorFatura] = useState('');
  const [cambiaDia, setCambiaDia] = useState('63.75');
  const [dataPagamento, setDataPagamento] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [descricao, setDescricao] = useState('');

  const result = calculatePagamentoNaoResidentes({
    prestador: prestador || 'Google LLC',
    pais,
    moeda,
    valorFatura: Number(valorFatura) || 10000,
    cambiaDia: Number(cambiaDia) || 63.75,
    dataPagamento,
    descricao,
  });

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep(2);
    addToast('success', 'Cálculo Concluído', 'Impostos calculados com base na legislação moçambicana.');
  };

  const handleFetchRate = () => {
    const rate = MOCK_EXCHANGE_RATES[moeda] || 63.75;
    setCambiaDia(rate.toFixed(2));
    addToast('info', 'Câmbio Actualizado', `Câmbio oficial ${moeda}/MZN: ${rate.toFixed(2)}`);
  };

  const handleSave = () => {
    saveSimulation({
      simulatorId: 'pagamento-nao-residentes',
      simulatorTitle: 'Pagamento de Serviços a Não Residentes',
      date: dataPagamento,
      clientName: prestador,
      currency: moeda,
      originalAmount: Number(valorFatura),
      exchangeRate: Number(cambiaDia),
      mznAmount: result.valorMZN,
      factor: 1.25,
      taxBase: result.contraValor,
      ivaAmount: result.iva,
      ivaRate: 16,
      irpcAmount: result.irpcRetido,
      irpcRate: 20,
      totalTax: result.totalImposto,
      providerCountry: pais,
      description: descricao,
      status: 'concluido',
      responsibleName: user?.name || 'Administrador',
    });
    addToast('success', 'Simulação Guardada', 'Registo adicionado ao histórico.');
  };

  const handlePrint = () => {
    const rec = saveSimulation({
      simulatorId: 'pagamento-nao-residentes',
      simulatorTitle: 'Pagamento de Serviços a Não Residentes',
      date: dataPagamento,
      clientName: prestador,
      currency: moeda,
      originalAmount: Number(valorFatura),
      exchangeRate: Number(cambiaDia),
      mznAmount: result.valorMZN,
      factor: 1.25,
      taxBase: result.contraValor,
      ivaAmount: result.iva,
      ivaRate: 16,
      irpcAmount: result.irpcRetido,
      irpcRate: 20,
      totalTax: result.totalImposto,
      providerCountry: pais,
      description: descricao,
      status: 'concluido',
      responsibleName: user?.name || 'Administrador',
    });
    openPDFPreview(rec);
  };

  return (
    <SimulatorLayout
      onNavigate={onNavigate}
      categoria="Fiscal"
      nome="Pagamento ao Exterior"
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onSave={handleSave}
      onPrint={handlePrint}
    >
      {/* STEP 1: INPUTS */}
      {currentStep === 1 && (
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '20px' }}>
            1. Informações do Pagamento
          </h2>

          <form onSubmit={handleCalculate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '18px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Prestador do Serviço</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nome do prestador (Ex: Google LLC, Amazon AWS)"
                  value={prestador}
                  onChange={(e) => setPrestador(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">País do Prestador</label>
                  <select className="form-control" value={pais} onChange={(e) => setPais(e.target.value)}>
                    <option value="Estados Unidos">Estados Unidos (EUA)</option>
                    <option value="África do Sul">África do Sul</option>
                    <option value="Portugal">Portugal</option>
                    <option value="Reino Unido">Reino Unido</option>
                    <option value="Brasil">Brasil</option>
                    <option value="Emirados Árabes Unidos">Emirados Árabes Unidos</option>
                    <option value="China">China</option>
                    <option value="Outro">Outro País</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Moeda da Fatura</label>
                  <select
                    className="form-control"
                    value={moeda}
                    onChange={(e) => {
                      setMoeda(e.target.value);
                      setCambiaDia((MOCK_EXCHANGE_RATES[e.target.value] || 63.75).toFixed(2));
                    }}
                  >
                    <option value="USD">USD – Dólar Americano</option>
                    <option value="EUR">EUR – Euro</option>
                    <option value="ZAR">ZAR – Rand Sul-Africano</option>
                    <option value="GBP">GBP – Libra Esterlina</option>
                    <option value="MZN">MZN – Metical Moçambicano</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Valor da Fatura</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    value={valorFatura}
                    onChange={(e) => setValorFatura(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">Câmbio do Dia (MZN)</label>
                    <button
                      type="button"
                      onClick={handleFetchRate}
                      style={{ border: 'none', background: 'none', color: 'var(--blue-600)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Obter câmbio
                    </button>
                  </div>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    value={cambiaDia}
                    onChange={(e) => setCambiaDia(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '11px', color: 'var(--slate-400)', marginTop: '2px' }}>
                    Fonte: Banco de Moçambique
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Data do Pagamento</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dataPagamento}
                    onChange={(e) => setDataPagamento(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição (opcional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Consultoria técnica, licença cloud"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Importante */}
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
                  Este simulador aplica as taxas padrão: <b>IVA (16%)</b> e <b>IRPC (20%)</b> sobre o{' '}
                  <b>Contra-Valor (fator 1,25)</b> conforme a legislação tributária moçambicana vigente
                  (Lei n.º 1/2018 e Lei n.º 34/2014).
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary-blue btn-lg">
                <span>Calcular Impostos</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2 & 3: RESULTS */}
      {currentStep >= 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)' }}>
                Resumo dos Cálculos
              </h3>
              <span className="badge badge-green" style={{ fontSize: '11.5px' }}>
                <CheckCircle2 size={13} />
                <span>Cálculo concluído com sucesso</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: DollarSign, label: 'Valor em Meticais', sub: `${valorFatura || 10000} ${moeda} × ${cambiaDia || 63.75}`, value: result.valorMZN, iconBg: 'var(--emerald-50)', iconColor: 'var(--emerald-600)' },
                { icon: TrendingUp, label: 'Contra Valor (Fator 1,25)', sub: 'Base de incidência para cálculo dos impostos', value: result.contraValor, iconBg: 'var(--blue-50)', iconColor: 'var(--blue-600)' },
                { icon: Percent, label: 'IVA a Pagar (16%)', sub: 'Imposto sobre o Valor Acrescentado', value: result.iva, iconBg: '#FAF5FF', iconColor: '#7E22CE' },
                { icon: Briefcase, label: 'IRPC Retido na Fonte (20%)', sub: 'Imposto sobre o Rendimento das Pessoas Colectivas', value: result.irpcRetido, iconBg: 'var(--emerald-50)', iconColor: 'var(--emerald-600)' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '16px 18px', borderRadius: '12px', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: item.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <item.icon size={18} color={item.iconColor} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--slate-800)' }}>{item.label}</h4>
                      <p style={{ fontSize: '11.5px', color: 'var(--slate-400)' }}>{item.sub}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: item.iconColor }}>{formatMZN(item.value)}</span>
                </div>
              ))}

              {/* Total */}
              <div style={{ padding: '20px 24px', borderRadius: '14px', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', border: '1.5px solid #2563EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E3A8A' }}>Total de Impostos a Pagar</h3>
                  <p style={{ fontSize: '12px', color: '#1E40AF', marginTop: '2px' }}>
                    IVA ({formatMZN(result.iva)}) + IRPC ({formatMZN(result.irpcRetido)})
                  </p>
                </div>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#1E3A8A' }}>{formatMZN(result.totalImposto)}</span>
              </div>
            </div>
          </div>

          {/* Memória de Cálculo */}
          <div className="card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '16px' }}>
              Memória de Cálculo
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {result.lines.map((line, i) => (
                <div key={i} style={{ padding: '14px 18px', backgroundColor: 'var(--slate-50)', borderRadius: '10px', borderLeft: `4px solid ${line.kind === 'total' ? 'var(--blue-600)' : line.kind === 'debit' ? '#7E22CE' : 'var(--slate-300)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: line.kind === 'total' ? 'var(--blue-600)' : line.kind === 'debit' ? '#7E22CE' : 'var(--slate-400)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                      {i + 1}
                    </div>
                    <div>
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--slate-800)' }}>{line.label}</span>
                      <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>{line.formula}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '14.5px', fontWeight: 800, color: line.kind === 'total' ? 'var(--blue-600)' : line.kind === 'debit' ? '#7E22CE' : 'var(--slate-900)' }}>
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
