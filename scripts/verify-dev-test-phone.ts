import { sealData } from "iron-session";
import { isDevTestPhone } from "../src/lib/phone";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("isDevTestPhone('0001'):", isDevTestPhone("0001"));
  console.log("isDevTestPhone('+994501234567'):", isDevTestPhone("+994501234567"));
  console.log("isDevTestPhone('00011'):", isDevTestPhone("00011"));

  // Mirrors exactly what inviteStaffAction does once isDevTestPhone("0001")
  // is true: upsert-by-phone, then create a STAFF StoreMember.
  const store = await prisma.store.findFirst({ where: { slug: "kingston-test" } });
  if (!store) throw new Error("run scripts/verify-flow.ts first to seed kingston-test");

  await prisma.storeMember.deleteMany({ where: { storeId: store.id, user: { phone: "0001" } } });
  await prisma.user.deleteMany({ where: { phone: "0001" } });

  const staffUser = await prisma.user.upsert({
    where: { phone: "0001" },
    update: {},
    create: { phone: "0001" },
  });
  await prisma.storeMember.create({ data: { storeId: store.id, userId: staffUser.id, role: "STAFF" } });

  const cookie = await sealData(
    { userId: staffUser.id },
    { password: process.env.SESSION_SECRET as string },
  );
  console.log("STAFF_0001_COOKIE=" + cookie);
  console.log("STORE_SLUG=" + store.slug);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
