import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser, getUserMemberships } from "@/lib/auth";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";
import { Button } from "@/components/ui/button";
import { stopWinbackReminders } from "./actions";

export const metadata: Metadata = { title: "Reminder settings", robots: { index: false } };

export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const currentUser = await getCurrentUser();
  const memberships = currentUser ? await getUserMemberships(currentUser.id) : [];

  const userId = verifyUnsubscribeToken(token);
  const done = query.done === "1";

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader loggedIn={!!currentUser} memberships={memberships} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-16">
        {!userId ? (
          <>
            <h1 className="font-heading text-2xl font-medium tracking-tight">Link not valid</h1>
            <p className="text-sm text-muted-foreground">
              This reminder link was mistyped or is no longer good. To stop the
              come-back reminders, open the link from a recent message.
            </p>
          </>
        ) : done ? (
          <>
            <h1 className="font-heading text-2xl font-medium tracking-tight">Reminders stopped</h1>
            <p className="text-sm text-muted-foreground">
              You won&apos;t get any more come-back reminders. Reminders about
              appointments you book still go out as usual.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-heading text-2xl font-medium tracking-tight">
              Stop come-back reminders
            </h1>
            <p className="text-sm text-muted-foreground">
              These are the occasional &quot;it&apos;s been a while, book again&quot;
              messages. Reminders for appointments you have already booked are
              separate and keep coming.
            </p>
            <form action={stopWinbackReminders}>
              <input type="hidden" name="token" value={token} />
              <Button type="submit">Stop these reminders</Button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
