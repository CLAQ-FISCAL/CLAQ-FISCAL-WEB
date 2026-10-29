// Tax Simulation Engine for Mozambique

import i18n from '../i18n';

const fmtNumber = (v: number) =>
  v.toLocaleString(i18n.language === 'en' ? 'en-GB' : 'pt-MZ', { minimumFractionDigits: 2 });

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
  const ivaRate = 0.16; // 16% IVA Mozambique (Lei n.º 32/2007)
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
        label: i18n.t('simuladores:traceStep1Label'),
        desc: i18n.t('simuladores:traceStep1Desc', {
          amount: fmtNumber(amount),
          currency: input.currency,
          rate: fmtNumber(rate)
        }),
        formula: i18n.t('simuladores:traceStep1Formula'),
        value: mznAmount
      },
      step2: {
        label: i18n.t('simuladores:traceStep2Label'),
        desc: i18n.t('simuladores:traceStep2Desc', { amount: fmtNumber(mznAmount) }),
        formula: i18n.t('simuladores:traceStep2Formula'),
        value: taxBase
      },
      step3: {
        label: i18n.t('simuladores:traceStep3Label'),
        desc: i18n.t('simuladores:traceStep3Desc', { base: fmtNumber(taxBase) }),
        formula: i18n.t('simuladores:traceStep3Formula'),
        value: ivaAmount
      },
      step4: {
        label: i18n.t('simuladores:traceStep4Label'),
        desc: i18n.t('simuladores:traceStep4Desc', { base: fmtNumber(taxBase) }),
        formula: i18n.t('simuladores:traceStep4Formula'),
        value: irpcAmount
      },
      step5: {
        label: i18n.t('simuladores:traceStep5Label'),
        desc: i18n.t('simuladores:traceStep5Desc', { iva: fmtNumber(ivaAmount), irpc: fmtNumber(irpcAmount) }),
        formula: i18n.t('simuladores:traceStep5Formula'),
        value: totalTax
      }
    },
    legalBase: {
      iva: {
        code: i18n.t('simuladores:legalIvaCode'),
        articles: [
          i18n.t('simuladores:legalIvaArticle15'),
          i18n.t('simuladores:legalIvaArticle17')
        ],
        note: i18n.t('simuladores:legalIvaNote')
      },
      irpc: {
        code: i18n.t('simuladores:legalIrpcCode'),
        articles: [
          i18n.t('simuladores:legalIrpcArticle65'),
          i18n.t('simuladores:legalIrpcArticle66')
        ],
        note: i18n.t('simuladores:legalIrpcNote')
      },
      diplomas: [
        i18n.t('simuladores:legalDiploma1'),
        i18n.t('simuladores:legalDiploma2'),
        i18n.t('simuladores:legalDiploma3')
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
    legalArticle: i18n.t('simuladores:finesLegalArticle')
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
