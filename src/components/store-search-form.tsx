"use client";

import { useEffect, useRef } from "react";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DirectoryFilters, type DirectorySort } from "@/components/directory-filters";

export function StoreSearchForm({
  initialQuery,
  initialCategory,
  initialSort,
  initialLat,
  initialLng,
  categories,
  autoFocusSearch,
}: {
  initialQuery: string;
  initialCategory: string;
  initialSort: DirectorySort;
  initialLat: string;
  initialLng: string;
  categories: string[];
  autoFocusSearch?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // A plain `autoFocus` prop only fires on first mount. Tapping the bottom
  // tab bar's Search tab while already on "/" is a soft navigation (same
  // route, only the `focus` query param changes) that reuses this same
  // mounted component, so autoFocus alone silently did nothing the second
  // time. This effect re-focuses on every transition into focus=search.
  useEffect(() => {
    if (!autoFocusSearch) return;
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [autoFocusSearch]);

  return (
    <form ref={formRef} action="/" method="GET" className="flex flex-col items-stretch gap-2 sm:flex-row">
      <div className="relative flex-1">
        <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          name="q"
          defaultValue={initialQuery}
          aria-label="Search businesses"
          placeholder="Search a business or a worker's name..."
          className="h-12! rounded-full border-sage-line bg-card pl-11 text-base shadow-sm"
        />
      </div>
      <DirectoryFilters
        formRef={formRef}
        initialSort={initialSort}
        initialCategory={initialCategory}
        initialLat={initialLat}
        initialLng={initialLng}
        categories={categories}
      />
    </form>
  );
}
