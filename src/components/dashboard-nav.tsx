"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BusinessSwitcher } from "@/components/business-switcher";
import { logoutAction } from "@/app/actions";
import type { UserMembership } from "@/lib/auth";

export function DashboardNav({
  storeSlug,
  storeName,
  roleLabel,
  logoUrl,
  links,
  memberships,
}: {
  storeSlug: string;
  storeName: string;
  roleLabel: string;
  logoUrl: string | null;
  links: { href: string; label: string }[];
  memberships: UserMembership[];
}) {
  const pathname = usePathname();
  const ownsABusiness = memberships.some((m) => m.role === "ADMIN");

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3">
        {/* flex-wrap: with a dashboard link, an "add/start a business" link,
            and a business switcher all competing for one row, a staff
            member who also owns another business doesn't fit them on one
            line below ~430px — wrapping to a second line beats overflowing
            past the viewport or squeezing text unreadably thin. */}
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <Link
            href="/"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <span className="sm:hidden">← Schedule.az</span>
            <span className="hidden sm:inline">← Browse Schedule.az</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/onboarding"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <span className="sm:hidden">{ownsABusiness ? "Add business" : "Start a business"}</span>
              <span className="hidden sm:inline">
                {ownsABusiness ? "Add another business" : "Start your own business"}
              </span>
            </Link>
            {memberships.length > 1 && (
              <BusinessSwitcher
                memberships={memberships}
                excludeSlug={storeSlug}
                label="Switch business"
                shortLabel="Switch"
              />
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              {logoUrl && <AvatarImage src={logoUrl} alt="" />}
              <AvatarFallback className="text-xs">{storeName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-heading font-medium leading-tight">{storeName}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Log out
            </Button>
          </form>
        </div>
        {/* On narrow screens this row can overflow (6 tabs no longer fit at
            ~390px since Reviews was added) — the mask-image edge fade is the
            only cue that it scrolls, since there's no visible scrollbar on
            most mobile browsers and no room for a persistent arrow icon. */}
        <nav
          className="-mx-4 flex gap-1 overflow-x-auto px-4"
          style={{
            maskImage: "linear-gradient(to right, black calc(100% - 24px), transparent)",
            WebkitMaskImage: "linear-gradient(to right, black calc(100% - 24px), transparent)",
          }}
        >
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
