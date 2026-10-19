"use server";

import { prisma } from "@/lib/prisma";
import { requestOtp, verifyOtp, OtpRateLimitError, type Identifier } from "@/lib/otp";
import { normalizePhone, isDevTestPhone } from "@/lib/phone";
import { phoneSchema, otpCodeSchema, emailSchema } from "@/lib/validation";
import { getSession } from "@/lib/session";
import { logSecurityEvent } from "@/lib/security-log";
import { TERMS_VERSION } from "@/lib/terms";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type LoginMethod = "phone" | "email";

function resolveIdentifier(method: LoginMethod, raw: string): Identifier | { error: string } {
  if (method === "phone") {
    if (isDevTestPhone(raw)) {
      return { type: "phone", value: raw.trim() };
    }
    const parsed = phoneSchema.safeParse(raw);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const phone = normalizePhone(parsed.data);
    if (!phone) return { error: "Enter a valid Azerbaijani phone number" };
    return { type: "phone", value: phone };
  }

  const parsed = emailSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return { type: "email", value: parsed.data.toLowerCase() };
}

// Business-owner entry point (the homepage "I run a business" button, no
// `next`): new accounts go to onboarding, existing ones to their dashboard.
// Consumer entry points (booking flow, "My account") always pass an explicit
// `next` and skip this membership logic entirely — a business owner is
// allowed to also be a customer elsewhere, so membership shouldn't gate them.
async function redirectForUser(userId: string, next?: string) {
  if (next) return next;
  const membership = await prisma.storeMember.findFirst({
    where: { userId },
    include: { store: true },
  });
  if (!membership) return "/onboarding";
  return membership.role === "ADMIN" ? `/admin/${membership.store.slug}` : `/staff/${membership.store.slug}`;
}

// Every login is routed through here so a username-less account (new
// signup, or any pre-existing account from before this field existed) is
// stopped at the Instagram-style profile-setup step exactly once, then sent
// on to wherever redirectForUser would otherwise have taken it.
async function resolvePostLoginRedirect(userId: string, username: string | null, next?: string) {
  const destination = await redirectForUser(userId, next);
  if (username) return destination;
  return `/profile-setup?next=${encodeURIComponent(destination)}`;
}

const TERMS_REQUIRED = "Tick the box to agree to the Terms before continuing.";

async function recordTermsAcceptance(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION },
  });
}

export async function sendOtpAction(method: LoginMethod, raw: string, acceptedTerms: boolean): Promise<ActionResult> {
  if (acceptedTerms !== true) return { ok: false, error: TERMS_REQUIRED };
  if (method === "phone" && isDevTestPhone(raw)) {
    return { ok: true };
  }

  const identifier = resolveIdentifier(method, raw);
  if ("error" in identifier) return { ok: false, error: identifier.error };

  try {
    await requestOtp(identifier);
    return { ok: true };
  } catch (err) {
    if (err instanceof OtpRateLimitError) return { ok: false, error: err.message };
    console.error(err);
    return { ok: false, error: "Something went wrong. Try again." };
  }
}

export async function verifyOtpAction(
  method: LoginMethod,
  raw: string,
  rawCode: string,
  acceptedTerms: boolean,
  next?: string,
): Promise<ActionResult & { redirectTo?: string }> {
  if (acceptedTerms !== true) return { ok: false, error: TERMS_REQUIRED };

  // Dev-only shortcut: any bare 4-digit phone (e.g. "0001") with code "0000"
  // always logs in, no real OTP needed. One fixed code for every test phone,
  // so admin + any number of staff accounts can be exercised end to end
  // before a real SMS vendor is wired up, without having to remember a
  // different code per number. isDevTestPhone is gated on NODE_ENV, so this
  // can never fire in a real deployment.
  if (method === "phone" && isDevTestPhone(raw) && rawCode.trim() === "0000") {
    const phone = raw.trim();
    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });
    await recordTermsAcceptance(user.id);
    const session = await getSession();
    session.userId = user.id;
    await session.save();
    return { ok: true, redirectTo: await resolvePostLoginRedirect(user.id, user.username, next) };
  }

  const identifier = resolveIdentifier(method, raw);
  if ("error" in identifier) return { ok: false, error: identifier.error };

  const codeParsed = otpCodeSchema.safeParse(rawCode);
  if (!codeParsed.success) return { ok: false, error: codeParsed.error.issues[0].message };

  const user = await verifyOtp(identifier, codeParsed.data);
  if (!user) return { ok: false, error: "Incorrect or expired code" };

  await recordTermsAcceptance(user.id);
  const session = await getSession();
  session.userId = user.id;
  await session.save();
  await logSecurityEvent("LOGIN_SUCCESS", { userId: user.id });

  return { ok: true, redirectTo: await resolvePostLoginRedirect(user.id, user.username, next) };
}
