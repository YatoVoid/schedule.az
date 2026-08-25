import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser, getUserMemberships } from "@/lib/auth";

export const metadata: Metadata = { title: "Privacy Policy" };

export default async function PrivacyPage() {
  const currentUser = await getCurrentUser();
  const memberships = currentUser ? await getUserMemberships(currentUser.id) : [];

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader loggedIn={!!currentUser} memberships={memberships} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
        <h1 className="font-heading text-2xl font-medium tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated August 25, 2026.</p>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-medium">What we collect</h2>
          <p>
            To create an account we collect a phone number or email address, and whichever name and
            username you set afterward. If you upload a profile photo, business logo, or business
            photos, we store those image files. If a business sets an address or map location for
            itself, that location is public on its store page.
          </p>
          <p>
            When you book an appointment, we store the store, service, staff member, and time you
            booked, plus any note you add. If you leave a rating, we store the rating and any comment
            you write.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-medium">How we use it</h2>
          <p>
            Your phone number or email is used to send a one-time login code and, where a business has
            SMS/email reminders enabled, booking confirmations and reminders. We do not sell your data
            or share it with advertisers. We do not run third-party analytics or advertising trackers on
            this site.
          </p>
          <p>
            A business you book with can see your name, phone or email, and booking history with that
            business. A business cannot see your bookings or reviews at other businesses.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-medium">Where it&apos;s stored</h2>
          <p>
            Account, booking, and review data is stored in a database we operate. Uploaded images
            (avatars, logos, business photos) are stored on our server&apos;s disk. Login codes are sent
            through Resend (email) or a self-hosted SMS gateway (phone) and are not retained by us
            beyond what&apos;s needed to verify the code you entered.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-medium">Your choices</h2>
          <p>
            You can edit your name, username, and avatar from your account page at any time. You can
            remove a favorite or cancel an upcoming booking yourself. To delete your account entirely or
            request a copy of your data, email us at{" "}
            <a href="mailto:privacy@schedule.az" className="underline underline-offset-4">
              privacy@schedule.az
            </a>{" "}
            and we&apos;ll act on it within a reasonable time.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-medium">Changes</h2>
          <p>
            If we materially change what we collect or how we use it, we&apos;ll update this page and
            change the date above.
          </p>
        </section>
      </main>
    </div>
  );
}
