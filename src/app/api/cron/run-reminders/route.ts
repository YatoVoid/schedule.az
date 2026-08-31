import crypto from "crypto";
import { NextResponse } from "next/server";
import { runReminderCycle } from "@/lib/reminders/run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Optional external trigger for the reminder pipeline (a system cron or an
// uptime pinger on the server). The in-process loop in src/instrumentation.ts
// runs the same cycle regardless; this just lets an operator force one or
// run the pipeline on a box where the loop is disabled.
//
// Disabled entirely unless CRON_SECRET is set. A wrong or missing token
// gets the same 404 as a route that does not exist, so probing can't
// confirm it is here.

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new NextResponse("Not found", { status: 404 });

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !timingSafeEqual(token, secret)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const result = await runReminderCycle({ plan: true });
  return NextResponse.json(result);
}
