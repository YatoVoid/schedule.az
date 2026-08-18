// Mirrors src/lib/sms.ts, abstracted so a real transactional email provider
// (Resend, SES, etc.) can be dropped in without touching call sites.
export interface EmailProvider {
  send(toEmail: string, subject: string, body: string): Promise<void>;
}

class ConsoleEmailProvider implements EmailProvider {
  async send(toEmail: string, subject: string, body: string): Promise<void> {
    console.log(`[email:dev] to=${toEmail} subject="${subject}" body="${body}"`);
  }
}

export const emailProvider: EmailProvider = new ConsoleEmailProvider();
