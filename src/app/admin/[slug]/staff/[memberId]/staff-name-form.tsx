"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActionResult } from "@/app/login/actions";

export function StaffNameForm({
  initialName,
  phone,
  email,
  role,
  onSave,
}: {
  initialName: string;
  phone: string | null;
  email: string | null;
  role: "ADMIN" | "STAFF";
  onSave: (name: string) => Promise<ActionResult>;
}) {
  const [name, setName] = useState(initialName);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await onSave(name);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Saved");
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">Profile</CardTitle>
          <Badge variant={role === "ADMIN" ? "default" : "outline"}>{role === "ADMIN" ? "Admin" : "Staff"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="staff-name">Name</Label>
          <Input
            id="staff-name"
            placeholder="Unnamed"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 text-base"
          />
        </div>
        <p className="text-sm text-muted-foreground">Logs in with {phone ?? email}</p>
        <Button onClick={handleSave} disabled={isPending} className="h-11 self-start text-sm">
          {isPending ? "Saving..." : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}
