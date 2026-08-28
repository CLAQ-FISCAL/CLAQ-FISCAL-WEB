export interface BankReferenceRequest {
  companyNuit: string;
  invoiceId: string;
  amount: number;
}

export interface BankReferenceResponse {
  entityCode: string;
  referenceNumber: string;
  amount: number;
  expiryDate: string;
  supportedBanks: {
    bankName: string;
    nib: string;
    iban: string;
    accountHolder: string;
  }[];
}

export class BankTransferService {
  public static generatePaymentReference(payload: BankReferenceRequest): BankReferenceResponse {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    return {
      entityCode: '99001',
      referenceNumber: `${payload.companyNuit.slice(0, 3)} ${payload.companyNuit.slice(3, 6)} ${payload.companyNuit.slice(6)}`,
      amount: payload.amount,
      expiryDate: expiry.toISOString().split('T')[0],
      supportedBanks: [
        {
          bankName: 'Millennium BIM (Banco Internacional de Moçambique)',
          nib: '0001 0000 0012 3456 7890 1',
          iban: 'MZ59 0001 0000 0012 3456 7890 1',
          accountHolder: 'CLAQ Consultores, Lda'
        },
        {
          bankName: 'BCI (Banco Comercial e de Investimentos)',
          nib: '0008 0000 0098 7654 3210 2',
          iban: 'MZ59 0008 0000 0098 7654 3210 2',
          accountHolder: 'CLAQ Consultores, Lda'
        },
        {
          bankName: 'Standard Bank Moçambique',
          nib: '0003 0000 0055 4433 2211 3',
          iban: 'MZ59 0003 0000 0055 4433 2211 3',
          accountHolder: 'CLAQ Consultores, Lda'
        }
      ]
    };
  }
}
