"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PhoneIcon, MailIcon, KeyRoundIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendOtpAction, verifyOtpAction, type LoginMethod } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [method, setMethod] = useState<LoginMethod>("phone");
  const [step, setStep] = useState<"identifier" | "code">("identifier");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDevBypass =
    process.env.NODE_ENV !== "production" && method === "phone" && /^\d{4}$/.test(identifier.trim());

  function switchMethod(next: LoginMethod) {
    setMethod(next);
    setIdentifier("");
    setError(null);
  }

  function handleSendCode() {
    setError(null);
    startTransition(async () => {
      const result = await sendOtpAction(method, identifier);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStep("code");
    });
  }

  function handleVerify() {
    setError(null);
    startTransition(async () => {
      const result = await verifyOtpAction(method, identifier, code, next);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(result.redirectTo ?? "/");
    });
  }

  if (step === "identifier") {
    const canSubmit = isDevBypass || identifier.trim().length >= (method === "phone" ? 9 : 5);
    return (
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!isPending && canSubmit) handleSendCode();
        }}
      >
        {method === "phone" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Phone number</Label>
            <div className="relative">
              <PhoneIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                inputMode="tel"
                autoComplete="tel"
                placeholder="050 123 45 67"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="h-12 pl-10 text-base"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <MailIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="h-12 pl-10 text-base"
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" size="lg" className="h-12 text-base" disabled={isPending || !canSubmit}>
          {isPending ? "Sending..." : "Send code"}
        </Button>

        <button
          type="button"
          className="text-sm text-muted-foreground underline underline-offset-4"
          onClick={() => switchMethod(method === "phone" ? "email" : "phone")}
        >
          {method === "phone" ? "Don't have a phone number?" : "Use a phone number instead"}
        </button>
      </form>
    );
  }

  const canVerify = isDevBypass ? code === "0000" : code.length === 6;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!isPending && canVerify) handleVerify();
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Enter the 6-digit code</Label>
        <div className="relative">
          <KeyRoundIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder={isDevBypass ? "0000" : "123456"}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="h-12 pl-10 text-base tracking-[0.3em]"
            autoFocus
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Sent to {identifier}
          {method === "email" ? ", check your inbox (and spam folder)" : ""}
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="h-12 text-base" disabled={isPending || !canVerify}>
        {isPending ? "Verifying..." : "Verify & continue"}
      </Button>
      <button
        type="button"
        className="text-sm text-muted-foreground underline underline-offset-4"
        onClick={() => {
          setStep("identifier");
          setCode("");
          setError(null);
        }}
      >
        Use a different {method === "phone" ? "number" : "email"}
      </button>
    </form>
  );
}
