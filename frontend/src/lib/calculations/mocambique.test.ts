import { describe, it, expect } from 'vitest';
import {
  calculatePagamentoNaoResidentes,
  calculateIvaOperacoes,
  calculateIrpsRetencoes,
  calculateIrpcEstimativa,
  calculateInssContribuicoes,
  calculateJurosMultas,
  calculateImpostoSelo,
  calculateSalarioLiquido,
  calculateHorasExtras,
  calculateFerias,
  calculateIndemnizacao,
} from './mocambique';

describe('calculatePagamentoNaoResidentes', () => {
  // Ex: Fatura USD 10.000 × câmbio 63,75 = 637.500 MZN
  // Contra-valor = 637.500 × 1,25 = 796.875
  // IVA = 796.875 × 0,16 = 127.500
  // IRPC = 796.875 × 0,20 = 159.375
  // Total = 286.875
  it('calcula contra-valor, IVA e IRPC corretamente', () => {
    const r = calculatePagamentoNaoResidentes({
      prestador: 'Google LLC',
      pais: 'Estados Unidos',
      moeda: 'USD',
      valorFatura: 10000,
      cambiaDia: 63.75,
      dataPagamento: '2026-01-15',
      descricao: '',
    });
    expect(r.valorMZN).toBe(637500);
    expect(r.contraValor).toBe(796875);
    expect(r.iva).toBe(127500);
    expect(r.irpcRetido).toBe(159375);
    expect(r.totalImposto).toBe(286875);
    expect(r.custoTotal).toBe(924375);
    expect(r.lines.length).toBeGreaterThan(0);
  });
});

describe('calculateIvaOperacoes', () => {
  // Ex: Base 850.000 × 16% = 136.000 liquidado; suportado 51.200 → a pagar 84.800
  it('calcula IVA a pagar quando liquidado > suportado', () => {
    const r = calculateIvaOperacoes({
      baseTributavel: 850000,
      taxaIva: 0.16,
      ivaSuportado: 51200,
    });
    expect(r.ivaLiquidado).toBe(136000);
    expect(r.ivaApurado).toBe(84800);
    expect(r.status).toBe('a_pagar');
  });

  // Ex: suportado 140.000 > liquidado 136.000 → crédito de IVA 4.000
  it('calcula crédito de IVA quando suportado > liquidado', () => {
    const r = calculateIvaOperacoes({
      baseTributavel: 850000,
      taxaIva: 0.16,
      ivaSuportado: 140000,
    });
    expect(r.ivaApurado).toBe(-4000);
    expect(r.status).toBe('credito_iva');
    expect(Math.abs(r.ivaApurado)).toBe(4000);
  });
});

describe('calculateIrpsRetencoes', () => {
  // Ex: Bruto 120.000 − INSS 3.600 = matéria 116.400
  // IRPS: (20.750×0) + (116.400−20.750)×0,10 ... tabela progressiva 2024
  it('aplica a tabela progressiva e retém IRPS', () => {
    const bruto = 120000;
    const inss = bruto * 0.03;
    const r = calculateIrpsRetencoes({
      salarioBruto: bruto,
      outrosRendimentos: 0,
      inssDescontado: inss,
    });
    expect(r.materiaColetavel).toBeCloseTo(bruto - inss, 6);

    // Matéria 116.400 → tabela: até 20.750 isento (0),
    // 20.750–40.999: (40.999,99−20.750)×10% ≈ 2.024,999
    // 41.000–80.999: (80.999,99−41.000)×15% ≈ 5.999,9985
    // 81.000–116.400: (116.400−81.000)×20% = 7.080
    const esperado = 2024.999 + 5999.9985 + 7080;
    expect(r.irpsFinal).toBeCloseTo(esperado, 1);
  });

  it('não retém imposto para matéria até ao mínimo de isenção', () => {
    const r = calculateIrpsRetencoes({
      salarioBruto: 18000,
      outrosRendimentos: 0,
      inssDescontado: 540,
    });
    expect(r.irpsFinal).toBe(0);
  });
});

describe('calculateIrpcEstimativa', () => {
  // Ex: Lucro 5.000.000 × 32% = 1.600.000; mensal 133.333,33
  it('calcula IRPC estimado e rateio mensal', () => {
    const r = calculateIrpcEstimativa({
      volumeNegocios: 20000000,
      lucroTributavel: 5000000,
      taxaIrpc: 0.32,
    });
    expect(r.irpcEstimado).toBe(1600000);
    expect(r.irpcMensal).toBeCloseTo(1600000 / 12, 2);
  });

  // Taxa reduzida agricultura 10%
  it('aplica taxa reduzida de 10% para agricultura', () => {
    const r = calculateIrpcEstimativa({
      volumeNegocios: 5000000,
      lucroTributavel: 800000,
      taxaIrpc: 0.1,
    });
    expect(r.irpcEstimado).toBe(80000);
  });
});

describe('calculateInssContribuicoes', () => {
  // Ex: 120.000 → trabalhador 3.600, patronal 4.800, total 8.400
  it('calcula contribuições de 3% e 4%', () => {
    const r = calculateInssContribuicoes({
      salarioBruto: 120000,
      nrTrabalhadores: 1,
    });
    expect(r.inssTrabalhador).toBe(3600);
    expect(r.inssPatronal).toBe(4800);
    expect(r.totalInss).toBe(8400);
  });
});

describe('calculateJurosMultas', () => {
  // Ex: Imposto 127.500 em atraso 90 dias
  // Meses = ceil(90/30) = 3 → multa = 127.500 × 2% × 3 = 7.650
  // Juros = 127.500 × (17,25%/360) × 90 = 5.496,09
  it('calcula multa de 2%/mês e juros à taxa BM', () => {
    const r = calculateJurosMultas({
      impostoAtraso: 127500,
      dataVencimento: '2026-01-01',
      dataPagamento: '2026-04-01',
      taxaMulta: 0.02,
    });
    expect(r.diasAtraso).toBe(90);
    expect(r.mesesAtraso).toBe(3);
    expect(r.multa).toBeCloseTo(127500 * 0.02 * 3, 2);
    expect(r.juros).toBeCloseTo(127500 * (0.1725 / 360) * 90, 2);
    expect(r.totalPagar).toBeCloseTo(127500 + r.multa + r.juros, 2);
  });

  it('não gera multa/juros quando não há atraso', () => {
    const r = calculateJurosMultas({
      impostoAtraso: 100000,
      dataVencimento: '2026-01-01',
      dataPagamento: '2026-01-01',
      taxaMulta: 0.02,
    });
    expect(r.diasAtraso).toBe(0);
    expect(r.multa).toBe(0);
    expect(r.juros).toBe(0);
  });
});

describe('calculateImpostoSelo', () => {
  // Ex: Garantia 1.000.000 × 0,3% = 3.000
  it('calcula imposto de selo para garantias (0,3%)', () => {
    const r = calculateImpostoSelo({
      valorActo: 1000000,
      tipo: 'garantias',
    });
    expect(r.taxaAplicada).toBe(0.003);
    expect(r.impostoSelo).toBe(3000);
  });

  // Ex: Arrendamento 50.000/mês × 2% = 1.000
  it('calcula imposto de selo para arrendamento (2%)', () => {
    const r = calculateImpostoSelo({
      valorActo: 50000,
      tipo: 'arrendamento',
    });
    expect(r.impostoSelo).toBe(1000);
  });
});

describe('calculateSalarioLiquido', () => {
  // Ex: Base 120.000 + subsídios 10.000 = bruto 130.000
  // INSS = 3.900; matéria = 126.100; IRPS tabela progressiva; salário líquido = bruto − INSS − IRPS
  it('calcula salário líquido após INSS e IRPS', () => {
    const r = calculateSalarioLiquido({
      salarioBase: 120000,
      subsidios: 10000,
      horasExtras: 0,
      bonus: 0,
    });
    expect(r.bruto).toBe(130000);
    expect(r.inss).toBe(3900);
    expect(r.materiaIrps).toBe(126100);
    expect(r.liquido).toBeCloseTo(r.bruto - r.inss - r.irps, 6);
  });
});

describe('calculateHorasExtras', () => {
  // Ex: Salário 120.000 ÷ 208h = 576,92/h
  // 2h diurnas × 1,25 ; 3h nocturnas × 1,50 ; 2h FDS × 2,00
  it('calcula valor da hora e majorações', () => {
    const r = calculateHorasExtras({
      salarioBase: 120000,
      horasNormaisMes: 208,
      horasDiurnas: 2,
      horasNocturnas: 3,
      horasFds: 2,
    });
    expect(r.valorHora).toBeCloseTo(120000 / 208, 6);
    expect(r.valorDiurno).toBeCloseTo(r.valorHora * 1.25 * 2, 6);
    expect(r.valorNocturno).toBeCloseTo(r.valorHora * 1.5 * 3, 6);
    expect(r.valorFds).toBeCloseTo(r.valorHora * 2 * 2, 6);
    expect(r.totalHorasExtras).toBeCloseTo(
      r.valorDiurno + r.valorNocturno + r.valorFds,
      6
    );
  });
});

describe('calculateFerias', () => {
  // Ex: Salário 90.000 → média diária 3.000
  // 1º ano: 12 dias → 36.000; subsídio = 36.000
  it('atribui 12 dias no 1º ano (art. 98 LTM)', () => {
    const r = calculateFerias({
      dataAdmissao: new Date().toISOString().split('T')[0],
      salarioBase: 90000,
      diasGozados: 0,
    });
    expect(r.diasDireito).toBe(12);
    expect(r.mediaDiaria).toBe(3000);
    expect(r.valorFerias).toBe(36000);
    expect(r.subsidioFerias).toBe(36000);
  });

  // Ex: Contrato iniciado há 5 anos e 1 mês → 30 dias/ano
  it('atribui 30 dias nos anos seguintes', () => {
    const r = calculateFerias({
      dataAdmissao: '2021-01-01',
      salarioBase: 90000,
      diasGozados: 0,
    });
    expect(r.diasDireito).toBe(30);
    expect(r.valorFerias).toBe(90000);
  });
});

describe('calculateIndemnizacao', () => {
  // Ex: Salário 120.000, 5 anos de antiguidade, termo indeterminado despedimento → 45 dias/ano
  // Total dias = 5 × 45 = 225; indemnização = (120.000/30) × 225 = 900.000
  it('calcula indemnização a 45 dias/ano para despedimento', () => {
    const r = calculateIndemnizacao({
      salarioBase: 120000,
      dataInicio: '2021-01-01',
      dataFim: '2026-01-01',
      motivo: 'termo_indeterminado_despedimento',
    });
    expect(r.antiguidadeAnos).toBeCloseTo(5, 0);
    expect(r.diasPorAno).toBe(45);
    expect(r.totalDias).toBeCloseTo(5 * 45, 0);
    expect(r.indemnizacao).toBeCloseTo((120000 / 30) * r.totalDias, 2);
  });

  // Ex: pedido de demissão → sem direito a indemnização
  it('não atribui indemnização em pedido de demissão', () => {
    const r = calculateIndemnizacao({
      salarioBase: 120000,
      dataInicio: '2021-01-01',
      dataFim: '2026-01-01',
      motivo: 'pedido_demissao',
    });
    expect(r.diasPorAno).toBe(0);
    expect(r.indemnizacao).toBe(0);
  });
});