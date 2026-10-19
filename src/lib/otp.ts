import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { smsProvider } from "@/lib/sms";
import { emailProvider } from "@/lib/email";
import { logSecurityEvent } from "@/lib/security-log";
import { reserveSend, SendBudgetError } from "@/lib/send-budget";
import { getClientIp } from "@/lib/client-ip";

const OTP_TTL_MINUTES = 10;
const OTP_WINDOW_MINUTES = 10;
const OTP_MAX_PER_WINDOW = 3;

// App-wide ceiling on OTP issuance, independent of which identity asked.
// The per-identifier limit above stops one number being spammed; this
// bounds the total SMS bill when an attacker cycles through many numbers
// (each of which would otherwise get its own 3 free sends). Set well above
// real launch traffic for Baku so it only bites during an actual burst.
// Per-IP limits and the daily SMS/email spending caps live in
// src/lib/send-budget.ts and are checked before any code is created.
const OTP_GLOBAL_PER_MINUTE = 20;
const OTP_GLOBAL_PER_HOUR = 200;
// Caps guesses against a single issued code, independent of codeHash, so an
// attacker can't brute-force the 6-digit space during the 10-minute TTL.
const OTP_MAX_VERIFY_ATTEMPTS = 5;

export type Identifier = { type: "phone"; value: string } | { type: "email"; value: string };

function hashCode(code: string) {
  return crypto
    .createHash("sha256")
    .update(`${code}:${process.env.SESSION_SECRET}`)
    .digest("hex");
}

function generateCode() {
  return crypto.randomInt(100000, 999999).toString();
}

export class OtpRateLimitError extends Error {
  constructor(message = "Too many codes requested. Try again shortly.") {
    super(message);
    this.name = "OtpRateLimitError";
  }
}

async function findOrCreateUser(identifier: Identifier) {
  if (identifier.type === "phone") {
    return prisma.user.upsert({
      where: { phone: identifier.value },
      update: {},
      create: { phone: identifier.value },
    });
  }
  return prisma.user.upsert({
    where: { email: identifier.value },
    update: {},
    create: { email: identifier.value },
  });
}

export async function requestOtp(identifier: Identifier) {
  const now = Date.now();

  const [globalLastMinute, globalLastHour] = await Promise.all([
    prisma.otpCode.count({ where: { createdAt: { gte: new Date(now - 60_000) } } }),
    prisma.otpCode.count({ where: { createdAt: { gte: new Date(now - 60 * 60_000) } } }),
  ]);
  if (globalLastMinute >= OTP_GLOBAL_PER_MINUTE || globalLastHour >= OTP_GLOBAL_PER_HOUR) {
    await logSecurityEvent("OTP_LOCKED", { detail: "global OTP rate ceiling hit" });
    throw new OtpRateLimitError();
  }

  // Reserved before the account row is created, so a flood of made-up
  // numbers is stopped by the budget instead of filling the User table.
  try {
    await reserveSend({
      channel: identifier.type === "phone" ? "SMS" : "EMAIL",
      recipient: identifier.value,
      kind: "OTP",
      ip: await getClientIp(),
    });
  } catch (err) {
    if (err instanceof SendBudgetError) throw new OtpRateLimitError(err.message);
    throw err;
  }

  const user = await findOrCreateUser(identifier);

  const since = new Date(now - OTP_WINDOW_MINUTES * 60_000);
  const recentCount = await prisma.otpCode.count({
    where: { userId: user.id, purpose: "LOGIN", createdAt: { gte: since } },
  });
  if (recentCount >= OTP_MAX_PER_WINDOW) {
    throw new OtpRateLimitError();
  }

  const code = generateCode();
  await prisma.otpCode.create({
    data: {
      userId: user.id,
      purpose: "LOGIN",
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
    },
  });

  if (identifier.type === "phone") {
    await smsProvider.send(identifier.value, `Schedule.az təsdiq kodunuz: ${code}`);
  } else {
    await emailProvider.send(
      identifier.value,
      "Your Schedule.az verification code",
      `Your verification code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`,
    );
  }

  return { userId: user.id };
}

export async function verifyOtp(identifier: Identifier, code: string) {
  const user =
    identifier.type === "phone"
      ? await prisma.user.findUnique({ where: { phone: identifier.value } })
      : await prisma.user.findUnique({ where: { email: identifier.value } });
  if (!user) return null;

  // Looked up by recency, not by codeHash, so a wrong guess still lands on
  // the row whose attempts counter needs incrementing/locking.
  const candidate = await prisma.otpCode.findFirst({
    where: {
      userId: user.id,
      purpose: "LOGIN",
      consumedAt: null,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!candidate) return null;

  if (candidate.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
    await logSecurityEvent("OTP_LOCKED", { userId: user.id });
    return null;
  }

  if (candidate.codeHash !== hashCode(code)) {
    await prisma.otpCode.update({ where: { id: candidate.id }, data: { attempts: { increment: 1 } } });
    await logSecurityEvent("OTP_VERIFY_FAILED", { userId: user.id });
    return null;
  }

  await prisma.otpCode.update({
    where: { id: candidate.id },
    data: { consumedAt: new Date() },
  });

  return user;
}
