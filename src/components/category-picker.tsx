"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const BUSINESS_CATEGORIES = [
  "Barbershop",
  "Hair salon",
  "Beauty salon",
  "Spa",
  "Nail studio",
  "Massage",
  "Tattoo studio",
  "Gym / fitness",
  "Tutoring",
  "Other",
];

// value is the resolved category string the rest of the app sees, e.g.
// "Barbershop" or a freeform "Dog grooming" typed under "Other". This
// component hides the preset-vs-custom split from callers entirely.
export function CategoryPicker({
  id = "category",
  value,
  onChange,
}: {
  id?: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const [selectValue, setSelectValue] = useState(() =>
    BUSINESS_CATEGORIES.includes(value) ? value : value ? "Other" : "",
  );
  const [customText, setCustomText] = useState(() =>
    BUSINESS_CATEGORIES.includes(value) ? "" : value,
  );

  function handleSelect(next: string) {
    setSelectValue(next);
    if (next === "Other") {
      onChange(customText);
    } else {
      onChange(next);
    }
  }

  function handleCustomChange(next: string) {
    setCustomText(next);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <Select value={selectValue} onValueChange={(v) => handleSelect(v ?? "")}>
        <SelectTrigger id={id} className="h-12 text-base">
          <SelectValue placeholder="Choose a category" />
        </SelectTrigger>
        <SelectContent>
          {BUSINESS_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectValue === "Other" && (
        <Input
          placeholder="What kind of business is it?"
          value={customText}
          onChange={(e) => handleCustomChange(e.target.value)}
          className="h-12 text-base"
        />
      )}
    </div>
  );
}
