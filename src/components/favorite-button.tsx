"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleFavoriteAction } from "@/app/[slug]/actions";

export function FavoriteButton({
  storeId,
  initialFavorited,
  isLoggedIn,
}: {
  storeId: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
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
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
      {favorited ? "★ Favorited" : "☆ Favorite"}
    </Button>
  );
}
