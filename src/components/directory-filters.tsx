"use client";

import { useState, type RefObject } from "react";
import { SlidersHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export type DirectorySort = "newest" | "distance" | "rating";

export function DirectoryFilters({
  formRef,
  initialSort,
  initialCategory,
  initialLat,
  initialLng,
  categories,
}: {
  formRef: RefObject<HTMLFormElement | null>;
  initialSort: DirectorySort;
  initialCategory: string;
  initialLat: string;
  initialLng: string;
  categories: string[];
}) {
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState<DirectorySort>(initialSort);
  const [category, setCategory] = useState(initialCategory || "ALL");
  const [coords, setCoords] = useState({ lat: initialLat, lng: initialLng });
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const activeCount = (sort !== "newest" ? 1 : 0) + (category !== "ALL" ? 1 : 0);

  function submit() {
    setOpen(false);
    // Wait a tick so the controlled hidden-input values above have
    // committed to the DOM before the native form reads them.
    requestAnimationFrame(() => formRef.current?.requestSubmit());
  }

  function applySort(next: DirectorySort) {
    setLocationError(null);

    if (next !== "distance") {
      setSort(next);
      setCoords({ lat: "", lng: "" });
      submit();
      return;
    }

    if (!("geolocation" in navigator)) {
      setLocationError("Your browser can't share location.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setSort("distance");
        setCoords({ lat: String(pos.coords.latitude), lng: String(pos.coords.longitude) });
        submit();
      },
      () => {
        setLocating(false);
        setLocationError("Location permission denied.");
      },
      { timeout: 10_000 },
    );
  }

  function applyCategory(next: string) {
    setCategory(next);
    submit();
  }

  return (
    <>
      <input type="hidden" name="category" value={category === "ALL" ? "" : category} readOnly />
      <input type="hidden" name="sort" value={sort === "newest" ? "" : sort} readOnly />
      <input type="hidden" name="lat" value={coords.lat} readOnly />
      <input type="hidden" name="lng" value={coords.lng} readOnly />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button variant="outline" size="lg" className="h-12! gap-2 rounded-full border-sage-line bg-card px-5 text-base shadow-sm" />}>
          <SlidersHorizontalIcon className="size-4" />
          Filters
          {activeCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {activeCount}
            </span>
          )}
        </PopoverTrigger>
        <PopoverContent align="end">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Sort by</Label>
              <RadioGroup value={sort} onValueChange={(v) => applySort(v as DirectorySort)}>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="newest" />
                  Newest
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="distance" />
                  {locating ? "Finding you..." : "Closest to you"}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="rating" />
                  Best reviews
                </label>
              </RadioGroup>
              {locationError && <p className="text-xs text-destructive">{locationError}</p>}
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Category</Label>
              <RadioGroup value={category} onValueChange={applyCategory} className="max-h-48 overflow-y-auto">
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="ALL" />
                  All types
                </label>
                {categories.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm">
                    <RadioGroupItem value={c} />
                    {c}
                  </label>
                ))}
              </RadioGroup>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
