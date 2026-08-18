import { sealData } from "iron-session";
import { prisma } from "../src/lib/prisma";

async function main() {
  await prisma.booking.deleteMany({});
  await prisma.staffAvailability.deleteMany({});
  await prisma.storeMember.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.store.deleteMany({});
  await prisma.otpCode.deleteMany({});
  await prisma.user.deleteMany({});

  const admin = await prisma.user.create({ data: { phone: "+994501111111", name: "Admin Owner" } });
  const staffUser = await prisma.user.create({ data: { phone: "+994502222222", name: "Staff Barber" } });
  const customer = await prisma.user.create({ data: { phone: "+994503333333", name: "Test Customer" } });

  const store = await prisma.store.create({
    data: {
      slug: "kingston-test",
      name: "Kingston Test Barbershop",
      category: "Barbershop",
      address: "28 May, Baku",
    },
  });

  await prisma.storeMember.create({ data: { storeId: store.id, userId: admin.id, role: "ADMIN" } });
  const staffMember = await prisma.storeMember.create({
    data: { storeId: store.id, userId: staffUser.id, role: "STAFF" },
  });

  const service = await prisma.service.create({
    data: { storeId: store.id, name: "Men's haircut", durationMin: 30, priceAzn: 25 },
  });

  await prisma.staffAvailability.create({
    data: { storeMemberId: staffMember.id, dayOfWeek: 1, startMinute: 540, endMinute: 1080 },
  });

  await prisma.booking.create({
    data: {
      storeId: store.id,
      serviceId: service.id,
      storeMemberId: staffMember.id,
      userId: customer.id,
      startAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endAt: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
      status: "PENDING_CONFIRMATION",
    },
  });

  async function seal(userId: string) {
    return sealData(
      { userId },
      { password: process.env.SESSION_SECRET as string },
    );
  }

  console.log("ADMIN_COOKIE=" + (await seal(admin.id)));
  console.log("STAFF_COOKIE=" + (await seal(staffUser.id)));
  console.log("STORE_SLUG=" + store.slug);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
