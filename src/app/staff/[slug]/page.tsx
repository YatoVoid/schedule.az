import { prisma } from "@/lib/prisma";
import { requireStoreMember } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvailabilityEditor } from "@/components/availability-editor";
import { ExceptionManager, type ExceptionRow } from "@/components/exception-manager";
import { StaffScheduleCalendar } from "@/components/staff-schedule-calendar";
import { BookingQueue, type BookingRow } from "./booking-queue";
import { setAvailabilityAction, addExceptionAction, updateExceptionAction, deleteExceptionAction } from "./actions";

export default async function StaffCalendarPage({
  params,
}: PageProps<"/staff/[slug]">) {
  const { slug } = await params;
  const { membership } = await requireStoreMember(slug);

  const [availability, bookings, exceptions] = await Promise.all([
    prisma.staffAvailability.findMany({ where: { storeMemberId: membership.id } }),
    prisma.booking.findMany({
      where: { storeMemberId: membership.id, status: { in: ["PENDING_CONFIRMATION", "CONFIRMED"] } },
      include: { service: true, user: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.availabilityException.findMany({
      where: { storeMemberId: membership.id },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const initial: Record<number, { startMinute: number; endMinute: number }> = {};
  for (const a of availability) initial[a.dayOfWeek] = a;

  const bookingRows: BookingRow[] = bookings.map((b) => ({
    id: b.id,
    serviceName: b.service.name,
    customerName: b.user.name ?? "Customer",
    customerContact: b.user.phone ?? b.user.email ?? null,
    startAt: b.startAt.toISOString(),
    status: b.status,
    rescheduledAt: b.rescheduledAt ? b.rescheduledAt.toISOString() : null,
  }));

  const exceptionRows: ExceptionRow[] = exceptions.map((e) => ({
    id: e.id,
    startDate: e.startDate.toISOString().slice(0, 10),
    endDate: e.endDate.toISOString().slice(0, 10),
    type: e.type,
    recurringAnnually: e.recurringAnnually,
    label: e.label,
  }));

  const bookedDates = bookings.map((b) => b.startAt.toISOString().slice(0, 10));

  const boundSetAvailability = setAvailabilityAction.bind(null, slug);
  const boundAddException = addExceptionAction.bind(null, slug);
  const boundUpdateException = updateExceptionAction.bind(null, slug);
  const boundDeleteException = deleteExceptionAction.bind(null, slug);

  return (
    <Tabs defaultValue="bookings">
      <TabsList className="mb-4">
        <TabsTrigger value="bookings">Bookings</TabsTrigger>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
        <TabsTrigger value="availability">My hours</TabsTrigger>
        <TabsTrigger value="exceptions">Time off</TabsTrigger>
      </TabsList>
      <TabsContent value="bookings">
        <BookingQueue slug={slug} bookings={bookingRows} />
      </TabsContent>
      <TabsContent value="calendar">
        <StaffScheduleCalendar weeklyAvailability={initial} exceptions={exceptionRows} bookedDates={bookedDates} />
      </TabsContent>
      <TabsContent value="availability">
        <AvailabilityEditor initial={initial} onSave={boundSetAvailability} />
      </TabsContent>
      <TabsContent value="exceptions">
        <ExceptionManager
          exceptions={exceptionRows}
          onAdd={boundAddException}
          onUpdate={boundUpdateException}
          onDelete={boundDeleteException}
        />
      </TabsContent>
    </Tabs>
  );
}
