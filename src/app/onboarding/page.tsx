import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await requireUser();

  // Redirect away only if they already own a business — a staff-only
  // member reaches the form below and can start their own, keeping the
  // existing staff membership alongside the new one they'll own.
  const existingAdmin = await prisma.storeMember.findFirst({
    where: { userId: user.id, role: "ADMIN" },
    include: { store: true },
  });
  if (existingAdmin) {
    redirect(`/admin/${existingAdmin.store.slug}`);
  }

  return (
    <main className="flex flex-1 flex-col items-center bg-secondary/40 px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="mb-1 text-center text-2xl font-semibold tracking-tight">
          Set up your business
        </h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Takes a minute. You can invite staff and add services right after.
        </p>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Business details</CardTitle>
          </CardHeader>
          <CardContent>
            <OnboardingForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
