"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { PhoneIcon } from "lucide-react";
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
    phone: string;
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
  const [phone, setPhone] = useState(initial.phone);
  const [description, setDescription] = useState(initial.description);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await updateStoreAction(slug, {
        name,
        category,
        address: addressValue.address,
        phone,
        description,
        latitude: addressValue.latitude,
        longitude: addressValue.longitude,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.warning) {
        toast.warning(result.warning);
      } else {
        toast.success("Saved");
      }
    });
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!isPending) handleSubmit();
      }}
    >
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
        <Label htmlFor="phone">Business phone (optional)</Label>
        <div className="relative">
          <PhoneIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="phone"
            inputMode="tel"
            placeholder="012 345 67 89"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-12 pl-10 text-base"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Shown to customers, and helps tell your business apart if another one shares its name.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <Button type="submit" size="lg" className="h-12 text-base" disabled={isPending}>
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
