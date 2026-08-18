import { prisma } from "../src/lib/prisma";
import { generateUniqueStoreSlug } from "../src/lib/slug";

// Mirrors the real flow exactly: OTP-login upserts a User by phone,
// onboarding creates a Store + ADMIN StoreMember, inviting staff upserts a
// User by phone and creates a STAFF StoreMember. Nothing here is a shortcut
// that bypasses the actual data model.
async function main() {
  const admin = await prisma.user.upsert({
    where: { phone: "0000" },
    update: {},
    create: { phone: "0000" },
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
    update: {},
    create: { phone: "0001" },
  });
  await prisma.storeMember.create({ data: { storeId: store.id, userId: worker.id, role: "STAFF" } });

  await prisma.user.upsert({
    where: { phone: "0002" },
    update: {},
    create: { phone: "0002" },
  });

  console.log("Admin  0000 -> store:", store.slug, "(/admin/" + store.slug + ")");
  console.log("Worker 0001 -> staff at:", store.slug, "(/staff/" + store.slug + ")");
  console.log("Client 0002 -> plain consumer account, no store membership");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
