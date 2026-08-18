"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function StoreSearchForm({
  initialQuery,
  initialCategory,
  categories,
}: {
  initialQuery: string;
  initialCategory: string;
  categories: string[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action="/" method="GET" className="flex flex-col items-stretch gap-2 sm:flex-row">
      <Input
        name="q"
        defaultValue={initialQuery}
        placeholder="Search a business or a worker's name..."
        className="h-12! flex-1 text-base"
      />
      <input type="hidden" name="category" id="category-hidden" defaultValue={initialCategory} />
      <Select
        defaultValue={initialCategory || "ALL"}
        onValueChange={(v) => {
          const hidden = document.getElementById("category-hidden") as HTMLInputElement | null;
          if (hidden) hidden.value = v === "ALL" ? "" : (v ?? "");
          formRef.current?.requestSubmit();
        }}
      >
        <SelectTrigger className="h-12! w-full text-base sm:w-48">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All types</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </form>
  );
}
