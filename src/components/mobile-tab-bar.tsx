"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { HomeIcon, SearchIcon, CalendarIcon, HeartIcon, UserIcon } from "lucide-react";

// Consumer-facing only: hidden on admin/staff dashboards, onboarding, and
// auth screens, which have their own navigation (DashboardNav, or are a
// single-purpose screen with nothing to tab between). Scope intentionally
// stops there until the admin/staff mobile-nav question is settled.
const HIDDEN_PREFIXES = ["/admin", "/staff", "/onboarding", "/login", "/profile-setup"];

type TabKey = "home" | "search" | "bookings" | "favorites" | "profile";

const TABS: { key: TabKey; href: string; label: string; icon: typeof HomeIcon }[] = [
  { key: "home", href: "/", label: "Home", icon: HomeIcon },
  { key: "search", href: "/?focus=search", label: "Search", icon: SearchIcon },
  { key: "bookings", href: "/account?tab=upcoming", label: "Bookings", icon: CalendarIcon },
  { key: "favorites", href: "/account?tab=favorites", label: "Favorites", icon: HeartIcon },
  { key: "profile", href: "/account?tab=profile", label: "Profile", icon: UserIcon },
];

function activeTab(pathname: string, tab: string | null, focus: string | null): TabKey | null {
  if (pathname === "/") return focus === "search" ? "search" : "home";
  if (pathname === "/account") {
    if (tab === "favorites") return "favorites";
    if (tab === "profile") return "profile";
    return "bookings";
  }
  return null;
}

export function MobileTabBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  const active = activeTab(pathname, searchParams.get("tab"), searchParams.get("focus"));

  return (
    <>
      {/* Reserves the space the fixed bar below occupies, so page content
          (e.g. a footer, or the last card in a list) never sits underneath
          it. Only rendered alongside the bar itself, same hidden-route gate. */}
      <div className="h-16 md:hidden" aria-hidden />
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card md:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-between">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.key === active;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="size-5" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
