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
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            ← Browse Schedule.az
          </Link>
          <div className="flex items-center gap-2">
            {!ownsABusiness && (
              <Link
                href="/onboarding"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Start your own business
              </Link>
            )}
            {memberships.length > 1 && (
              <BusinessSwitcher memberships={memberships} excludeSlug={storeSlug} label="Switch business" />
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
              <p className="truncate font-semibold leading-tight">{storeName}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Log out
            </Button>
          </form>
        </div>
        <nav className="-mx-4 flex gap-1 overflow-x-auto px-4">
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
