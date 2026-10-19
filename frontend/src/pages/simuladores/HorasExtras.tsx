import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { ArrowRight, Info, CheckCircle2 } from 'lucide-react';
import { SimulatorLayout } from '../../components/simulators/SimulatorLayout';
import { getSimulatorBySlug } from '../../components/simulators/simulatorCatalog';
import { calcLineLabel, calcLineFormula } from '../../components/simulators/calcLines';
import { buildSimulationReport, localizeCalcLines, totalFromLines } from '../../components/simulators/simulationReport';
import { useSimulatorPrint } from '../../hooks/useSimulatorPrint';
import { useSimulatorRules } from '../../hooks/useFiscalQueries';
import { calculateHorasExtras } from '../../lib/calculations/mocambique';
import { formatMZN } from '../../utils/formatters';

interface Props {
  onNavigate: (path: string) => void;
}

export const HorasExtras: React.FC<Props> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [salarioBase, setSalarioBase] = useState('');
  const [horasNormaisMes, setHorasNormaisMes] = useState('208');
  const [horasDiurnas, setHorasDiurnas] = useState('0');
  const [horasNocturnas, setHorasNocturnas] = useState('0');
  const [horasFds, setHorasFds] = useState('0');

  const s = getSimulatorBySlug('horas-extras', t);

  const { rules } = useSimulatorRules(['OVERTIME_RATES']);

  const result = calculateHorasExtras(
    {
      salarioBase: Number(salarioBase) || 0,
      horasNormaisMes: Number(horasNormaisMes) || 208,
      horasDiurnas: Number(horasDiurnas) || 0,
      horasNocturnas: Number(horasNocturnas) || 0,
      horasFds: Number(horasFds) || 0,
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
        slug: 'horas-extras',
        title: s?.title ?? t('simuladores:simExtraHoursTitle'),
        lines: localizeCalcLines(t, result.lines),
        total: totalFromLines(result.lines, result.totalHorasExtras),
        totalLabel: t('simuladores:reportTotalLabel'),
      })
    );
  };

  return (
    <SimulatorLayout
      onNavigate={onNavigate}
      categoria="Laboral (RH)"
      nome={s?.title ?? ''}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onPrint={currentStep >= 2 ? handlePrint : undefined}
    >
      {currentStep === 1 && (
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '20px' }}>
            {t('simuladores:overtimeDataTitle')}
          </h2>

          <form onSubmit={handleCalculate}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">{t('simuladores:overtimeBaseSalaryLabel')}</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder={t('simuladores:overtimeBaseSalaryPlaceholder')}
                    value={salarioBase}
                    onChange={(e) => setSalarioBase(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('simuladores:overtimeNormalHoursLabel')}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={horasNormaisMes}
                    onChange={(e) => setHorasNormaisMes(e.target.value)}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--slate-400)', marginTop: '2px' }}>
                    {t('simuladores:overtimeNormalHoursHint')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">{t('simuladores:overtimeDayHoursLabel')}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={horasDiurnas}
                    onChange={(e) => setHorasDiurnas(e.target.value)}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--slate-400)', marginTop: '2px' }}>
                    {t('simuladores:overtimeDayHint')}
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('simuladores:overtimeNightHoursLabel')}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={horasNocturnas}
                    onChange={(e) => setHorasNocturnas(e.target.value)}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--slate-400)', marginTop: '2px' }}>
                    {t('simuladores:overtimeNightHint')}
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('simuladores:overtimeWeekendHoursLabel')}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={horasFds}
                    onChange={(e) => setHorasFds(e.target.value)}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--slate-400)', marginTop: '2px' }}>
                    {t('simuladores:overtimeWeekendHint')}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--blue-50)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '24px' }}>
              <Info size={20} color="var(--blue-600)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E3A8A' }}>{t('simuladores:legalBannerTitle')}</h4>
                <p style={{ fontSize: '12.5px', color: '#1E40AF', marginTop: '2px', lineHeight: 1.4 }}>
                  <Trans i18nKey="simuladores:overtimeInfoText" components={[<b key="b1" />, <b key="b2" />, <b key="b3" />, <b key="b4" />, <b key="b5" />]} />
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary-blue btn-lg">
                <span>{t('simuladores:overtimeCalculateButton')}</span>
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
                {t('simuladores:overtimeResultsTitle')}
              </h3>
              <span className="badge badge-green" style={{ fontSize: '11.5px' }}>
                <CheckCircle2 size={13} />
                <span>{t('simuladores:calcOkBadge')}</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '16px 18px', borderRadius: '12px', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--slate-700)' }}>{t('simuladores:calclineHourlyValue')}</span>
                  <p style={{ fontSize: '12px', color: 'var(--slate-400)' }}>
                    {formatMZN(Number(salarioBase) || 0)} ÷ {horasNormaisMes}h
                  </p>
                </div>
                <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)' }}>{formatMZN(result.valorHora)}</span>
              </div>

              {[
                { label: t('simuladores:overtimeDayRow', { hours: horasDiurnas || 0 }), value: result.valorDiurno },
                { label: t('simuladores:overtimeNightRow', { hours: horasNocturnas || 0 }), value: result.valorNocturno },
                { label: t('simuladores:overtimeWeekendRow', { hours: horasFds || 0 }), value: result.valorFds },
              ].map((item, i) => (
                <div key={i} style={{ padding: '16px 18px', borderRadius: '12px', backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--slate-700)' }}>{item.label}</span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)' }}>{formatMZN(item.value)}</span>
                </div>
              ))}

              <div style={{ padding: '20px 24px', borderRadius: '14px', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', border: '1.5px solid #2563EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E3A8A' }}>
                    {t('simuladores:overtimeTotalTitle')}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#1E40AF', marginTop: '2px' }}>
                    {t('simuladores:calcfDayPlusNightPlusWeekend')}
                  </p>
                </div>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#1E3A8A' }}>{formatMZN(result.totalHorasExtras)}</span>
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