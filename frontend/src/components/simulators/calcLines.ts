import type { TFunction } from 'i18next';

const STATIC_LABEL_KEYS: Record<string, string> = {
  'Antiguidade': 'simuladores:calclineSeniority',
  'Arrendamento (2%)': 'simuladores:calclineStampArrendamento',
  'Base Tributável': 'simuladores:calclineTaxableBaseAct',
  'Contra-Valor (Fator 1,25)': 'simuladores:calclineCounterValue',
  'Dias de Direito': 'simuladores:calclineEntitledDays',
  'Garantias (0,3%)': 'simuladores:calclineStampGuarantias',
  'INSS Patronal (4%)': 'simuladores:calclineInssEmployer',
  'INSS Trabalhador (3%)': 'simuladores:calclineInssWorker',
  'IRPC Mensal (Rateio)': 'simuladores:calclineIrpcMonthly',
  'IRPC Retido (20%)': 'simuladores:calclineIrpcWithheld20',
  'IRPS (Escalões Progressivos)': 'simuladores:calclineIrpsBrackets',
  'IVA (16%)': 'simuladores:calclineIva16',
  'IVA Liquidado': 'simuladores:calclineIvaCharged',
  'IVA Suportado (Dedutível)': 'simuladores:calclineIvaInputDed',
  'Imposto em Atraso': 'simuladores:calclineTaxOverdue',
  'Indemnização Estimada': 'simuladores:calclineEstimatedIndemnity',
  'Jogos e Apostas (10%)': 'simuladores:calclineStampJogos',
  'Lucro Tributável': 'simuladores:calclineTaxableProfit',
  'Matéria Coletável': 'simuladores:calclineTaxableBase',
  'Matéria Coletável IRPS': 'simuladores:calclineTaxableBaseIrps',
  'Média Diária': 'simuladores:calclineDailyAverage',
  'Outros Atos (0,5%)': 'simuladores:calclineStampOutros',
  'Remuneração Bruta': 'simuladores:calclineGrossPay',
  'Salário Líquido': 'simuladores:calclineNetSalary',
  'Total Dias Indemnização': 'simuladores:calclineTotalTermDays',
  'Total Horas Extras': 'simuladores:calclineOvertimeTotal',
  'Total Mensal INSS': 'simuladores:calclineInssTotal',
  'Total a Pagar': 'simuladores:calclineTotalDue',
  'Total de Impostos': 'simuladores:calclineTotalTaxes',
  'Transmissão de Imóveis (10%)': 'simuladores:calclineStampTransmissao',
  'Valor da Hora Normal': 'simuladores:calclineHourlyValue',
  'Valor das Férias': 'simuladores:calclineVacationValue',
  'Valor em MZN': 'simuladores:calclineValueMzn',
};

const INNER_LABEL_KEYS: Record<string, string> = {
  'Termo a Certo sem Justa Causa': 'simuladores:calclineMotivoCerto',
  'Termo Indeterminado — Despedimento': 'simuladores:calclineMotivoIndeterminado',
  'Pedido de Demissão': 'simuladores:calclineMotivoDemissao',
  'Justa Causa': 'simuladores:calclineMotivoJustaCausa',
  'Não especificado': 'simuladores:calclineMotivoNaoEspec',
  'Garantias (0,3%)': 'simuladores:calclineStampGuarantias',
  'Arrendamento (2%)': 'simuladores:calclineStampArrendamento',
  'Jogos e Apostas (10%)': 'simuladores:calclineStampJogos',
  'Transmissão de Imóveis (10%)': 'simuladores:calclineStampTransmissao',
  'Outros Atos (0,5%)': 'simuladores:calclineStampOutros',
};

const STATIC_FORMULA_KEYS: Record<string, string> = {
  'Base + Subsídios + Horas Extras + Bónus': 'simuladores:calcfGrossComposition',
  'Bruto − INSS': 'simuladores:calcfGrossMinusInss',
  'Bruto − INSS − IRPS': 'simuladores:calcfGrossMinusInssMinusIrps',
  'Cálculo por escalões tabela 2024': 'simuladores:calcfBrackets2024',
  'Diurnas + Nócturnas + FDS': 'simuladores:calcfDayPlusNightPlusWeekend',
  'IVA + IRPC Retido': 'simuladores:calcfIvaPlusIrpc',
  'IVA Liquidado − IVA Suportado': 'simuladores:calcfVatChargedMinusInput',
  'Imposto + Multa + Juros': 'simuladores:calcfTaxPlusFinePlusInterest',
  'Tabela 2024': 'simuladores:calcfTable2024',
  'Trabalhador + Patronal': 'simuladores:calcfWorkerPlusEmployer',
  'Valor do Ato/Contrato': 'simuladores:calcfActValue',
  'Valor introduzido': 'simuladores:calcfEnteredValue',
};

const INTERPOLATED_LABEL_PATTERNS: Array<
  [RegExp, string, (m: RegExpExecArray) => Record<string, string>]
> = [
  [
    /^Dias por Ano \((.+)\)$/,
    'simuladores:calclineDaysPerYear',
    m => ({ label: innerLabel(m[1]) }),
  ],
  [
    /^Horas Extras Diurnas \(([\d.,\s]+)h × ([\d.,]+)\)$/,
    'simuladores:calclineOvertimeDay',
    m => ({ hours: m[1], mult: m[2] }),
  ],
  [
    /^Horas Extras Nócturnas \(([\d.,\s]+)h × ([\d.,]+)\)$/,
    'simuladores:calclineOvertimeNight',
    m => ({ hours: m[1], mult: m[2] }),
  ],
  [
    /^Horas Extras Fim-de-Semana \(([\d.,\s]+)h × ([\d.,]+)\)$/,
    'simuladores:calclineOvertimeWeekend',
    m => ({ hours: m[1], mult: m[2] }),
  ],
  [
    /^IRPC Estimado \(([\d.,]+)%\)$/,
    'simuladores:calclineIrpcEstimated',
    m => ({ pct: m[1] }),
  ],
  [
    /^Imposto do Selo \((.+)\)$/,
    'simuladores:calclineStampDuty',
    m => ({ label: innerLabel(m[1]) }),
  ],
  [
    /^Juros de Mora \(([\d.,]+) dias\)$/,
    'simuladores:calclineLateInterest',
    m => ({ count: m[1] }),
  ],
  [
    /^Multa \(([\d.,]+) meses × 2%\)$/,
    'simuladores:calclineFine',
    m => ({ count: m[1] }),
  ],
];

const innerLabel = (raw: string): string =>
  INNER_LABEL_KEYS[raw] ?? STATIC_LABEL_KEYS[raw] ?? raw;

export const calcLineLabel = (t: TFunction, label: string): string => {
  const staticKey = STATIC_LABEL_KEYS[label];
  if (staticKey) return t(staticKey);
  for (const [pattern, key, vars] of INTERPOLATED_LABEL_PATTERNS) {
    const match = pattern.exec(label);
    if (match) return t(key, vars(match));
  }
  return label;
};

export const calcLineFormula = (t: TFunction, formula: string): string => {
  const key = STATIC_FORMULA_KEYS[formula];
  if (key) return t(key);
  return formula;
};

export const translateSeloLabel = (t: TFunction, label: string): string => {
  const key = INNER_LABEL_KEYS[label] ?? STATIC_LABEL_KEYS[label];
  return key ? t(key) : label;
};

export const translateIndemnityReason = (
  t: TFunction,
  label: string
): string => {
  const key = INNER_LABEL_KEYS[label];
  return key ? t(key) : label;
};