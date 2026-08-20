import crypto from 'crypto';

export interface NonResidentCalculationInput {
  providerName: string;
  providerCountry: string;
  currency: string;
  invoiceAmount: number;
  exchangeRate: number;
  paymentDate: string;
  description?: string;
  clientNuit?: string;
}

export interface NonResidentCalculationOutput {
  mznAmount: number;
  grossUpFactor: number;
  taxBase: number;
  ivaRate: number;
  ivaAmount: number;
  irpcRate: number;
  irpcAmount: number;
  totalTax: number;
  digitalSealHash: string;
  trace: {
    step1: { label: string; formula: string; value: number };
    step2: { label: string; formula: string; value: number };
    step3: { label: string; formula: string; value: number };
    step4: { label: string; formula: string; value: number };
    step5: { label: string; formula: string; value: number };
  };
}

export class TaxEngineService {
  private static readonly SECRET_SALT = process.env.DIGITAL_SEAL_SECRET || 'CLAQ_MZ_FISCAL_HMAC_2026';

  /**
   * Calculates Mozambican Tax Withholding on Cross-Border Services
   * Laws: Lei n.º 1/2018 (CIVA) and Lei n.º 34/2014 (CIRPC)
   */
  public static calculateNonResidentService(input: NonResidentCalculationInput): NonResidentCalculationOutput {
    const amount = Number(input.invoiceAmount) || 0;
    const rate = Number(input.exchangeRate) || 1;
    const mznAmount = amount * rate;
    const grossUpFactor = 1.25; // Standard factor for net-of-tax contracts in Mozambique
    const taxBase = mznAmount * grossUpFactor;
    const ivaRate = 0.16; // 16% IVA
    const ivaAmount = taxBase * ivaRate;
    const irpcRate = 0.20; // 20% IRPC Retenção na fonte
    const irpcAmount = taxBase * irpcRate;
    const totalTax = ivaAmount + irpcAmount;

    // Cryptographic SHA-256 HMAC Digital Seal
    const sealPayload = `${input.providerName}|${input.clientNuit || '400889900'}|${amount}|${input.currency}|${rate}|${totalTax}|${input.paymentDate}`;
    const digitalSealHash = crypto.createHmac('sha256', this.SECRET_SALT).update(sealPayload).digest('hex');

    return {
      mznAmount,
      grossUpFactor,
      taxBase,
      ivaRate,
      ivaAmount,
      irpcRate,
      irpcAmount,
      totalTax,
      digitalSealHash,
      trace: {
        step1: {
          label: 'Valor Transferido para MZN',
          formula: `${amount.toFixed(2)} ${input.currency} × ${rate.toFixed(2)}`,
          value: mznAmount
        },
        step2: {
          label: 'Contra Valor (Fator 1,25)',
          formula: `${mznAmount.toFixed(2)} MZN × 1,25 (Base de Incidência)`,
          value: taxBase
        },
        step3: {
          label: 'IVA (16%)',
          formula: `${taxBase.toFixed(2)} MZN × 16% (Lei n.º 1/2018)`,
          value: ivaAmount
        },
        step4: {
          label: 'IRPC (20%)',
          formula: `${taxBase.toFixed(2)} MZN × 20% (Lei n.º 34/2014)`,
          value: irpcAmount
        },
        step5: {
          label: 'Total de Impostos a Pagar',
          formula: `IVA (${ivaAmount.toFixed(2)}) + IRPC (${irpcAmount.toFixed(2)})`,
          value: totalTax
        }
      }
    };
  }

  /**
   * Calculates Salary Net Pay and Employer Cost in Mozambique (CIRPS 2026)
   */
  public static calculateSalary(gross: number, dependents = 0, transport = 0, food = 0) {
    const inssWorker = gross * 0.03; // 3%
    const inssCompany = gross * 0.04; // 4%
    const taxableBase = Math.max(0, gross - inssWorker);

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

    const depDeduction = Math.min(irpsTax, dependents * 250);
    irpsTax = Math.max(0, irpsTax - depDeduction);

    const totalAllowances = (Number(transport) || 0) + (Number(food) || 0);
    const netSalary = gross - inssWorker - irpsTax + totalAllowances;
    const totalCompanyCost = gross + inssCompany + totalAllowances;

    return {
      grossSalary: gross,
      inssWorker,
      inssCompany,
      irpsTax,
      totalAllowances,
      netSalary,
      totalCompanyCost
    };
  }
}
