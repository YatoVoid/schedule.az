import { requestOtp, verifyOtp } from "../src/lib/otp";
import { prisma } from "../src/lib/prisma";

async function main() {
  await prisma.user.deleteMany({ where: { email: "tourist@example.com" } });

  const identifier = { type: "email" as const, value: "tourist@example.com" };

  let capturedCode = "";
  const originalLog = console.log;
  console.log = (msg: string) => {
    const match = /verification code is (\d{6})/.exec(msg);
    if (match) capturedCode = match[1];
    originalLog(msg);
  };
  await requestOtp(identifier);
  console.log = originalLog;

  if (!capturedCode) throw new Error("did not capture code from dev email log");

  const wrongAttempt = await verifyOtp(identifier, "000000");
  console.log("wrong code rejected:", wrongAttempt === null);

  const correctAttempt = await verifyOtp(identifier, capturedCode);
  console.log("correct code accepted:", correctAttempt?.email === identifier.value);

  const replay = await verifyOtp(identifier, capturedCode);
  console.log("replay of consumed code rejected:", replay === null);

  const user = await prisma.user.findUnique({ where: { email: identifier.value } });
  console.log("user has no phone, email set:", user?.phone === null, user?.email === identifier.value);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
