import { planReminders } from "@/lib/reminders/plan";
import { runDueReminders, type SendSummary } from "@/lib/reminders/send";

export type CycleResult =
  | { ran: false; reason: string }
  | { ran: true; planned: { appointments: number; winbacks: number } | null; sent: SendSummary };

// Guards against the in-process loop overlapping itself (or the HTTP
// trigger firing while a loop tick is mid-flight). Cross-process safety
// comes from the atomic PENDING -> SENDING claim in send.ts, not from here.
let running = false;

export async function runReminderCycle(opts: { plan: boolean } = { plan: true }): Promise<CycleResult> {
  if (running) return { ran: false, reason: "a reminder cycle is already running" };
  running = true;
  const startedAt = Date.now();
  try {
    const now = new Date();
    const planned = opts.plan ? await planReminders(now) : null;
    const sent = await runDueReminders(now);
    return { ran: true, planned, sent };
  } finally {
    running = false;
    const ms = Date.now() - startedAt;
    if (ms > 30_000) {
      console.warn(`[reminders] cycle took ${ms}ms`);
    }
  }
}
