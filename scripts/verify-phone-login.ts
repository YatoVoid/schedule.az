import { requestOtp, verifyOtp } from "../src/lib/otp";
import { prisma } from "../src/lib/prisma";

async function main() {
  await prisma.user.deleteMany({ where: { phone: "+994509998877" } });

  const identifier = { type: "phone" as const, value: "+994509998877" };

  let capturedCode = "";
  const originalLog = console.log;
  console.log = (msg: string) => {
    const match = /kodunuz: (\d{6})/.exec(msg);
    if (match) capturedCode = match[1];
    originalLog(msg);
  };
  await requestOtp(identifier);
  console.log = originalLog;

  if (!capturedCode) throw new Error("did not capture code from dev sms log");

  const result = await verifyOtp(identifier, capturedCode);
  console.log("phone login round trip ok:", result?.phone === identifier.value);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
