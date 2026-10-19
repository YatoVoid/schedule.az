"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { removeFavoriteAction } from "./actions";

export function FavoriteRow({
  storeId,
  slug,
  name,
  category,
  logoUrl,
}: {
  storeId: string;
  slug: string;
  name: string;
  category: string;
  logoUrl: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      const result = await removeFavoriteAction(storeId);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <div className="surface flex items-center gap-3 p-4">
      <Link href={`/${slug}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="size-11">
          {logoUrl && <AvatarImage src={logoUrl} alt="" />}
          <AvatarFallback className="bg-sage-soft font-semibold text-primary">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{name}</p>
          <p className="text-sm text-muted-foreground">{category}</p>
        </div>
      </Link>
      <Button variant="ghost" size="sm" onClick={handleRemove} disabled={isPending}>
        Remove
      </Button>
    </div>
  );
}
