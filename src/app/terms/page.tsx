import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser, getUserMemberships } from "@/lib/auth";

export const metadata: Metadata = { title: "Terms of Service" };

export default async function TermsPage() {
  const currentUser = await getCurrentUser();
  const memberships = currentUser ? await getUserMemberships(currentUser.id) : [];

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader loggedIn={!!currentUser} memberships={memberships} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
        <h1 className="font-heading text-2xl font-medium tracking-tight">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated August 25, 2026.</p>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-medium">What Schedule.az is</h2>
          <p>
            Schedule.az is a directory and booking tool for service businesses in Baku. We connect
            customers with businesses and pass along the booking details each side needs. We are not a
            party to the service a business provides you, and we don&apos;t set or collect payment for
            it, prices and payment are handled directly between you and the business.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-medium">Accounts</h2>
          <p>
            You log in with a phone number or email using a one-time code. You&apos;re responsible for
            keeping access to that phone number or inbox secure, since it&apos;s how anyone can sign in
            to your account. Give us accurate contact information, since it&apos;s how a business reaches
            you about a booking.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-medium">Bookings and reviews</h2>
          <p>
            A booking you make is a request to the business; the business can accept, decline, or
            reschedule it. Showing up, cancelling, and paying for the service you booked are between you
            and the business.
          </p>
          <p>
            You can only leave a rating for a business after a booking there is marked completed. Reviews
            must reflect an actual experience with that business. We may remove a review that&apos;s
            fake, abusive, or violates someone&apos;s rights.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-medium">Reporting content</h2>
          <p>
            If you believe a review, business listing, or photo on Schedule.az infringes your rights or
            violates these terms, email{" "}
            <a href="mailto:legal@schedule.az" className="underline underline-offset-4">
              legal@schedule.az
            </a>{" "}
            with a description of the content, its location on the site, and why it should be removed.
            We review reports and remove content that violates these terms or applicable law.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-medium">Content ownership</h2>
          <p>
            You keep ownership of photos and text you upload, and you grant us permission to display them
            on Schedule.az for the purpose of running the directory and booking flow. Don&apos;t upload
            anything you don&apos;t have the right to post.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-medium">Liability</h2>
          <p>
            Schedule.az is provided as-is. We work to keep bookings accurate and the site available, but
            we don&apos;t guarantee a business will honor a booking, and we&apos;re not liable for a
            business&apos;s service, pricing, or conduct. To the extent allowed by law, our liability to
            you for any claim related to the service is limited to the amount, if any, you&apos;ve paid
            us directly in the past twelve months.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-medium">Changes to these terms</h2>
          <p>
            We may update these terms as the product changes. If a change is material, we&apos;ll update
            the date above and, where practical, let logged-in users know before it takes effect.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-medium">Contact</h2>
          <p>
            Questions about these terms:{" "}
            <a href="mailto:legal@schedule.az" className="underline underline-offset-4">
              legal@schedule.az
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
