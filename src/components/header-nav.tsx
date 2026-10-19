"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export type HeaderLink = { href: string; label: string };

function isActive(link: HeaderLink, pathname: string, tab: string | null): boolean {
  const [path, query] = link.href.split("?");
  const current = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  if (path !== current) return false;
  const linkTab = new URLSearchParams(query ?? "").get("tab");
  if (path === "/account") return (linkTab ?? "upcoming") === (tab ?? "upcoming");
  return true;
}

export function HeaderNav({ links, className }: { links: HeaderLink[]; className?: string }) {
  const pathname = usePathname();
  const tab = useSearchParams().get("tab");

  return (
    <nav aria-label="Main" className={cn("flex items-center gap-1", className)}>
      {links.map((link) => {
        const active = isActive(link, pathname, tab);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative shrink-0 rounded-md px-3 py-2 text-sm transition-colors",
              active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
            {active && <span aria-hidden className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" />}
          </Link>
        );
      })}
    </nav>
  );
}
