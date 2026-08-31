import crypto from "crypto";

// One-tap stop link for win-back reminders. The token is an HMAC of the
// user id keyed by SESSION_SECRET, so the link is unguessable and needs no
// lookup table; verification is constant-time. It only ever sets
// winbackOptOut, never touches auth or the session.

function sign(userId: string): string {
  return crypto
    .createHmac("sha256", process.env.SESSION_SECRET ?? "")
    .update(`winback-optout:${userId}`)
    .digest("base64url");
}

export function unsubscribeToken(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const userId = token.slice(0, dot);
  const provided = token.slice(dot + 1);
  const expected = sign(userId);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return userId;
}

export function unsubscribeUrl(userId: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://schedule.az").replace(/\/+$/, "");
  return `${base}/u/${unsubscribeToken(userId)}`;
}
