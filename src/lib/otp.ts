import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { smsProvider } from "@/lib/sms";
import { emailProvider } from "@/lib/email";

const OTP_TTL_MINUTES = 10;
const OTP_WINDOW_MINUTES = 10;
const OTP_MAX_PER_WINDOW = 3;

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
  constructor() {
    super("Too many codes requested. Try again shortly.");
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

// Per-identifier rate limit is the primary defense against SMS-cost abuse
// and fake-booking spam. IP-based limiting is a further hardening step best
// added once the app sits behind a known reverse proxy that reports a
// trustworthy client IP.
export async function requestOtp(identifier: Identifier) {
  const user = await findOrCreateUser(identifier);

  const since = new Date(Date.now() - OTP_WINDOW_MINUTES * 60_000);
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

  const candidate = await prisma.otpCode.findFirst({
    where: {
      userId: user.id,
      purpose: "LOGIN",
      codeHash: hashCode(code),
      consumedAt: null,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!candidate) return null;

  await prisma.otpCode.update({
    where: { id: candidate.id },
    data: { consumedAt: new Date() },
  });

  return user;
}
