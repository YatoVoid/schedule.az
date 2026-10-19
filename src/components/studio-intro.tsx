import Link from "next/link";
import { ChevronLeftIcon, StoreIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function StudioIntro({
  storeName,
  roleLabel,
  logoUrl,
}: {
  storeName: string;
  roleLabel: string;
  logoUrl: string | null;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 sm:grid sm:grid-cols-3">
        <Link
          href="/"
          className="flex items-center gap-0.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ChevronLeftIcon className="size-4" />
          Browse Schedule.az
        </Link>
        <p className="flex items-center justify-center gap-2 text-xs font-semibold tracking-[0.2em] text-primary uppercase sm:text-sm">
          <StoreIcon className="size-4" />
          Business studio
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Avatar className="size-16 shrink-0 rounded-2xl after:rounded-2xl">
          {logoUrl && <AvatarImage src={logoUrl} alt="" className="rounded-2xl" />}
          <AvatarFallback className="rounded-2xl bg-primary text-base font-semibold text-primary-foreground">
            {storeName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="truncate font-heading text-2xl font-medium tracking-tight sm:text-3xl">{storeName}</h1>
          <p className="text-muted-foreground">{roleLabel}</p>
        </div>
      </div>
    </div>
  );
}
