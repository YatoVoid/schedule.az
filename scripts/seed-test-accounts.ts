import { prisma } from "../src/lib/prisma";
import { generateUniqueStoreSlug } from "../src/lib/slug";

// Mirrors the real flow exactly: OTP-login upserts a User by phone,
// onboarding creates a Store + ADMIN StoreMember, inviting staff upserts a
// User by phone and creates a STAFF StoreMember. Nothing here is a shortcut
// that bypasses the actual data model.
async function main() {
  const admin = await prisma.user.upsert({
    where: { phone: "0000" },
    update: { username: "demo_owner" },
    create: { phone: "0000", username: "demo_owner" },
  });

  const slug = await generateUniqueStoreSlug("Demo Barbershop");
  const store = await prisma.store.create({
    data: {
      slug,
      name: "Demo Barbershop",
      category: "Barbershop",
      address: "28 May, Baku",
      members: { create: { userId: admin.id, role: "ADMIN" } },
    },
  });

  const worker = await prisma.user.upsert({
    where: { phone: "0001" },
    update: { username: "demo_staff" },
    create: { phone: "0001", username: "demo_staff" },
  });
  const staffMember = await prisma.storeMember.create({
    data: { storeId: store.id, userId: worker.id, role: "STAFF" },
  });

  await prisma.user.upsert({
    where: { phone: "0002" },
    update: { username: "demo_client" },
    create: { phone: "0002", username: "demo_client" },
  });

  // Without at least one service and one staff member's working hours, the
  // demo store looks exactly like a real store that hasn't finished setup
  // ("This business hasn't set up online booking yet"), which makes the
  // 0000/0001/0002 accounts useless for exercising the booking flow right
  // after a reset. Mon-Sat 09:00-18:00 (540-1080 minutes) is an ordinary
  // barbershop week, nothing store-specific.
  await prisma.service.createMany({
    data: [
      { storeId: store.id, name: "Men's haircut", durationMin: 30, priceAzn: "15.00" },
      { storeId: store.id, name: "Beard trim", durationMin: 15, priceAzn: "8.00" },
    ],
  });
  await prisma.staffAvailability.createMany({
    data: [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      storeMemberId: staffMember.id,
      dayOfWeek,
      startMinute: 540,
      endMinute: 1080,
    })),
  });

  console.log("Admin  0000 -> store:", store.slug, "(/admin/" + store.slug + ")");
  console.log("Worker 0001 -> staff at:", store.slug, "(/staff/" + store.slug + "), Mon-Sat 09:00-18:00");
  console.log("Client 0002 -> plain consumer account, no store membership");
  console.log("Services: Men's haircut (30min, 15 AZN), Beard trim (15min, 8 AZN)");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
