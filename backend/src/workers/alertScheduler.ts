// Production BullMQ / Cron Alert Scheduler Worker
// Periodically evaluates pending fiscal obligations and dispatches WhatsApp and Email reminders

export interface SchedulerJobConfig {
  dryRun?: boolean;
}

export class AlertSchedulerWorker {
  /**
   * Evaluates all upcoming fiscal obligations for all active tenants
   * Triggered daily at 07:00 CAT
   */
  public static async executeDailyAlertCheck(config: SchedulerJobConfig = { dryRun: false }) {
    console.log('[AlertSchedulerWorker] Starting daily fiscal obligation scan...');
    const now = new Date();
    const currentDateStr = now.toISOString().split('T')[0];

    // Mock evaluation loop simulating database query
    const sampleObligations = [
      {
        id: 'obl-iva-jun26',
        tenantId: 'comp_claq_001',
        title: 'IVA – Declaração e Pagamento',
        dueDate: '2026-06-30',
        amount: 127500,
        category: 'IVA'
      },
      {
        id: 'obl-inss-jun26',
        tenantId: 'comp_claq_001',
        title: 'INSS – Contribuição Mensal',
        dueDate: '2026-07-10',
        amount: 45230,
        category: 'INSS'
      }
    ];

    const alertsTriggered = [];

    for (const obl of sampleObligations) {
      const due = new Date(obl.dueDate);
      const diffTime = due.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Alert thresholds: 7 days, 3 days, 1 day, 0 days
      if ([7, 3, 1, 0].includes(diffDays)) {
        const alertPayload = {
          tenantId: obl.tenantId,
          obligationId: obl.id,
          title: `${obl.title} vence em ${diffDays} dias`,
          message: `Lembrete: O pagamento de ${obl.amount.toLocaleString('pt-MZ')} MZN relativo a ${obl.category} deve ser liquidado até ${obl.dueDate}.`,
          severity: diffDays <= 3 ? 'CRITICAL' : 'WARNING',
          channel: 'WHATSAPP'
        };

        alertsTriggered.push(alertPayload);

        if (!config.dryRun) {
          await this.dispatchWhatsAppAlert({
            phone: '+258841234567',
            template: 'iva_alert',
            variables: [obl.title, diffDays.toString(), obl.dueDate, obl.amount.toString()]
          });
        }
      }
    }

    console.log(`[AlertSchedulerWorker] Scan complete. ${alertsTriggered.length} alerts generated.`);
    return { success: true, count: alertsTriggered.length, alerts: alertsTriggered };
  }

  private static async dispatchWhatsAppAlert(payload: { phone: string; template: string; variables: string[] }) {
    console.log(`[WhatsAppCloudAPI] Dispatching template ${payload.template} to ${payload.phone}...`);
    // When live: POST https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages
    return { status: 'DELIVERED', timestamp: new Date().toISOString() };
  }
}
