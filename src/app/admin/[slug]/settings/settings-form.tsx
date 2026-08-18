"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CategoryPicker } from "@/components/category-picker";
import { AddressMapPicker, type AddressValue } from "@/components/address-map-picker";
import { LogoUploader } from "@/components/logo-uploader";
import { updateStoreAction } from "./actions";

export function SettingsForm({
  slug,
  initial,
}: {
  slug: string;
  initial: {
    name: string;
    category: string;
    address: string;
    description: string;
    logoUrl: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}) {
  const [name, setName] = useState(initial.name);
  const [category, setCategory] = useState(initial.category);
  const [addressValue, setAddressValue] = useState<AddressValue>({
    address: initial.address,
    latitude: initial.latitude,
    longitude: initial.longitude,
  });
  const [description, setDescription] = useState(initial.description);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await updateStoreAction(slug, {
        name,
        category,
        address: addressValue.address,
        description,
        latitude: addressValue.latitude,
        longitude: addressValue.longitude,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Saved");
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label>Logo</Label>
        <LogoUploader slug={slug} storeName={name} initialLogoUrl={initial.logoUrl} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Business name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-12 text-base" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="category">Category</Label>
        <CategoryPicker value={category} onChange={setCategory} />
      </div>

      <AddressMapPicker value={addressValue} onChange={setAddressValue} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <Button size="lg" className="h-12 text-base" onClick={handleSubmit} disabled={isPending}>
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </div>
  );
}
