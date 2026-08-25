"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

// Single-purpose gated screens (/login, /onboarding) sit outside
// MobileTabBar's routes (HIDDEN_PREFIXES), so the bottom tab bar disappears
// on them — the only way back for a mobile user is whatever this renders.
// router.back() returns to whichever page actually sent them here (the
// directory, a store page, /account); window.history.length falls back to
// home only when there's nothing to go back to (e.g. the URL opened
// directly). The negative margin keeps a real ~44px tap target without
// pushing the visible label away from the edge it reads as anchored to.
export function BackLink({ label = "Continue browsing" }: { label?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push("/");
        }
      }}
      className="-m-2 mb-4 flex items-center gap-1.5 rounded-md p-2 text-sm text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <ArrowLeftIcon className="size-4" />
      {label}
    </button>
  );
}
