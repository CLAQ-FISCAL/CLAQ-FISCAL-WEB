import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { ArrowRight, Info, CheckCircle2 } from 'lucide-react';
import { SimulatorLayout } from '../../components/simulators/SimulatorLayout';
import { getSimulatorBySlug } from '../../components/simulators/simulatorCatalog';
import { calcLineLabel, calcLineFormula } from '../../components/simulators/calcLines';
import { buildSimulationReport, localizeCalcLines, totalFromLines } from '../../components/simulators/simulationReport';
import { useSimulatorPrint } from '../../hooks/useSimulatorPrint';
import { useSimulatorRules } from '../../hooks/useFiscalQueries';
import { calculateJurosMultas } from '../../lib/calculations/mocambique';
import { formatMZN, formatDate } from '../../utils/formatters';

interface Props {
  onNavigate: (path: string) => void;
}

export const JurosMultas: React.FC<Props> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [impostoAtraso, setImpostoAtraso] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [dataPagamento, setDataPagamento] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [taxaMulta, setTaxaMulta] = useState('0.02');

  const s = getSimulatorBySlug('juros-multas', t);

  const { rules } = useSimulatorRules(['PENALTY_RATES']);

  const result = calculateJurosMultas(
    {
      impostoAtraso: Number(impostoAtraso) || 0,
      dataVencimento,
      dataPagamento,
      taxaMulta: Number(taxaMulta),
    },
    rules
  );

  const printReport = useSimulatorPrint();

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep(2);
  };

  const handlePrint = () => {
    printReport(
      buildSimulationReport({
        slug: 'juros-multas',
        title: s?.title ?? t('simuladores:simFinesTitle'),
        meta: [{ label: t('simuladores:finesDueDateLabel'), value: formatDate(dataVencimento) }],
        lines: localizeCalcLines(t, result.lines),
        total: totalFromLines(result.lines, result.totalPagar),
        totalLabel: t('simuladores:finesTotalToPayTitle'),
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
      onPrint={currentStep >= 2 ? handlePrint : undefined}
    >
      {currentStep === 1 && (
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '20px' }}>
            {t('simuladores:finesDataTitle')}
          </h2>

          <form onSubmit={handleCalculate}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">{t('simuladores:finesOverdueTaxLabel')}</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  placeholder={t('simuladores:finesTaxAmountPlaceholder')}
                  value={impostoAtraso}
                  onChange={(e) => setImpostoAtraso(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">{t('simuladores:finesDueDateLabel')}</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('simuladores:finesPaymentDateLabel')}</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dataPagamento}
                    onChange={(e) => setDataPagamento(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('simuladores:finesMonthlyRateLabel')}</label>
                <select className="form-control" value={taxaMulta} onChange={(e) => setTaxaMulta(e.target.value)}>
                  <option value="0.02">{t('simuladores:finesRate2pct')}</option>
                  <option value="0.03">{t('simuladores:finesRate3pct')}</option>
                </select>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--red-50)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '24px' }}>
              <Info size={20} color="var(--red-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#991B1B' }}>{t('simuladores:legalBannerTitle')}</h4>
                <p style={{ fontSize: '12.5px', color: '#B91C1C', marginTop: '2px', lineHeight: 1.4 }}>
                  <Trans i18nKey="simuladores:finesInfoText" components={[<b key="b1" />, <b key="b2" />]} />
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary-blue btn-lg">
                <span>{t('simuladores:finesCalculateButton')}</span>
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
                {t('simuladores:finesResultsTitle')}
              </h3>
              <span className="badge badge-green" style={{ fontSize: '11.5px' }}>
                <CheckCircle2 size={13} />
                <span>{t('simuladores:calcOkBadge')}</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '16px 18px', borderRadius: '12px', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--slate-700)' }}>{t('simuladores:finesDaysLateLabel')}</span>
                  <p style={{ fontSize: '12px', color: 'var(--slate-400)' }}>{t('simuladores:finesMonthsSub', { count: result.mesesAtraso })}</p>
                </div>
                <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--red-600)' }}>
                  {result.diasAtraso} {t('simuladores:days')}
                </span>
              </div>

              {[
                { label: t('simuladores:finesImpostoOriginalRow'), value: Number(impostoAtraso) || 0, color: 'var(--slate-900)' },
                { label: t('simuladores:finesFineMultiplierRow', { count: result.mesesAtraso }), value: result.multa, color: 'var(--red-600)' },
                { label: t('simuladores:finesInterestSimpleRow'), value: result.juros, color: 'var(--red-600)' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '16px 18px', borderRadius: '12px', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--slate-700)' }}>{item.label}</span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: item.color }}>{formatMZN(item.value)}</span>
                </div>
              ))}

              <div style={{ padding: '20px 24px', borderRadius: '14px', background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)', border: '1.5px solid #EF4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#991B1B' }}>
                    {t('simuladores:finesTotalToPayTitle')}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#B91C1C', marginTop: '2px' }}>
                    {t('simuladores:calcfTaxPlusFinePlusInterest')}
                  </p>
                </div>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#991B1B' }}>{formatMZN(result.totalPagar)}</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '16px' }}>
              {t('simuladores:calcMemoTitle')}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {result.lines.map((line, i) => (
                <div key={i} style={{ padding: '14px 18px', backgroundColor: 'var(--slate-50)', borderRadius: '10px', borderLeft: `4px solid ${line.kind === 'total' ? 'var(--blue-600)' : 'var(--slate-300)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--slate-800)' }}>{calcLineLabel(t, line.label)}</span>
                    <p style={{ fontSize: '12px', color: 'var(--slate-500)' }}>{calcLineFormula(t, line.formula)}</p>
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