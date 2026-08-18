"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveMapsLinkAction } from "@/app/actions";

export type AddressValue = { address: string; latitude: number | null; longitude: number | null };

export function AddressMapPicker({ value, onChange }: { value: AddressValue; onChange: (next: AddressValue) => void }) {
  const [mapsLink, setMapsLink] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleFillFromLink() {
    if (!mapsLink.trim()) return;
    startTransition(async () => {
      const result = await resolveMapsLinkAction(mapsLink.trim());
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onChange({
        address: result.address ?? value.address,
        latitude: result.latitude,
        longitude: result.longitude,
      });
      toast.success("Location set, edit the address below if needed");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="maps-link">Google Maps link (optional)</Label>
        <div className="flex gap-2">
          <Input
            id="maps-link"
            placeholder="https://maps.app.goo.gl/..."
            value={mapsLink}
            onChange={(e) => setMapsLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleFillFromLink();
              }
            }}
            className="h-12 text-base"
          />
          <Button type="button" variant="outline" className="h-12 shrink-0" disabled={isPending || !mapsLink.trim()} onClick={handleFillFromLink}>
            {isPending ? "Finding..." : "Fill from link"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Share your location from Google Maps, paste the link here, the address fills in below and stays
          editable.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          placeholder="28 May küç. 12, Baku"
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          className="h-12 text-base"
        />
      </div>

      {value.latitude !== null && value.longitude !== null && (
        <div className="overflow-hidden rounded-xl border">
          <iframe
            title="Store location"
            src={`https://www.google.com/maps?q=${value.latitude},${value.longitude}&z=16&output=embed`}
            className="h-56 w-full"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}
