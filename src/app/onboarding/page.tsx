import { prisma } from "@/lib/prisma";
import { requireUser, getUserMemberships } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
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
  const memberships = await getUserMemberships(user.id);

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader loggedIn userName={user.name} memberships={memberships} />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-4 py-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-heading text-4xl font-medium tracking-tight">
            {isAddingAnother ? "Add another" : "Set up your"}
            <br />
            <em className="font-serif text-5xl font-normal text-blossom-ink">business</em>
          </h1>
          <p className="max-w-sm text-muted-foreground">
            {isAddingAnother
              ? "You can switch between your businesses anytime from the header."
              : "Takes a minute. You can invite staff and add services right after."}
          </p>
        </div>

        {isAddingAnother && (
          <section className="flex flex-col gap-3">
            <p className="eyebrow text-center text-primary">You already own</p>
            <ul className="surface flex flex-col gap-2 p-4">
              {existingStores.map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm">
                  <span className="truncate">{m.store.name}</span>
                  <span className="text-xs text-muted-foreground">Owner</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="flex flex-col gap-3">
          {isAddingAnother && <p className="eyebrow text-center text-primary">Make a new business</p>}
          <div className="surface flex flex-col gap-5 p-5 sm:p-6">
            <h2 className="eyebrow text-sm text-muted-foreground">Business details</h2>
            <OnboardingForm />
          </div>
        </section>
      </main>
    </div>
  );
}
