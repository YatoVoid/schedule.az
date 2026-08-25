"use client";

import { useEffect, useRef } from "react";
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
      <Input
        ref={inputRef}
        name="q"
        defaultValue={initialQuery}
        placeholder="Search a business or a worker's name..."
        className="h-12! flex-1 text-base"
      />
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
