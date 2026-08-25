"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PhoneIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CategoryPicker } from "@/components/category-picker";
import { AddressMapPicker, type AddressValue } from "@/components/address-map-picker";
import { createStoreAction } from "./actions";

export function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [addressValue, setAddressValue] = useState<AddressValue>({
    address: "",
    latitude: null,
    longitude: null,
  });
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createStoreAction({
        name,
        category,
        address: addressValue.address,
        phone,
        description,
        latitude: addressValue.latitude,
        longitude: addressValue.longitude,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.warning) toast.warning(result.warning);
      router.push(result.redirectTo ?? "/");
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
        <Label htmlFor="name">Business name</Label>
        <Input
          id="name"
          placeholder="Kingston Barbershop"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-12 text-base"
        />
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
        <Label htmlFor="description">Short description (optional)</Label>
        <Textarea
          id="description"
          placeholder="What makes your place worth booking?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        size="lg"
        className="h-12 text-base"
        disabled={isPending || !name.trim() || !category}
      >
        {isPending ? "Creating..." : "Create my business page"}
      </Button>
    </form>
  );
}
