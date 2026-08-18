"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServiceAction, deleteServiceAction, toggleServiceAction } from "./actions";

type ServiceRow = {
  id: string;
  name: string;
  durationMin: number;
  priceAzn: string | null;
  active: boolean;
};

export function ServiceManager({ slug, services }: { slug: string; services: ServiceRow[] }) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    startTransition(async () => {
      const result = await createServiceAction(slug, { name, durationMin: duration, priceAzn: price });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setName("");
      setPrice("");
      toast.success("Service added");
    });
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      const result = await toggleServiceAction(slug, id);
      if (!result.ok) toast.error(result.error);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteServiceAction(slug, id);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add a service</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="svc-name">Name</Label>
            <Input id="svc-name" value={name} onChange={(e) => setName(e.target.value)} className="h-12 text-base" placeholder="Men's haircut" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="svc-duration">Duration (min)</Label>
              <Input
                id="svc-duration"
                inputMode="numeric"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="h-12 text-base"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="svc-price">Price (AZN)</Label>
              <Input
                id="svc-price"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-12 text-base"
                placeholder="Discussed in store"
              />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={isPending || !name.trim()} className="h-12 text-base">
            Add service
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {services.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">No services yet.</p>
        )}
        {services.map((service) => (
          <div
            key={service.id}
            className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{service.name}</p>
              <p className="text-sm text-muted-foreground">
                {service.durationMin} min · {service.priceAzn ? `${service.priceAzn} AZN` : "Discussed in store"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge
                variant={service.active ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleToggle(service.id)}
              >
                {service.active ? "Active" : "Hidden"}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(service.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
