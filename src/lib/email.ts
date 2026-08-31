import { Resend } from "resend";

// Abstracted so a real transactional provider can be dropped in without
// touching call sites (mirrors src/lib/sms.ts). `body` is always the plain
// text version; pass `opts.html` to also send a rich version (clients that
// can render it will, the rest fall back to the text).
export type EmailOptions = { html?: string };

export interface EmailProvider {
  send(toEmail: string, subject: string, body: string, opts?: EmailOptions): Promise<void>;
}

class ConsoleEmailProvider implements EmailProvider {
  async send(toEmail: string, subject: string, body: string): Promise<void> {
    console.log(`[email:dev] to=${toEmail} subject="${subject}" body="${body}"`);
  }
}

// Real send via Resend (resend.com). Needs RESEND_API_KEY and a sender
// address on a domain verified in the Resend dashboard (RESEND_FROM_EMAIL,
// e.g. "Schedule.az <noreply@schedule.az>") — until that domain is
// verified, Resend only delivers to the account owner's own inbox, so
// nothing user-facing works until DNS records are added there.
class ResendEmailProvider implements EmailProvider {
  private client: Resend;
  private from: string;

  constructor(apiKey: string, from: string) {
    this.client = new Resend(apiKey);
    this.from = from;
  }

  async send(toEmail: string, subject: string, body: string, opts?: EmailOptions): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.from,
      to: toEmail,
      subject,
      text: body,
      ...(opts?.html ? { html: opts.html } : {}),
    });
    if (error) throw new Error(`Resend send failed: ${error.message}`);
  }
}

export const emailProvider: EmailProvider =
  process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL
    ? new ResendEmailProvider(process.env.RESEND_API_KEY, process.env.RESEND_FROM_EMAIL)
    : new ConsoleEmailProvider();
