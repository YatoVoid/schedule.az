import { SEND_TICK_MS, PLAN_EVERY_TICKS } from "@/lib/reminders/config";

// Runs once when the Node server starts (Next calls this before serving
// requests). It drives the reminder pipeline in-process: there is no
// separate worker or system cron on this box. A single `next start` process
// per deploy makes an interval here safe; if that ever becomes multiple
// processes, the PENDING -> SENDING claim in send.ts still keeps them from
// double-sending.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.REMINDERS_DISABLED === "1") return;

  const { runReminderCycle } = await import("@/lib/reminders/run");
  console.log("[reminders] in-process loop armed");

  let tick = 0;
  let busy = false;

  const cycle = async () => {
    if (busy) return;
    busy = true;
    try {
      const plan = tick % PLAN_EVERY_TICKS === 0;
      tick += 1;
      await runReminderCycle({ plan });
    } catch (err) {
      console.error("[reminders] cycle failed", err);
    } finally {
      busy = false;
    }
  };

  // First pass shortly after boot (plan + send), then on a fixed cadence.
  setTimeout(cycle, 10_000);
  const timer = setInterval(cycle, SEND_TICK_MS);
  timer.unref?.();
}
