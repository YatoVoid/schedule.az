import { prisma } from "@/lib/prisma";
import type { SecurityEventType } from "@prisma/client";

export async function logSecurityEvent(
  type: SecurityEventType,
  fields: { userId?: string; storeId?: string; detail?: string } = {},
) {
  await prisma.securityEvent.create({
    data: { type, userId: fields.userId, storeId: fields.storeId, detail: fields.detail },
  });
}
