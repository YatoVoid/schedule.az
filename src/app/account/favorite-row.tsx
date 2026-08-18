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
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <Link href={`/${slug}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar>
          {logoUrl && <AvatarImage src={logoUrl} alt="" />}
          <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">{category}</p>
        </div>
      </Link>
      <Button variant="ghost" size="sm" onClick={handleRemove} disabled={isPending}>
        Remove
      </Button>
    </div>
  );
}
