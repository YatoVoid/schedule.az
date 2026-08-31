import type { ReminderChannel } from "@prisma/client";

// The delivery rule, exactly as specified: a phone number wins outright.
// Phone only -> SMS. Phone and email -> still SMS. Email only -> email.
// Neither -> nothing to send.
export function pickChannel(user: { phone: string | null; email: string | null }): ReminderChannel | null {
  if (user.phone) return "SMS";
  if (user.email) return "EMAIL";
  return null;
}
