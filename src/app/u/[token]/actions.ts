"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

export async function stopWinbackReminders(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const userId = verifyUnsubscribeToken(token);
  if (!userId) redirect("/u/_?bad=1");

  await prisma.user.updateMany({ where: { id: userId }, data: { winbackOptOut: true } });
  redirect(`/u/${encodeURIComponent(token)}?done=1`);
}
