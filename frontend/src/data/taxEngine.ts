// Tax Simulation Engine for Mozambique

export interface NonResidentServiceInput {
  providerName: string;
  providerCountry: string;
  currency: string;
  invoiceAmount: number;
  exchangeRate: number;
  paymentDate: string;
  description?: string;
  clientName?: string;
  nuit?: string;
}

export interface NonResidentServiceResult {
  mznAmount: number;
  factor: number;
  taxBase: number; // Contra-valor
  ivaRate: number; // 0.16
  ivaAmount: number;
  irpcRate: number; // 0.20
  irpcAmount: number;
  totalTax: number;
  netPaymentToProvider: number;
  totalCompanyOutflow: number;
  trace: {
    step1: {
      formula: string;
      desc: string;
      value: number;
      label: string;
    };
    step2: {
      formula: string;
      desc: string;
      value: number;
      label: string;
    };
    step3: {
      formula: string;
      desc: string;
      value: number;
      label: string;
    };
    step4: {
      formula: string;
      desc: string;
      value: number;
      label: string;
    };
    step5: {
      formula: string;
      desc: string;
      value: number;
      label: string;
    };
  };
  legalBase: {
    iva: { code: string; articles: string[]; note: string };
    irpc: { code: string; articles: string[]; note: string };
    diplomas: string[];
  };
}

export function calculateNonResidentService(input: NonResidentServiceInput): NonResidentServiceResult {
  const amount = Number(input.invoiceAmount) || 0;
  const rate = Number(input.exchangeRate) || 1;
  const mznAmount = amount * rate;
  const factor = 1.25; // Standard factor for Gross-Up / Contra-valor under Mozambican tax legislation
  const taxBase = mznAmount * factor;
  const ivaRate = 0.16; // 16% IVA Mozambique (Lei n.º 1/2018)
  const ivaAmount = taxBase * ivaRate;
  const irpcRate = 0.20; // 20% IRPC Retenção na fonte (Artigo 66 CIRPC)
  const irpcAmount = taxBase * irpcRate;
  const totalTax = ivaAmount + irpcAmount;
  const netPaymentToProvider = mznAmount;
  const totalCompanyOutflow = mznAmount + totalTax;

  return {
    mznAmount,
    factor,
    taxBase,
    ivaRate,
    ivaAmount,
    irpcRate,
    irpcAmount,
    totalTax,
    netPaymentToProvider,
    totalCompanyOutflow,
    trace: {
      step1: {
        label: 'Valor Transferido para MZN',
        desc: `${amount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} ${input.currency} × ${rate.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} (câmbio)`,
        formula: 'Valor Fatura × Câmbio Oficial BM',
        value: mznAmount
      },
      step2: {
        label: 'Contra Valor (Fator 1,25)',
        desc: `${mznAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} × 1,25`,
        formula: 'Valor em Meticais × 1,25 (Base de Incidência)',
        value: taxBase
      },
      step3: {
        label: 'IVA (16%)',
        desc: `${taxBase.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} × 16%`,
        formula: 'Contra-Valor × Taxa IVA (16%)',
        value: ivaAmount
      },
      step4: {
        label: 'IRPC (20%)',
        desc: `${taxBase.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} × 20%`,
        formula: 'Contra-Valor × Taxa Retenção IRPC (20%)',
        value: irpcAmount
      },
      step5: {
        label: 'Total de Impostos a Pagar',
        desc: `IVA (${ivaAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}) + IRPC (${irpcAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })})`,
        formula: 'IVA a Pagar + IRPC Retido',
        value: totalTax
      }
    },
    legalBase: {
      iva: {
        code: 'Código do IVA (Lei n.º 32/2007, alterada pela Lei n.º 13/2016 e Lei n.º 1/2018)',
        articles: [
          'Artigo 15 – Local das Prestações de Serviços (Regra geral e derrogações para serviços ao exterior)',
          'Artigo 17 – Prestações de Serviços efetuadas por Não Residentes e obrigação de auto-liquidação'
        ],
        note: 'O adquirente residente é o sujeito passivo devedor do imposto nas operações com não residentes sem estabelecimento estável.'
      },
      irpc: {
        code: 'Código do IRPC (Lei n.º 34/2014, de 31 de Dezembro)',
        articles: [
          'Artigo 65 – Retenções na Fonte (Incidência sobre rendimentos pagos a entidades não residentes)',
          'Artigo 66 – Taxas de Retenção a título definitivo (Taxa geral de 20% sobre prestações de serviços)'
        ],
        note: 'A retenção tem caráter liberatório e definitivo na esfera do prestador não residente.'
      },
      diplomas: [
        'Regulamento do IVA – Decreto n.º 7/2020, de 16 de Novembro',
        'Ofício Circular n.º 3012/AT/2021 – Aplicação de Fator de Gross-up em pagamentos ao estrangeiro',
        'Acordos de Dupla Tributação (DTA) – Se aplicável (Portugal, África do Sul, Itália, Emirados Árabes Unidos, etc.)'
      ]
    }
  };
}

// -------------------------------------------------------------
// Salário Líquido & Custo do Trabalhador
// -------------------------------------------------------------
export interface SalaryInput {
  grossSalary: number;
  dependents: number;
  transportAllowance?: number;
  foodAllowance?: number;
  otherBonuses?: number;
}

export interface SalaryResult {
  grossSalary: number;
  inssWorker: number; // 3%
  inssCompany: number; // 4%
  irpsTax: number;
  totalAllowances: number;
  netSalary: number;
  totalCompanyCost: number;
  effectiveTaxRate: number;
}

export function calculateSalary(input: SalaryInput): SalaryResult {
  const gross = Number(input.grossSalary) || 0;
  const inssWorker = gross * 0.03; // 3% INSS
  const inssCompany = gross * 0.04; // 4% INSS Patronal
  const taxableBase = Math.max(0, gross - inssWorker);

  // Progressive IRPS Mozambique 2026 table
  let irpsTax = 0;
  if (taxableBase <= 20249) {
    irpsTax = 0;
  } else if (taxableBase <= 32750) {
    irpsTax = (taxableBase - 20249) * 0.10;
  } else if (taxableBase <= 60000) {
    irpsTax = 1250 + (taxableBase - 32750) * 0.15;
  } else if (taxableBase <= 144000) {
    irpsTax = 5337.5 + (taxableBase - 60000) * 0.20;
  } else {
    irpsTax = 22137.5 + (taxableBase - 144000) * 0.32;
  }

  // Dependent deductions
  const depDiscount = Math.min(irpsTax, (input.dependents || 0) * 250);
  irpsTax = Math.max(0, irpsTax - depDiscount);

  const totalAllowances = (Number(input.transportAllowance) || 0) + (Number(input.foodAllowance) || 0) + (Number(input.otherBonuses) || 0);
  const netSalary = gross - inssWorker - irpsTax + totalAllowances;
  const totalCompanyCost = gross + inssCompany + totalAllowances;
  const effectiveTaxRate = gross > 0 ? ((inssWorker + irpsTax) / gross) * 100 : 0;

  return {
    grossSalary: gross,
    inssWorker,
    inssCompany,
    irpsTax,
    totalAllowances,
    netSalary,
    totalCompanyCost,
    effectiveTaxRate
  };
}

// -------------------------------------------------------------
// IVA Geral (Operações Normais)
// -------------------------------------------------------------
export interface IVAOperationsInput {
  salesTaxable: number; // Sujeitas a 16%
  salesExempt: number; // Isentas
  purchasesDeductible: number; // Compras dedutíveis a 16%
  purchasesNonDeductible: number;
}

export interface IVAOperationsResult {
  ivaLiquidado: number;
  ivaDedutivel: number;
  ivaApurado: number; // Positive = A pagar, Negative = A recuperar / crédito
  status: 'a_pagar' | 'credito_iva';
}

export function calculateIVAOperations(input: IVAOperationsInput): IVAOperationsResult {
  const salesTaxable = Number(input.salesTaxable) || 0;
  const purchasesDeductible = Number(input.purchasesDeductible) || 0;

  const ivaLiquidado = salesTaxable * 0.16;
  const ivaDedutivel = purchasesDeductible * 0.16;
  const ivaApurado = ivaLiquidado - ivaDedutivel;

  return {
    ivaLiquidado,
    ivaDedutivel,
    ivaApurado,
    status: ivaApurado >= 0 ? 'a_pagar' : 'credito_iva'
  };
}

// -------------------------------------------------------------
// Juros e Multas (Artigo 101 Lei Geral Tributária)
// -------------------------------------------------------------
export interface FinesInput {
  taxAmount: number;
  daysLate: number;
  taxType: string;
}

export interface FinesResult {
  taxAmount: number;
  daysLate: number;
  fineRate: number;
  fineAmount: number;
  interestRateAnnual: number;
  interestAmount: number;
  totalToPay: number;
  legalArticle: string;
}

export function calculateFines(input: FinesInput): FinesResult {
  const amount = Number(input.taxAmount) || 0;
  const days = Math.max(0, Number(input.daysLate) || 0);

  let fineRate = 0.25; // 25% up to 30 days
  if (days > 90) {
    fineRate = 1.00; // 100% over 90 days
  } else if (days > 30) {
    fineRate = 0.50; // 50% between 30 and 90 days
  }

  const fineAmount = amount * fineRate;
  // Mozambique Benchmark MIMO rate ~17.25% + 2% margin = 19.25%
  const interestRateAnnual = 0.1925;
  const dailyInterest = interestRateAnnual / 365;
  const interestAmount = amount * dailyInterest * days;
  const totalToPay = amount + fineAmount + interestAmount;

  return {
    taxAmount: amount,
    daysLate: days,
    fineRate: fineRate * 100,
    fineAmount,
    interestRateAnnual: interestRateAnnual * 100,
    interestAmount,
    totalToPay,
    legalArticle: 'Artigo 101 da Lei n.º 15/2002 (Lei Geral Tributária) e Código do Procedimento Tributário'
  };
}

// Live Exchange Rates Mock (Banco de Moçambique standard)
export const MOCK_EXCHANGE_RATES: Record<string, number> = {
  USD: 63.75,
  EUR: 69.40,
  ZAR: 3.52,
  GBP: 81.20,
  MZN: 1.00
};
