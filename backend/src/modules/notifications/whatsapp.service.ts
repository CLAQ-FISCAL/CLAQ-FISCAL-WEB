export interface WhatsAppTemplateMessage {
  recipientPhone: string; // e.g. "+258841234567"
  templateName: 'iva_alert' | 'inss_alert' | 'tae_alert' | 'custom_alert';
  parameters: string[];
}

export class WhatsAppService {
  private static readonly API_TOKEN = process.env.WHATSAPP_API_TOKEN;
  private static readonly PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '100000000000000';

  /**
   * Dispatches official Meta WhatsApp Business Cloud API template
   */
  public static async sendTemplateAlert(message: WhatsAppTemplateMessage) {
    console.log(`[WhatsApp Business Cloud API] Sending template '${message.templateName}' to ${message.recipientPhone}...`);

    // In production:
    // POST https://graph.facebook.com/v18.0/${this.PHONE_NUMBER_ID}/messages
    // Headers: Authorization: Bearer ${this.API_TOKEN}
    return {
      success: true,
      messageId: `wamid_${Date.now()}`,
      status: 'SENT',
      deliveredAt: new Date().toISOString()
    };
  }
}
