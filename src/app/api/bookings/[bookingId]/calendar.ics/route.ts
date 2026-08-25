import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { buildIcsFile } from "@/lib/calendar-links";

export async function GET(_request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const user = await requireUser();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { store: true, service: true },
  });
  if (!booking || booking.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ics = buildIcsFile({
    uid: booking.id,
    title: `${booking.service.name} at ${booking.store.name}`,
    description: `Booked via Schedule.az`,
    location: booking.store.address,
    startAt: booking.startAt,
    endAt: booking.endAt,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="appointment.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
