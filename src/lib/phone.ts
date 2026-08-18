// Dev-only escape hatch so the app can be clicked through end to end
// (including staff logins) before a real SMS vendor is wired up: any bare
// 4-digit string (e.g. "0001") is accepted as-is, no E.164 normalization,
// and its matching OTP code is itself (see login/actions.ts). Gated on
// NODE_ENV so it can never work in a real deployment.
export function isDevTestPhone(raw: string): boolean {
  return process.env.NODE_ENV !== "production" && /^\d{4}$/.test(raw.trim());
}

// Normalizes local Azerbaijani input (e.g. "050 123 45 67", "0501234567")
// and already-international numbers into E.164 (+994501234567).
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");

  if (digits.startsWith("994") && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return `+994${digits.slice(1)}`;
  }
  if (digits.length === 9) {
    return `+994${digits}`;
  }
  return null;
}
