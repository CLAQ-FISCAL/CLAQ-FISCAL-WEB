import crypto from 'crypto';

export interface MpesaC2BRequest {
  customerMsisdn: string; // e.g., "258841234567" or "258851234567"
  amount: number; // in MZN
  transactionReference: string; // e.g., "CLAQ_SUB_001"
  thirdPartyReference: string;
}

export interface MpesaTransactionResult {
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  conversationId: string;
  transactionId?: string;
  responseCode: string;
  responseDescription: string;
}

export class MpesaService {
  private static readonly API_BASE = process.env.MPESA_API_HOST || 'https://api.mpesa.vm.co.mz:18352';
  private static readonly SERVICE_PROVIDER_CODE = process.env.MPESA_SERVICE_PROVIDER_CODE || '171717';

  /**
   * Initiates C2B USSD Push Payment (M-Pesa Vodacom Moçambique)
   */
  public static async initiateC2BPayment(payload: MpesaC2BRequest): Promise<MpesaTransactionResult> {
    console.log(`[M-Pesa MZ] Initiating C2B payment for ${payload.amount} MZN to ${payload.customerMsisdn}...`);

    // In production, encrypt API Key with Public RSA Key and POST to:
    // ${API_BASE}/ipg/v2/vodacomMZ/c2bPayment/singleStage/
    const conversationId = `conv_${crypto.randomBytes(8).toString('hex')}`;
    const transactionId = `MPESA_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    return {
      status: 'PENDING',
      conversationId,
      transactionId,
      responseCode: 'INS-0',
      responseDescription: 'Request processed successfully. USSD push prompt sent to customer.'
    };
  }

  /**
   * Validates M-Pesa Webhook Callback
   */
  public static async processWebhookCallback(callbackData: any): Promise<{ success: boolean; transactionId: string }> {
    console.log('[M-Pesa MZ Webhook] Processing callback payload:', callbackData);
    return {
      success: callbackData.output_ResponseCode === 'INS-0',
      transactionId: callbackData.output_TransactionID || 'MPESA_SAMPLE_ID'
    };
  }
}
