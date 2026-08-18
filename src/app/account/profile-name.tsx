"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setNameAction } from "@/app/[slug]/actions";

export function ProfileName({ initialName, identifier }: { initialName: string | null; identifier: string }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName ?? "");
  const [savedName, setSavedName] = useState(initialName);
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await setNameAction(name);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSavedName(name.trim());
      setEditing(false);
      toast.success("Saved");
    });
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="h-9 max-w-48 text-sm"
          autoFocus
        />
        <Button size="sm" disabled={isPending || name.trim().length < 2} onClick={save}>
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <p className="text-sm text-muted-foreground">{savedName ?? identifier}</p>
      <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
        {savedName ? "Change name" : "Add your name"}
      </Button>
    </div>
  );
}
