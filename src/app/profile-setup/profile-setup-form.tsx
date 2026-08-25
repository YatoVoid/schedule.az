"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarUploader } from "@/components/avatar-uploader";
import { checkUsernameAvailableAction, saveUsernameAction } from "./actions";

type Availability = "idle" | "checking" | "available" | "taken" | "invalid";

export function ProfileSetupForm({
  next,
  initialAvatarUrl,
  fallbackInitial,
}: {
  next: string;
  initialAvatarUrl: string | null;
  fallbackInitial: string;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [availability, setAvailability] = useState<Availability>("idle");
  const [checkError, setCheckError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = username.trim();
    debounceRef.current = setTimeout(() => {
      if (trimmed.length < 3) {
        setAvailability("idle");
        return;
      }
      setAvailability("checking");
      checkUsernameAvailableAction(trimmed).then((result) => {
        if (!result.ok) {
          setAvailability("invalid");
          setCheckError(result.error);
          return;
        }
        setAvailability(result.available ? "available" : "taken");
      });
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username]);

  function handleSubmit() {
    setSubmitError(null);
    startTransition(async () => {
      const result = await saveUsernameAction(username);
      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }
      router.push(next);
    });
  }

  const canSubmit = availability === "available" && !isPending;

  return (
    <form
      className="flex flex-col items-center gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) handleSubmit();
      }}
    >
      <AvatarUploader initialAvatarUrl={initialAvatarUrl} fallbackInitial={fallbackInitial} />

      <div className="flex w-full flex-col gap-2">
        <Label htmlFor="username">Username</Label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-base text-muted-foreground">
            @
          </span>
          <Input
            id="username"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            className="h-12 pl-7 text-base"
          />
        </div>
        <p className="min-h-5 text-sm">
          {availability === "checking" && <span className="text-muted-foreground">Checking...</span>}
          {availability === "available" && <span className="text-foreground">✓ Available</span>}
          {availability === "taken" && <span className="text-destructive">Already taken</span>}
          {availability === "invalid" && <span className="text-destructive">{checkError}</span>}
        </p>
      </div>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={!canSubmit}>
        {isPending ? "Saving..." : "Continue"}
      </Button>
    </form>
  );
}
