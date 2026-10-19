import React, { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { ArrowRight, Info, CheckCircle2, DollarSign, TrendingUp, Percent, Briefcase } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { SimulatorLayout } from '../../components/simulators/SimulatorLayout';
import { getSimulatorBySlug } from '../../components/simulators/simulatorCatalog';
import { calcLineLabel, calcLineFormula } from '../../components/simulators/calcLines';
import { calculatePagamentoNaoResidentes, MOCK_EXCHANGE_RATES } from '../../lib/calculations/mocambique';
import { buildSimulationReport } from '../../components/simulators/simulationReport';
import { formatMZN } from '../../utils/formatters';
import { useExchangeRates, useSimulatorRules } from '../../hooks/useFiscalQueries';

interface Props {
  onNavigate: (path: string) => void;
}

export const PagamentoNaoResidentes: React.FC<Props> = ({ onNavigate }) => {
  const { t } = useTranslation();
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

  // Official Banco de Moçambique rates (X-Tenant not required; public endpoint)
  const ratesQuery = useExchangeRates(moeda, currentStep === 1);
  const officialRate = (): number | null => {
    const match = ratesQuery.data?.rates?.find(r => r.target === 'MZN');
    const value = match ? Number(match.rate) : NaN;
    return Number.isFinite(value) && value > 0 ? value : null;
  };

  // Auto-fill the daily rate from the official source when it becomes available
  useEffect(() => {
    const official = officialRate();
    if (official && currentStep === 1) {
      setCambiaDia(official.toFixed(2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratesQuery.data, moeda]);

  const { rules } = useSimulatorRules(['NONRESIDENT_SERVICE']);

  const result = calculatePagamentoNaoResidentes(
    {
      prestador: prestador || 'Google LLC',
      pais,
      moeda,
      valorFatura: Number(valorFatura) || 10000,
      cambiaDia: Number(cambiaDia) || 63.75,
      dataPagamento,
      descricao,
    },
    rules
  );

  const s = getSimulatorBySlug('pagamento-nao-residentes', t);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep(2);
    addToast(
      'success',
      t('simuladores:toastCalcDoneTitle'),
      t('simuladores:toastCalcDoneMsg')
    );
  };

  const handleFetchRate = () => {
    const rate = officialRate() ?? MOCK_EXCHANGE_RATES[moeda] ?? 63.75;
    setCambiaDia(rate.toFixed(2));
    addToast(
      'info',
      t('simuladores:toastExchangeUpdatedTitle'),
      t('simuladores:toastExchangeUpdatedMsg', {
        currency: moeda,
        rate: rate.toFixed(2),
      })
    );
  };

  const handleSave = () => {
    saveSimulation({
      simulatorId: 'pagamento-nao-residentes',
      simulatorTitle: t('simuladores:simNonResidentTitle'),
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
      responsibleName: user?.name || t('simuladores:administrator'),
    });
    addToast(
      'success',
      t('simuladores:toastSimSavedTitle'),
      t('simuladores:toastSimSavedMsg')
    );
  };

  const handlePrint = () => {
    saveSimulation({
      simulatorId: 'pagamento-nao-residentes',
      simulatorTitle: t('simuladores:simNonResidentTitle'),
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
      responsibleName: user?.name || t('simuladores:administrator'),
    });
    openPDFPreview(
      buildSimulationReport({
        slug: 'pagamento-nao-residentes',
        title: t('simuladores:simNonResidentTitle'),
        date: dataPagamento,
        clientName: prestador || t('simuladores:administrator'),
        responsibleName: user?.name || t('simuladores:administrator'),
        currency: 'MZN',
        meta: [
          { label: t('simuladores:providerCountryLabel'), value: pais },
          { label: t('simuladores:invoiceCurrencyLabel'), value: moeda },
          { label: t('simuladores:invoiceAmountLabel'), value: formatMZN(Number(valorFatura) * Number(cambiaDia)) },
          { label: t('simuladores:exchangeRateLabel'), value: cambiaDia },
        ],
        lines: result.lines.map((l) => ({
          label: calcLineLabel(t, l.label),
          formula: calcLineFormula(t, l.formula),
          value: l.value,
          kind: l.kind,
        })),
        total: result.totalImposto,
        totalLabel: t('pdf:totalTaxes'),
        legalBasis: [t('pdf:legalIVA'), t('pdf:legalIRPC'), t('pdf:legalCircular')],
      })
    );
  };

  return (
    <SimulatorLayout
      onNavigate={onNavigate}
      categoria="Fiscal"
      nome={s?.title ?? ''}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onSave={handleSave}
      onPrint={handlePrint}
    >
      {/* STEP 1: INPUTS */}
      {currentStep === 1 && (
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '20px' }}>
            {t('simuladores:step1Title')}
          </h2>

          <form onSubmit={handleCalculate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '18px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">{t('simuladores:providerLabel')}</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t('simuladores:providerPlaceholder')}
                  value={prestador}
                  onChange={(e) => setPrestador(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">{t('simuladores:providerCountryLabel')}</label>
                  <select className="form-control" value={pais} onChange={(e) => setPais(e.target.value)}>
                    <option value="Estados Unidos">{t('simuladores:countryOptionUS')}</option>
                    <option value="África do Sul">{t('simuladores:countryOptionZA')}</option>
                    <option value="Portugal">{t('simuladores:countryOptionPT')}</option>
                    <option value="Reino Unido">{t('simuladores:countryOptionGB')}</option>
                    <option value="Brasil">{t('simuladores:countryOptionBR')}</option>
                    <option value="Emirados Árabes Unidos">{t('simuladores:countryOptionAE')}</option>
                    <option value="China">{t('simuladores:countryOptionCN')}</option>
                    <option value="Outro">{t('simuladores:countryOptionOTHER')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('simuladores:invoiceCurrencyLabel')}</label>
                  <select
                    className="form-control"
                    value={moeda}
                    onChange={(e) => {
                      setMoeda(e.target.value);
                      setCambiaDia((MOCK_EXCHANGE_RATES[e.target.value] || 63.75).toFixed(2));
                    }}
                  >
                    <option value="USD">{t('simuladores:currencyUSD')}</option>
                    <option value="EUR">{t('simuladores:currencyEUR')}</option>
                    <option value="ZAR">{t('simuladores:currencyZAR')}</option>
                    <option value="GBP">{t('simuladores:currencyGBP')}</option>
                    <option value="MZN">{t('simuladores:currencyMZN')}</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">{t('simuladores:invoiceAmountLabel')}</label>
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
                    <label className="form-label">{t('simuladores:exchangeRateLabel')}</label>
                    <button
                      type="button"
                      onClick={handleFetchRate}
                      style={{ border: 'none', background: 'none', color: 'var(--blue-600)', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {t('simuladores:fetchExchangeRate')}
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
                    {t('simuladores:exchangeRateSource')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">{t('simuladores:paymentDateLabel')}</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dataPagamento}
                    onChange={(e) => setDataPagamento(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('simuladores:descriptionLabel')}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t('simuladores:descriptionPlaceholder')}
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
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E3A8A' }}>{t('simuladores:legalBannerTitle')}</h4>
                <p style={{ fontSize: '12.5px', color: '#1E40AF', marginTop: '2px', lineHeight: 1.4 }}>
                  <Trans i18nKey="simuladores:legalBanner" components={[<b key="b1" />, <b key="b2" />, <b key="b3" />]} />
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary-blue btn-lg">
                <span>{t('simuladores:calculateButton')}</span>
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
                {t('simuladores:resultsSummaryTitle')}
              </h3>
              <span className="badge badge-green" style={{ fontSize: '11.5px' }}>
                <CheckCircle2 size={13} />
                <span>{t('simuladores:calcDoneBadge')}</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                {
                  icon: DollarSign,
                  label: t('simuladores:resultsMznValueTitle'),
                  sub: t('simuladores:resultsMznValueSubtitle', {
                    amount: valorFatura || 10000,
                    currency: moeda,
                    rate: cambiaDia || 63.75,
                  }),
                  value: result.valorMZN,
                  iconBg: 'var(--emerald-50)',
                  iconColor: 'var(--emerald-600)',
                },
                {
                  icon: TrendingUp,
                  label: t('simuladores:resultsTaxBaseTitle'),
                  sub: t('simuladores:resultsTaxBaseSubtitle'),
                  value: result.contraValor,
                  iconBg: 'var(--blue-50)',
                  iconColor: 'var(--blue-600)',
                },
                {
                  icon: Percent,
                  label: t('simuladores:resultsIvaTitle'),
                  sub: t('simuladores:resultsIvaSubtitle'),
                  value: result.iva,
                  iconBg: '#FAF5FF',
                  iconColor: '#7E22CE',
                },
                {
                  icon: Briefcase,
                  label: t('simuladores:resultsIrpcTitle'),
                  sub: t('simuladores:resultsIrpcSubtitle'),
                  value: result.irpcRetido,
                  iconBg: 'var(--emerald-50)',
                  iconColor: 'var(--emerald-600)',
                },
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
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E3A8A' }}>{t('simuladores:totalTaxTitle')}</h3>
                  <p style={{ fontSize: '12px', color: '#1E40AF', marginTop: '2px' }}>
                    {t('simuladores:traceStep5Desc', {
                      iva: formatMZN(result.iva),
                      irpc: formatMZN(result.irpcRetido),
                    })}
                  </p>
                </div>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#1E3A8A' }}>{formatMZN(result.totalImposto)}</span>
              </div>
            </div>
          </div>

          {/* Memória de Cálculo */}
          <div className="card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '16px' }}>
              {t('simuladores:calcMemoTitle')}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {result.lines.map((line, i) => (
                <div key={i} style={{ padding: '14px 18px', backgroundColor: 'var(--slate-50)', borderRadius: '10px', borderLeft: `4px solid ${line.kind === 'total' ? 'var(--blue-600)' : line.kind === 'debit' ? '#7E22CE' : 'var(--slate-300)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: line.kind === 'total' ? 'var(--blue-600)' : line.kind === 'debit' ? '#7E22CE' : 'var(--slate-400)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                      {i + 1}
                    </div>
                    <div>
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--slate-800)' }}>{calcLineLabel(t, line.label)}</span>
                      <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>{calcLineFormula(t, line.formula)}</p>
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