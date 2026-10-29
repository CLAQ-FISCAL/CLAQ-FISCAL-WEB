// Funções puras de cálculo fiscal para Moçambique
// Cada função é independente — sem partilha de estado entre simuladores
//
// As taxas são injectadas via `CalcRules` (valores aprovados obtidos do
// backend em `GET /v1/rules/{code}`). Quando nenhuma regra é fornecida,
// recorre-se a DEFAULT_CALC_RULES como fallback offline.

import {
  DEFAULT_CALC_RULES,
  type CalcRules,
  type IrpsBracket,
} from './calcRules';

// Câmbios de referência (Banco de Moçambique)
export const MOCK_EXCHANGE_RATES: Record<string, number> = {
  USD: 63.75,
  EUR: 69.4,
  ZAR: 3.52,
  GBP: 81.2,
  MZN: 1.0,
};

export interface CalcLine {
  label: string;
  formula: string;
  value: number;
  kind: 'info' | 'debit' | 'credit' | 'total';
}

// Formata uma taxa (0.16) como percentagem pt-MZ sem zeros supérfluos: "16", "17,25"
const pct = (rate: number): string =>
  (rate * 100).toLocaleString('pt-MZ', { maximumFractionDigits: 2 });

// ─── A) Pagamento de Serviços a Não Residentes ──────────────────────────────
// Ref: Lei n.º 32/2007 (IVA) e Lei n.º 34/2007 (IRPC)

export interface PagamentoNaoResidentesInput {
  prestador: string;
  pais: string;
  moeda: string;
  valorFatura: number;
  cambiaDia: number;
  dataPagamento: string;
  descricao?: string;
}

export interface PagamentoNaoResidentesResult {
  valorMZN: number;
  contraValor: number;
  iva: number;
  irpcRetido: number;
  totalImposto: number;
  custoTotal: number;
  lines: CalcLine[];
}

export function calculatePagamentoNaoResidentes(
  input: PagamentoNaoResidentesInput,
  rules: CalcRules = DEFAULT_CALC_RULES
): PagamentoNaoResidentesResult {
  const { grossUpFactor, vatRate, withholdingRate } = rules.nonResident;
  const valorMZN = input.valorFatura * input.cambiaDia;
  const contraValor = valorMZN * grossUpFactor;
  const iva = contraValor * vatRate;
  const irpcRetido = contraValor * withholdingRate;
  const totalImposto = iva + irpcRetido;
  const custoTotal = valorMZN + totalImposto;

  return {
    valorMZN,
    contraValor,
    iva,
    irpcRetido,
    totalImposto,
    custoTotal,
    lines: [
      {
        label: 'Valor em MZN',
        formula: `${input.valorFatura.toLocaleString('pt-MZ')} ${input.moeda} × ${input.cambiaDia}`,
        value: valorMZN,
        kind: 'info',
      },
      {
        label: `Contra-Valor (Fator ${grossUpFactor.toLocaleString('pt-MZ')})`,
        formula: `${valorMZN.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} × ${grossUpFactor.toLocaleString('pt-MZ')}`,
        value: contraValor,
        kind: 'info',
      },
      {
        label: `IVA (${pct(vatRate)}%)`,
        formula: `${contraValor.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} × ${pct(vatRate)}%`,
        value: iva,
        kind: 'debit',
      },
      {
        label: `IRPC Retido (${pct(withholdingRate)}%)`,
        formula: `${contraValor.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} × ${pct(withholdingRate)}%`,
        value: irpcRetido,
        kind: 'debit',
      },
      {
        label: 'Total de Impostos',
        formula: 'IVA + IRPC Retido',
        value: totalImposto,
        kind: 'total',
      },
    ],
  };
}

// ─── B) IVA — Operações ──────────────────────────────────────────────────────

export interface IvaOperacoesInput {
  baseTributavel: number;
  taxaIva: number;
  ivaSuportado: number;
}

export interface IvaOperacoesResult {
  ivaLiquidado: number;
  ivaDedutivel: number;
  ivaApurado: number;
  status: 'a_pagar' | 'credito_iva';
  lines: CalcLine[];
}

export function calculateIvaOperacoes(
  input: IvaOperacoesInput,
  _rules: CalcRules = DEFAULT_CALC_RULES
): IvaOperacoesResult {
  const ivaLiquidado = input.baseTributavel * input.taxaIva;
  const ivaDedutivel = input.ivaSuportado;
  const ivaApurado = ivaLiquidado - ivaDedutivel;
  const status = ivaApurado >= 0 ? 'a_pagar' : 'credito_iva';

  return {
    ivaLiquidado,
    ivaDedutivel,
    ivaApurado,
    status,
    lines: [
      {
        label: 'IVA Liquidado',
        formula: `${input.baseTributavel.toLocaleString('pt-MZ')} × ${(input.taxaIva * 100).toFixed(0)}%`,
        value: ivaLiquidado,
        kind: 'info',
      },
      {
        label: 'IVA Suportado (Dedutível)',
        formula: 'Valor introduzido',
        value: ivaDedutivel,
        kind: 'credit',
      },
      {
        label: status === 'a_pagar' ? 'IVA a Pagar' : 'IVA a Recuperar',
        formula: 'IVA Liquidado − IVA Suportado',
        value: Math.abs(ivaApurado),
        kind: 'total',
      },
    ],
  };
}

// ─── C) IRPS — Retenções (Rendimentos de Trabalho) ───────────────────────────
// Tabela progressiva IRPS 2024 — Moçambique

export interface IrpsRetencoesInput {
  salarioBruto: number;
  outrosRendimentos: number;
  inssDescontado: number;
}

export interface IrpsRetencoesResult {
  materiaColetavel: number;
  irpsBruto: number;
  irpsFinal: number;
  irpsEfetivo: number;
  lines: CalcLine[];
}

// Tabela progressiva mensal IRPS Moçambique (valores em MZN)
// Valores por omissão vivem em calcRules.ts (DEFAULT_IRPS_BRACKETS).

export function computeIrpsProgressivo(
  base: number,
  brackets: IrpsBracket[] = DEFAULT_CALC_RULES.irpsBrackets
): number {
  let irps = 0;
  let lower = 0;
  for (const bracket of brackets) {
    if (base <= lower) break;
    const upper = bracket.upto ?? Infinity;
    const taxable = Math.min(base, upper) - lower;
    if (taxable > 0) irps += taxable * bracket.rate;
    if (bracket.upto === null) break;
    lower = bracket.upto;
  }
  return irps;
}

export function calculateIrpsRetencoes(
  input: IrpsRetencoesInput,
  rules: CalcRules = DEFAULT_CALC_RULES
): IrpsRetencoesResult {
  const materiaColetavel = Math.max(
    0,
    input.salarioBruto - input.inssDescontado
  );
  const irpsBruto = computeIrpsProgressivo(materiaColetavel, rules.irpsBrackets);
  // Dedução por dependentes: 250 MT por dependente (máx. IRPS)
  const deducao = Math.min(irpsBruto, 0); // sem dependentes no input simples
  const irpsFinal = Math.max(0, irpsBruto - deducao);
  const irpsEfetivo =
    input.salarioBruto > 0 ? (irpsFinal / input.salarioBruto) * 100 : 0;

  return {
    materiaColetavel,
    irpsBruto,
    irpsFinal,
    irpsEfetivo,
    lines: [
      {
        label: 'Matéria Coletável',
        formula: `${input.salarioBruto.toLocaleString('pt-MZ')} − ${input.inssDescontado.toLocaleString('pt-MZ')} (INSS)`,
        value: materiaColetavel,
        kind: 'info',
      },
      {
        label: 'IRPS (Escalões Progressivos)',
        formula: 'Cálculo por escalões tabela 2024',
        value: irpsFinal,
        kind: 'total',
      },
    ],
  };
}

// ─── D) IRPC — Estimativa ────────────────────────────────────────────────────

export interface IrpcEstimativaInput {
  volumeNegocios: number;
  lucroTributavel: number;
  taxaIrpc: number;
}

export interface IrpcEstimativaResult {
  irpcEstimado: number;
  irpcMensal: number;
  lines: CalcLine[];
}

export function calculateIrpcEstimativa(
  input: IrpcEstimativaInput,
  _rules: CalcRules = DEFAULT_CALC_RULES
): IrpcEstimativaResult {
  const irpcEstimado = input.lucroTributavel * input.taxaIrpc;
  const irpcMensal = irpcEstimado / 12;

  return {
    irpcEstimado,
    irpcMensal,
    lines: [
      {
        label: 'Lucro Tributável',
        formula: 'Valor introduzido',
        value: input.lucroTributavel,
        kind: 'info',
      },
      {
        label: `IRPC Estimado (${pct(input.taxaIrpc)}%)`,
        formula: `${input.lucroTributavel.toLocaleString('pt-MZ')} × ${pct(input.taxaIrpc)}%`,
        value: irpcEstimado,
        kind: 'debit',
      },
      {
        label: 'IRPC Mensal (Rateio)',
        formula: `${irpcEstimado.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} ÷ 12`,
        value: irpcMensal,
        kind: 'total',
      },
    ],
  };
}

// ─── E) INSS — Contribuições ─────────────────────────────────────────────────

export interface InssContribuicoesInput {
  salarioBruto: number;
  nrTrabalhadores?: number;
}

export interface InssContribuicoesResult {
  inssTrabalhador: number;
  inssPatronal: number;
  totalInss: number;
  lines: CalcLine[];
}

export function calculateInssContribuicoes(
  input: InssContribuicoesInput,
  rules: CalcRules = DEFAULT_CALC_RULES
): InssContribuicoesResult {
  const { employeeRate, employerRate } = rules.inss;
  const inssTrabalhador = input.salarioBruto * employeeRate;
  const inssPatronal = input.salarioBruto * employerRate;
  const totalInss = inssTrabalhador + inssPatronal;

  return {
    inssTrabalhador,
    inssPatronal,
    totalInss,
    lines: [
      {
        label: `INSS Trabalhador (${pct(employeeRate)}%)`,
        formula: `${input.salarioBruto.toLocaleString('pt-MZ')} × ${pct(employeeRate)}%`,
        value: inssTrabalhador,
        kind: 'debit',
      },
      {
        label: `INSS Patronal (${pct(employerRate)}%)`,
        formula: `${input.salarioBruto.toLocaleString('pt-MZ')} × ${pct(employerRate)}%`,
        value: inssPatronal,
        kind: 'debit',
      },
      {
        label: 'Total Mensal INSS',
        formula: 'Trabalhador + Patronal',
        value: totalInss,
        kind: 'total',
      },
    ],
  };
}

// ─── F) Juros e Multas ───────────────────────────────────────────────────────
// Ref: Lei Geral Tributária (Lei n.º 2/2006)

export interface JurosMultasInput {
  impostoAtraso: number;
  dataVencimento: string;
  dataPagamento: string;
  taxaMulta?: number;
}

export interface JurosMultasResult {
  diasAtraso: number;
  mesesAtraso: number;
  multa: number;
  juros: number;
  totalPagar: number;
  lines: CalcLine[];
}

export function calculateJurosMultas(
  input: JurosMultasInput,
  rules: CalcRules = DEFAULT_CALC_RULES
): JurosMultasResult {
  const { annualInterestRate, fineRate: ruleFineRate } = rules.penalty;
  const fineRate = input.taxaMulta ?? ruleFineRate;
  const dataVenc = new Date(input.dataVencimento);
  const dataPag = new Date(input.dataPagamento);
  const diffMs = dataPag.getTime() - dataVenc.getTime();
  const diasAtraso = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const mesesAtraso = Math.ceil(diasAtraso / 30);

  // Multa: taxa mensal sobre o imposto em atraso
  const multa = input.impostoAtraso * fineRate * mesesAtraso;
  // Juros: taxa anual / 360 × dias
  const juros = input.impostoAtraso * (annualInterestRate / 360) * diasAtraso;
  const totalPagar = input.impostoAtraso + multa + juros;

  return {
    diasAtraso,
    mesesAtraso,
    multa,
    juros,
    totalPagar,
    lines: [
      {
        label: 'Imposto em Atraso',
        formula: 'Valor introduzido',
        value: input.impostoAtraso,
        kind: 'info',
      },
      {
        label: `Multa (${mesesAtraso} meses × ${pct(fineRate)}%)`,
        formula: `${input.impostoAtraso.toLocaleString('pt-MZ')} × ${pct(fineRate)}% × ${mesesAtraso}`,
        value: multa,
        kind: 'debit',
      },
      {
        label: `Juros de Mora (${diasAtraso} dias)`,
        formula: `${input.impostoAtraso.toLocaleString('pt-MZ')} × (${pct(annualInterestRate)}% ÷ 360) × ${diasAtraso}`,
        value: juros,
        kind: 'debit',
      },
      {
        label: 'Total a Pagar',
        formula: 'Imposto + Multa + Juros',
        value: totalPagar,
        kind: 'total',
      },
    ],
  };
}

// ─── G) Imposto de Selo ──────────────────────────────────────────────────────
// Tabela I — Tipos e Taxas

export type ImpostoSeloTipo =
  | 'garantias'
  | 'arrendamento'
  | 'jogos'
  | 'transmissao_imoveis'
  | 'outros';

export const IMPOSTO_SELO_TAXAS: Record<
  ImpostoSeloTipo,
  { label: string; taxa: number }
> = {
  garantias: { label: 'Garantias (0,3%)', taxa: 0.003 },
  arrendamento: { label: 'Arrendamento (2%)', taxa: 0.02 },
  jogos: { label: 'Jogos e Apostas (10%)', taxa: 0.10 },
  transmissao_imoveis: { label: 'Transmissão de Imóveis (10%)', taxa: 0.10 },
  outros: { label: 'Outros Atos (0,5%)', taxa: 0.005 },
};

export interface ImpostoSeloInput {
  valorActo: number;
  tipo: string;
}

export interface ImpostoSeloResult {
  impostoSelo: number;
  taxaAplicada: number;
  tipoLabel: string;
  lines: CalcLine[];
}

export function calculateImpostoSelo(
  input: ImpostoSeloInput,
  rules: CalcRules = DEFAULT_CALC_RULES
): ImpostoSeloResult {
  const config = rules.stampDuty.find((entry) => entry.code === input.tipo);
  const taxaAplicada =
    config?.rate ?? IMPOSTO_SELO_TAXAS[input.tipo as ImpostoSeloTipo]?.taxa ?? 0;
  const tipoLabel =
    config?.label ?? IMPOSTO_SELO_TAXAS[input.tipo as ImpostoSeloTipo]?.label ?? input.tipo;
  const impostoSelo = input.valorActo * taxaAplicada;

  return {
    impostoSelo,
    taxaAplicada,
    tipoLabel,
    lines: [
      {
        label: 'Base Tributável',
        formula: 'Valor do Ato/Contrato',
        value: input.valorActo,
        kind: 'info',
      },
      {
        label: `Imposto do Selo (${tipoLabel})`,
        formula: `${input.valorActo.toLocaleString('pt-MZ')} × ${(taxaAplicada * 100).toFixed(1)}%`,
        value: impostoSelo,
        kind: 'total',
      },
    ],
  };
}

// ─── H) Salário Líquido ──────────────────────────────────────────────────────

export interface SalarioLiquidoInput {
  salarioBase: number;
  subsidios: number;
  horasExtras: number;
  bonus: number;
}

export interface SalarioLiquidoResult {
  bruto: number;
  inss: number;
  materiaIrps: number;
  irps: number;
  liquido: number;
  lines: CalcLine[];
}

export function calculateSalarioLiquido(
  input: SalarioLiquidoInput,
  rules: CalcRules = DEFAULT_CALC_RULES
): SalarioLiquidoResult {
  const { employeeRate } = rules.inss;
  const bruto = input.salarioBase + input.subsidios + input.horasExtras + input.bonus;
  const inss = bruto * employeeRate;
  const materiaIrps = Math.max(0, bruto - inss);
  const irps = computeIrpsProgressivo(materiaIrps, rules.irpsBrackets);
  const liquido = bruto - inss - irps;

  return {
    bruto,
    inss,
    materiaIrps,
    irps,
    liquido,
    lines: [
      {
        label: 'Remuneração Bruta',
        formula: 'Base + Subsídios + Horas Extras + Bónus',
        value: bruto,
        kind: 'info',
      },
      {
        label: `INSS Trabalhador (${pct(employeeRate)}%)`,
        formula: `${bruto.toLocaleString('pt-MZ')} × ${pct(employeeRate)}%`,
        value: inss,
        kind: 'debit',
      },
      {
        label: 'Matéria Coletável IRPS',
        formula: 'Bruto − INSS',
        value: materiaIrps,
        kind: 'info',
      },
      {
        label: 'IRPS (Escalões Progressivos)',
        formula: 'Tabela 2024',
        value: irps,
        kind: 'debit',
      },
      {
        label: 'Salário Líquido',
        formula: 'Bruto − INSS − IRPS',
        value: liquido,
        kind: 'total',
      },
    ],
  };
}

// ─── I) Horas Extras ─────────────────────────────────────────────────────────

export interface HorasExtrasInput {
  salarioBase: number;
  horasNormaisMes: number;
  horasDiurnas: number;
  horasNocturnas: number;
  horasFds: number;
}

export interface HorasExtrasResult {
  valorHora: number;
  valorDiurno: number;
  valorNocturno: number;
  valorFds: number;
  totalHorasExtras: number;
  lines: CalcLine[];
}

export function calculateHorasExtras(
  input: HorasExtrasInput,
  rules: CalcRules = DEFAULT_CALC_RULES
): HorasExtrasResult {
  const { weekday, night, weekend } = rules.overtime;
  const horasNormais = input.horasNormaisMes || 208;
  const valorHora = input.salarioBase / horasNormais;
  const valorDiurno = valorHora * weekday * input.horasDiurnas;
  const valorNocturno = valorHora * night * input.horasNocturnas;
  const valorFds = valorHora * weekend * input.horasFds;
  const totalHorasExtras = valorDiurno + valorNocturno + valorFds;

  return {
    valorHora,
    valorDiurno,
    valorNocturno,
    valorFds,
    totalHorasExtras,
    lines: [
      {
        label: 'Valor da Hora Normal',
        formula: `${input.salarioBase.toLocaleString('pt-MZ')} ÷ ${horasNormais}h`,
        value: valorHora,
        kind: 'info',
      },
      {
        label: `Horas Extras Diurnas (${input.horasDiurnas}h × ${weekday.toLocaleString('pt-MZ')})`,
        formula: `${valorHora.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} × ${weekday.toLocaleString('pt-MZ')} × ${input.horasDiurnas}`,
        value: valorDiurno,
        kind: 'debit',
      },
      {
        label: `Horas Extras Nócturnas (${input.horasNocturnas}h × ${night.toLocaleString('pt-MZ')})`,
        formula: `${valorHora.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} × ${night.toLocaleString('pt-MZ')} × ${input.horasNocturnas}`,
        value: valorNocturno,
        kind: 'debit',
      },
      {
        label: `Horas Extras Fim-de-Semana (${input.horasFds}h × ${weekend.toLocaleString('pt-MZ')})`,
        formula: `${valorHora.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} × ${weekend.toLocaleString('pt-MZ')} × ${input.horasFds}`,
        value: valorFds,
        kind: 'debit',
      },
      {
        label: 'Total Horas Extras',
        formula: 'Diurnas + Nócturnas + FDS',
        value: totalHorasExtras,
        kind: 'total',
      },
    ],
  };
}

// ─── J) Férias ───────────────────────────────────────────────────────────────
// Art. 98 LTM: 12 dias no 1º ano, 30 dias nos seguintes

export interface FeriasInput {
  dataAdmissao: string;
  salarioBase: number;
  diasGozados: number;
}

export interface FeriasResult {
  diasDireito: number;
  mediaDiaria: number;
  valorFerias: number;
  subsidioFerias: number;
  lines: CalcLine[];
}

export function calculateFerias(input: FeriasInput): FeriasResult {
  const dataAdmissao = new Date(input.dataAdmissao);
  const hoje = new Date();
  const mesesTrabalhados =
    (hoje.getFullYear() - dataAdmissao.getFullYear()) * 12 +
    (hoje.getMonth() - dataAdmissao.getMonth());
  const anosCompletos = Math.floor(mesesTrabalhados / 12);

  // Art. 98 LTM: 12 dias no 1º ano, 30 dias seguintes
  const diasDireito = anosCompletos === 0 ? 12 : 30;
  const mediaDiaria = input.salarioBase / 30;
  const valorFerias = mediaDiaria * diasDireito;
  const subsidioFerias = valorFerias; // 100%

  return {
    diasDireito,
    mediaDiaria,
    valorFerias,
    subsidioFerias,
    lines: [
      {
        label: 'Dias de Direito',
        formula: anosCompletos === 0 ? '1º ano (Art. 98 LTM)' : 'Anos seguintes (Art. 98 LTM)',
        value: diasDireito,
        kind: 'info',
      },
      {
        label: 'Média Diária',
        formula: `${input.salarioBase.toLocaleString('pt-MZ')} ÷ 30`,
        value: mediaDiaria,
        kind: 'info',
      },
      {
        label: 'Valor das Férias',
        formula: `${mediaDiaria.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} × ${diasDireito} dias`,
        value: valorFerias,
        kind: 'total',
      },
    ],
  };
}

// ─── K) Indemnização (Cessação de Contrato) ──────────────────────────────────

export type MotivoCessacao =
  | 'termo_certo_sem_justa_causa'
  | 'termo_indeterminado_despedimento'
  | 'pedido_demissao'
  | 'justa_causa';

export interface IndemnizacaoInput {
  salarioBase: number;
  dataInicio: string;
  dataFim: string;
  motivo: MotivoCessacao;
}

export interface IndemnizacaoResult {
  antiguidadeAnos: number;
  diasPorAno: number;
  totalDias: number;
  indemnizacao: number;
  motivoLabel: string;
  lines: CalcLine[];
}

export function calculateIndemnizacao(
  input: IndemnizacaoInput
): IndemnizacaoResult {
  const dataInicio = new Date(input.dataInicio);
  const dataFim = new Date(input.dataFim);
  const diffMs = dataFim.getTime() - dataInicio.getTime();
  const antiguidadeAnos = Math.max(0, diffMs / (365.25 * 24 * 60 * 60 * 1000));

  // Dias por ano conforme motivo (LTM Moçambique)
  let diasPorAno: number;
  let motivoLabel: string;
  switch (input.motivo) {
    case 'termo_certo_sem_justa_causa':
      diasPorAno = 30;
      motivoLabel = 'Termo a Certo sem Justa Causa';
      break;
    case 'termo_indeterminado_despedimento':
      diasPorAno = 45; // Novo LTM (pós-2018)
      motivoLabel = 'Termo Indeterminado — Despedimento';
      break;
    case 'pedido_demissao':
      diasPorAno = 0;
      motivoLabel = 'Pedido de Demissão';
      break;
    case 'justa_causa':
      diasPorAno = 0;
      motivoLabel = 'Justa Causa';
      break;
    default:
      diasPorAno = 30;
      motivoLabel = 'Não especificado';
  }

  const totalDias = antiguidadeAnos * diasPorAno;
  const indemnizacao = (input.salarioBase / 30) * totalDias;

  return {
    antiguidadeAnos,
    diasPorAno,
    totalDias,
    indemnizacao,
    motivoLabel,
    lines: [
      {
        label: 'Antiguidade',
        formula: `${antiguidadeAnos.toFixed(1)} anos`,
        value: antiguidadeAnos,
        kind: 'info',
      },
      {
        label: `Dias por Ano (${motivoLabel})`,
        formula: `${diasPorAno} dias/ano`,
        value: diasPorAno,
        kind: 'info',
      },
      {
        label: 'Total Dias Indemnização',
        formula: `${antiguidadeAnos.toFixed(1)} × ${diasPorAno}`,
        value: totalDias,
        kind: 'info',
      },
      {
        label: 'Indemnização Estimada',
        formula: `(${input.salarioBase.toLocaleString('pt-MZ')} ÷ 30) × ${totalDias.toFixed(1)}`,
        value: indemnizacao,
        kind: 'total',
      },
    ],
  };
}
