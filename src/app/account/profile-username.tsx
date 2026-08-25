"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveUsernameAction } from "@/app/profile-setup/actions";

export function ProfileUsername({ initialUsername }: { initialUsername: string | null }) {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(initialUsername ?? "");
  const [savedUsername, setSavedUsername] = useState(initialUsername);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveUsernameAction(username);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSavedUsername(username.trim().toLowerCase());
      setEditing(false);
      toast.success("Saved");
    });
  }

  if (editing) {
    return (
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!isPending && username.trim().length >= 3) save();
        }}
      >
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          placeholder="username"
          className="h-9 max-w-48 text-sm"
          autoFocus
        />
        <Button type="submit" size="sm" disabled={isPending || username.trim().length < 3}>
          Save
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setEditing(false);
            setUsername(savedUsername ?? "");
            setError(null);
          }}
        >
          Cancel
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <p className="text-sm text-muted-foreground">{savedUsername ? `@${savedUsername}` : "No username set"}</p>
      <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
        {savedUsername ? "Change username" : "Add a username"}
      </Button>
    </div>
  );
}
