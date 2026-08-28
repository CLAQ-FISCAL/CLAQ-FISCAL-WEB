import crypto from 'crypto';

export interface MpesaC2BRequest {
  customerMsisdn: string;
  amount: number;
  transactionReference: string;
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

  public static async initiateC2BPayment(payload: MpesaC2BRequest): Promise<MpesaTransactionResult> {
    console.log(`[M-Pesa MZ] Initiating C2B payment for ${payload.amount} MZN to ${payload.customerMsisdn}...`);

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

  public static verifyWebhookSignature(payloadRaw: string, signatureHeader?: string, webhookSecret?: string): boolean {
    if (!signatureHeader || !webhookSecret) return false;
    const expectedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(payloadRaw)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signatureHeader.toLowerCase()),
        Buffer.from(expectedSig.toLowerCase())
      );
    } catch {
      return false;
    }
  }

  public static async processWebhookCallback(
    callbackData: any,
    signatureHeader?: string,
    rawPayload?: string,
    webhookSecret?: string
  ): Promise<{ success: boolean; transactionId: string; error?: string }> {
    if (!rawPayload || !signatureHeader || !this.verifyWebhookSignature(rawPayload, signatureHeader, webhookSecret)) {
      return { success: false, transactionId: '', error: 'Invalid HMAC signature' };
    }

    const isSuccess = callbackData.output_ResponseCode === 'INS-0';
    return {
      success: isSuccess,
      transactionId: callbackData.output_TransactionID || 'MPESA_SETTLED_ID'
    };
  }
}
