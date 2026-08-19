import Link from "next/link";
import type { UserMembership } from "@/lib/auth";

const ROLE_LABEL: Record<UserMembership["role"], string> = {
  ADMIN: "Owner",
  STAFF: "Staff",
};

// Native <details>/<summary>: no JS needed to open/close, matches this
// system's plain-and-functional Operate register. Each row is a Link, so
// picking one just navigates — nothing left open behind it.
export function BusinessSwitcher({
  memberships,
  excludeSlug,
  label,
  className,
}: {
  memberships: UserMembership[];
  excludeSlug?: string;
  label: string;
  className?: string;
}) {
  const options = excludeSlug ? memberships.filter((m) => m.storeSlug !== excludeSlug) : memberships;
  if (options.length === 0) return null;

  return (
    <details className={`group relative ${className ?? ""}`}>
      <summary className="flex list-none cursor-pointer items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm font-medium text-foreground marker:content-none hover:bg-muted [&::-webkit-details-marker]:hidden">
        {label}
        <span aria-hidden className="text-xs text-muted-foreground">
          ▾
        </span>
      </summary>
      <div className="absolute right-0 top-full z-30 mt-1 min-w-52 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
        {options.map((m) => (
          <Link
            key={m.storeSlug}
            href={m.href}
            className="flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-muted"
          >
            <span className="truncate">{m.storeName}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{ROLE_LABEL[m.role]}</span>
          </Link>
        ))}
      </div>
    </details>
  );
}
