import { prisma } from "@/lib/prisma";
import { logSecurityEvent } from "@/lib/security-log";

export type SendChannel = "SMS" | "EMAIL";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function envInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// Hard daily ceilings on paid sends, across every sender in the app. Email
// defaults just under Resend's free tier of 100 a day.
const DAILY_CAP: Record<SendChannel, number> = {
  SMS: envInt("SMS_DAILY_CAP", 300),
  EMAIL: envInt("EMAIL_DAILY_CAP", 90),
};
const PER_RECIPIENT_PER_DAY = envInt("SEND_PER_RECIPIENT_DAILY_CAP", 10);
const OTP_PER_IP_PER_HOUR = envInt("OTP_PER_IP_HOURLY_CAP", 10);
const OTP_PER_IP_PER_DAY = envInt("OTP_PER_IP_DAILY_CAP", 30);

export class SendBudgetError extends Error {
  constructor(public readonly reason: "channel" | "recipient" | "ip") {
    super(
      reason === "channel"
        ? "We can't send more messages today. Try again tomorrow."
        : "Too many codes requested. Try again later.",
    );
    this.name = "SendBudgetError";
  }
}

// Checks every cap and records the send in one transaction. The advisory
// lock serializes concurrent reservations, so a burst can't slip past a cap
// between the count and the insert. Call this immediately before handing a
// message to the provider; a reservation counts even if the provider then
// fails, which errs on the side of spending less.
export async function reserveSend(params: {
  channel: SendChannel;
  recipient: string;
  kind: "OTP" | "REMINDER";
  ip?: string | null;
}) {
  const now = Date.now();
  const dayAgo = new Date(now - DAY_MS);

  const failure = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('send-budget'))`;

    const channelCount = await tx.messageSend.count({
      where: { channel: params.channel, createdAt: { gte: dayAgo } },
    });
    if (channelCount >= DAILY_CAP[params.channel]) return "channel" as const;

    const recipientCount = await tx.messageSend.count({
      where: { recipient: params.recipient, createdAt: { gte: dayAgo } },
    });
    if (recipientCount >= PER_RECIPIENT_PER_DAY) return "recipient" as const;

    if (params.kind === "OTP" && params.ip) {
      const [lastHour, lastDay] = await Promise.all([
        tx.messageSend.count({ where: { ip: params.ip, kind: "OTP", createdAt: { gte: new Date(now - HOUR_MS) } } }),
        tx.messageSend.count({ where: { ip: params.ip, kind: "OTP", createdAt: { gte: dayAgo } } }),
      ]);
      if (lastHour >= OTP_PER_IP_PER_HOUR || lastDay >= OTP_PER_IP_PER_DAY) return "ip" as const;
    }

    await tx.messageSend.create({
      data: { channel: params.channel, recipient: params.recipient, kind: params.kind, ip: params.ip ?? null },
    });
    return null;
  });

  if (failure) {
    await logSecurityEvent("SEND_BUDGET_HIT", {
      detail: `${failure} cap: ${params.kind} via ${params.channel}${params.ip ? ` from ${params.ip}` : ""}`,
    });
    throw new SendBudgetError(failure);
  }
}
