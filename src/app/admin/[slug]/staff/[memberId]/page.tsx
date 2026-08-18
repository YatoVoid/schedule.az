import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStoreAdmin } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvailabilityEditor } from "@/components/availability-editor";
import { ExceptionManager, type ExceptionRow } from "@/components/exception-manager";
import { StaffScheduleCalendar, type ScheduleException } from "@/components/staff-schedule-calendar";
import { StaffNameForm } from "./staff-name-form";
import {
  updateStaffNameAction,
  adminSetAvailabilityAction,
  adminAddExceptionAction,
  adminUpdateExceptionAction,
  adminDeleteExceptionAction,
} from "./actions";

export default async function AdminStaffDetailPage({
  params,
}: PageProps<"/admin/[slug]/staff/[memberId]">) {
  const { slug, memberId } = await params;
  const { membership } = await requireStoreAdmin(slug);

  const target = await prisma.storeMember.findFirst({
    where: { id: memberId, storeId: membership.storeId },
    include: { user: true },
  });
  if (!target) notFound();

  const [availability, exceptions, bookings] = await Promise.all([
    prisma.staffAvailability.findMany({ where: { storeMemberId: target.id } }),
    prisma.availabilityException.findMany({ where: { storeMemberId: target.id }, orderBy: { startDate: "asc" } }),
    prisma.booking.findMany({
      where: { storeMemberId: target.id, status: { in: ["PENDING_CONFIRMATION", "CONFIRMED"] } },
      select: { startAt: true },
    }),
  ]);

  const initialAvailability: Record<number, { startMinute: number; endMinute: number }> = {};
  for (const a of availability) initialAvailability[a.dayOfWeek] = a;

  const exceptionRows: ExceptionRow[] = exceptions.map((e) => ({
    id: e.id,
    startDate: e.startDate.toISOString().slice(0, 10),
    endDate: e.endDate.toISOString().slice(0, 10),
    type: e.type,
    recurringAnnually: e.recurringAnnually,
    label: e.label,
  }));

  const scheduleExceptions: ScheduleException[] = exceptionRows.map((e) => ({
    startDate: e.startDate,
    endDate: e.endDate,
    type: e.type,
    recurringAnnually: e.recurringAnnually,
  }));

  const bookedDates = bookings.map((b) => b.startAt.toISOString().slice(0, 10));

  const boundUpdateName = updateStaffNameAction.bind(null, slug, memberId);
  const boundSetAvailability = adminSetAvailabilityAction.bind(null, slug, memberId);
  const boundAddException = adminAddExceptionAction.bind(null, slug, memberId);
  const boundUpdateException = adminUpdateExceptionAction.bind(null, slug, memberId);
  const boundDeleteException = adminDeleteExceptionAction.bind(null, slug, memberId);

  return (
    <div className="flex flex-col gap-6">
      <StaffNameForm
        initialName={target.user.name ?? ""}
        phone={target.user.phone}
        email={target.user.email}
        role={target.role}
        onSave={boundUpdateName}
      />

      <Tabs defaultValue="calendar">
        <TabsList className="mb-4">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="hours">Hours</TabsTrigger>
          <TabsTrigger value="timeoff">Time off</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar">
          <StaffScheduleCalendar
            weeklyAvailability={initialAvailability}
            exceptions={scheduleExceptions}
            bookedDates={bookedDates}
          />
        </TabsContent>
        <TabsContent value="hours">
          <AvailabilityEditor initial={initialAvailability} onSave={boundSetAvailability} />
        </TabsContent>
        <TabsContent value="timeoff">
          <ExceptionManager
            exceptions={exceptionRows}
            onAdd={boundAddException}
            onUpdate={boundUpdateException}
            onDelete={boundDeleteException}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
