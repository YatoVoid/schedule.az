// Abstracted so a real local provider (e.g. a self-hosted Jasmin SMS
// gateway, or a direct telecom route) can be dropped in as a second
// implementation without touching call sites (mirrors src/lib/email.ts).
export interface SmsProvider {
  send(toPhone: string, message: string): Promise<void>;
}

class ConsoleSmsProvider implements SmsProvider {
  async send(toPhone: string, message: string): Promise<void> {
    console.log(`[sms:dev] to=${toPhone} message="${message}"`);
  }
}

// Real send via a self-hosted Jasmin SMS gateway (github.com/jookies/jasmin)
// through its HTTP API plugin, not SMPP directly — Jasmin exposes a simple
// send endpoint in front of its own SMPP connection to a carrier, so this
// app never needs to speak SMPP itself. Jasmin's `to` field expects a plain
// phone number; the `+` from normalizePhone's E.164 output is sent
// URL-encoded, which Jasmin accepts. Jasmin returns HTTP 200 even on
// failure, with the actual result in the body ("Success \"<id>\"" or an
// error string), so the body has to be checked, not just the status code.
class JasminSmsProvider implements SmsProvider {
  private baseUrl: string;
  private username: string;
  private password: string;

  constructor(baseUrl: string, username: string, password: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.username = username;
    this.password = password;
  }

  async send(toPhone: string, message: string): Promise<void> {
    const params = new URLSearchParams({
      username: this.username,
      password: this.password,
      to: toPhone,
      content: message,
    });
    const response = await fetch(`${this.baseUrl}/send?${params}`, { signal: AbortSignal.timeout(10_000) });
    const body = await response.text();
    if (!response.ok || !body.startsWith("Success")) {
      throw new Error(`Jasmin send failed: ${body}`);
    }
  }
}

export const smsProvider: SmsProvider =
  process.env.JASMIN_HTTP_URL && process.env.JASMIN_USERNAME && process.env.JASMIN_PASSWORD
    ? new JasminSmsProvider(process.env.JASMIN_HTTP_URL, process.env.JASMIN_USERNAME, process.env.JASMIN_PASSWORD)
    : new ConsoleSmsProvider();
