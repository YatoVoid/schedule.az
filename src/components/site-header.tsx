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
        <Link href="/" className="font-heading text-lg font-medium tracking-tight">
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
                  {memberships[0].role === "ADMIN" ? "Business dashboard" : "Staff dashboard"}
                </Button>
              )}
              {memberships.length > 1 && <BusinessSwitcher memberships={memberships} label="Your businesses" />}
              {showAccountLink && (
                <Button render={<Link href="/account" />} nativeButton={false} variant="ghost" size="sm">
                  My account
                </Button>
              )}
              <form action={logoutAction}>
                <Button type="submit" variant="ghost" size="sm">
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <Button render={<Link href="/login?next=/account" />} nativeButton={false} variant="ghost" size="sm">
              Log in
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
