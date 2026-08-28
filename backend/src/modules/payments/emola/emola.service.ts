export interface EmolaC2BRequest {
  phone: string;
  amount: number;
  orderId: string;
}

export class EmolaService {
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
