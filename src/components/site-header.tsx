import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BusinessSwitcher } from "@/components/business-switcher";
import { HeaderNav, type HeaderLink } from "@/components/header-nav";
import { logoutAction } from "@/app/actions";
import type { UserMembership } from "@/lib/auth";

const CONSUMER_LINKS: HeaderLink[] = [
  { href: "/", label: "Discover" },
  { href: "/account?tab=upcoming", label: "Bookings" },
  { href: "/account?tab=favorites", label: "Favorites" },
];

export function SiteHeader({
  loggedIn,
  userName,
  memberships = [],
  links = CONSUMER_LINKS,
  scrollLinksOnMobile = false,
  currentSlug,
}: {
  loggedIn: boolean;
  userName?: string | null;
  memberships?: UserMembership[];
  links?: HeaderLink[];
  // Dashboards have no bottom tab bar, so their section links stay
  // reachable on phones as a scrolling second row. Consumer pages leave
  // them to MobileTabBar.
  scrollLinksOnMobile?: boolean;
  currentSlug?: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-semibold tracking-tight">
          <Image src="/logo-mark.png" alt="" width={30} height={30} className="size-7.5" priority />
          Schedule.az
        </Link>

        <Suspense fallback={<div />}>
          <HeaderNav links={links} className="hidden justify-center md:flex" />
        </Suspense>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          {loggedIn ? (
            <>
              {memberships.length > 0 && (
                <BusinessSwitcher
                  memberships={memberships}
                  currentSlug={currentSlug}
                  label="Your businesses"
                  shortLabel="Businesses"
                />
              )}
              <Link
                href="/account?tab=profile"
                className={`items-center gap-1.5 rounded-md px-2 py-2 text-sm text-foreground hover:bg-muted ${scrollLinksOnMobile ? "flex" : "hidden sm:flex"}`}
              >
                <UserIcon className="size-4" />
                <span className="sr-only max-w-32 truncate sm:not-sr-only">{userName || "My account"}</span>
              </Link>
              <form action={logoutAction} className="hidden sm:block">
                <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <Button
              render={<Link href="/login?next=/account" />}
              nativeButton={false}
              size="sm"
              className="h-9 rounded-full px-4"
            >
              Log in
            </Button>
          )}
        </div>
      </div>

      {scrollLinksOnMobile && (
        <Suspense fallback={null}>
          <HeaderNav
            links={links}
            className="overflow-x-auto px-2 pb-1 md:hidden"
          />
        </Suspense>
      )}
    </header>
  );
}
