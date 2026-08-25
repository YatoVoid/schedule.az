import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackLink } from "@/components/back-link";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await requireUser();

  // One account can own more than one business — this page always shows
  // the create-a-business form, whether or not the user already owns one
  // elsewhere. Existing businesses are just listed for context so "Add
  // another business" doesn't read like a first-time signup.
  const existingStores = await prisma.storeMember.findMany({
    where: { userId: user.id, role: "ADMIN" },
    include: { store: true },
    orderBy: { store: { name: "asc" } },
  });
  const isAddingAnother = existingStores.length > 0;

  return (
    <main className="flex flex-1 flex-col items-center bg-secondary/40 px-4 py-12">
      <div className="w-full max-w-md">
        <BackLink />
        <h1 className="mb-1 text-center text-2xl font-semibold tracking-tight">
          {isAddingAnother ? "Add another business" : "Set up your business"}
        </h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          {isAddingAnother
            ? "You can switch between your businesses anytime from the dashboard."
            : "Takes a minute. You can invite staff and add services right after."}
        </p>

        {isAddingAnother && (
          <div className="mb-6 flex flex-col gap-1 rounded-md border bg-card p-3 text-sm">
            <p className="text-muted-foreground">You already own:</p>
            {existingStores.map((m) => (
              <p key={m.id} className="font-medium">
                {m.store.name}
              </p>
            ))}
          </div>
        )}

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
