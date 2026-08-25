import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BusinessSwitcher } from "@/components/business-switcher";
import { logoutAction } from "@/app/actions";
import type { UserMembership } from "@/lib/auth";

export function SiteHeader({
  loggedIn,
  showAccountLink = true,
  memberships = [],
}: {
  loggedIn: boolean;
  showAccountLink?: boolean;
  memberships?: UserMembership[];
}) {
  return (
    <header className="border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-heading text-lg font-medium tracking-tight">
          <Image src="/logo-mark.png" alt="" width={28} height={28} className="size-7" priority />
          Schedule<span className="text-primary">.az</span>
        </Link>
        <nav className="flex items-center gap-2">
          {loggedIn ? (
            <>
              {memberships.length === 1 && (
                <Button
                  render={<Link href={memberships[0].href} />}
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                >
                  <span className="sm:hidden">Dashboard</span>
                  <span className="hidden sm:inline">
                    {memberships[0].role === "ADMIN" ? "Business dashboard" : "Staff dashboard"}
                  </span>
                </Button>
              )}
              {memberships.length > 1 && (
                <BusinessSwitcher memberships={memberships} label="Your businesses" shortLabel="Businesses" />
              )}
              {/* The bottom tab bar's Profile tab already covers account
                  access and log out on mobile (src/components/mobile-tab-bar.tsx),
                  so these are redundant there — and with a dashboard button
                  in the mix too, keeping all three here overflowed the
                  header at 390px, pushing into (and visually covering) the
                  wordmark. */}
              {showAccountLink && (
                <Button
                  render={<Link href="/account" />}
                  nativeButton={false}
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  My account
                </Button>
              )}
              <form action={logoutAction} className="hidden sm:block">
                <Button type="submit" variant="ghost" size="sm">
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <Button render={<Link href="/login?next=/account" />} nativeButton={false} variant="default" size="sm">
              Log in
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
