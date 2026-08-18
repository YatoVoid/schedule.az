// Abstracted so a real local provider (1sms.az, or a direct telecom route)
// can be dropped in as a second implementation without touching call sites.
export interface SmsProvider {
  send(toPhone: string, message: string): Promise<void>;
}

class ConsoleSmsProvider implements SmsProvider {
  async send(toPhone: string, message: string): Promise<void> {
    console.log(`[sms:dev] to=${toPhone} message="${message}"`);
  }
}

export const smsProvider: SmsProvider = new ConsoleSmsProvider();
