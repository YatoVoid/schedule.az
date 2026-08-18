"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    // Client-only value: window isn't available during SSR, so this has to
    // be set post-mount to avoid a hydration mismatch, the standard pattern
    // for this, not something to compute inline during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  const url = `${origin}${path}`;

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border bg-card p-3">
      <p className="min-w-0 flex-1 truncate font-mono text-sm text-muted-foreground">{url || path}</p>
      <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
