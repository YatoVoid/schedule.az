"use client";

import { useState, useTransition } from "react";
import { HeartIcon } from "lucide-react";
import { toast } from "sonner";
import { toggleFavoriteAction } from "@/app/[slug]/actions";

export function FavoriteHeartButton({
  storeId,
  initialFavorited,
  isLoggedIn,
  className,
}: {
  storeId: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
  className?: string;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      toast("Log in while booking to save favorites");
      return;
    }
    startTransition(async () => {
      const result = await toggleFavoriteAction(storeId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setFavorited(result.favorited ?? false);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      className={`flex size-7 items-center justify-center rounded-full bg-card/90 text-foreground transition-colors hover:bg-card disabled:opacity-50 ${className ?? ""}`}
    >
      <HeartIcon className="size-4" fill={favorited ? "var(--primary)" : "none"} stroke="var(--primary)" />
    </button>
  );
}
