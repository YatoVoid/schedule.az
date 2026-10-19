import Link from "next/link";
import { ChevronDownIcon, PlusIcon } from "lucide-react";
import type { UserMembership } from "@/lib/auth";

const ROLE_LABEL: Record<UserMembership["role"], string> = {
  ADMIN: "Owner",
  STAFF: "Staff",
};

// Native <details>/<summary>: no JS needed to open/close. Each row is a
// Link, so picking one just navigates and nothing stays open behind it.
export function BusinessSwitcher({
  memberships,
  currentSlug,
  label,
  shortLabel,
  className,
}: {
  memberships: UserMembership[];
  currentSlug?: string;
  label: string;
  shortLabel?: string;
  className?: string;
}) {
  if (memberships.length === 0) return null;
  const ownsABusiness = memberships.some((m) => m.role === "ADMIN");

  return (
    <details className={`group relative ${className ?? ""}`}>
      <summary className="flex h-9 list-none cursor-pointer items-center gap-2 rounded-full border border-sage-line bg-sage-soft px-3.5 text-sm font-medium text-primary marker:content-none hover:bg-sage [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="size-1.5 rounded-full bg-coral" />
        {shortLabel ? (
          <>
            <span className="sm:hidden">{shortLabel}</span>
            <span className="hidden sm:inline">{label}</span>
          </>
        ) : (
          label
        )}
        <ChevronDownIcon aria-hidden className="size-3.5 transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 top-full z-30 mt-2 min-w-60 overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg">
        {memberships.map((m) => (
          <Link
            key={m.storeSlug}
            href={m.href}
            aria-current={m.storeSlug === currentSlug ? "page" : undefined}
            className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted aria-[current=page]:bg-sage-soft aria-[current=page]:font-medium"
          >
            <span className="truncate">{m.storeName}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{ROLE_LABEL[m.role]}</span>
          </Link>
        ))}
        <Link
          href="/onboarding"
          className="mt-1 flex items-center gap-2 rounded-lg border-t px-3 py-2 text-sm text-primary hover:bg-muted"
        >
          <PlusIcon className="size-3.5" />
          {ownsABusiness ? "Add another business" : "Start your own business"}
        </Link>
      </div>
    </details>
  );
}
