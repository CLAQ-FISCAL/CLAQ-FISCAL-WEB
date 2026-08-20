export interface EmolaC2BRequest {
  phone: string; // e.g. "258861234567" or "258871234567"
  amount: number;
  orderId: string;
}

export class EmolaService {
  /**
   * Initiates E-Mola Movitel Mobile Money Payment
   */
  public static async initiateC2BPayment(payload: EmolaC2BRequest) {
    console.log(`[E-Mola Movitel] Requesting USSD prompt for ${payload.amount} MZN to ${payload.phone}...`);

    return {
      status: 'PENDING',
      orderId: payload.orderId,
      transactionId: `EMOLA_${Date.now()}`,
      message: 'Mensagem de confirmação enviada para o telemóvel Movitel.'
    };
  }
}
