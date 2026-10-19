"use client";

import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { AvatarUploader } from "@/components/avatar-uploader";
import { Button } from "@/components/ui/button";
import { ProfileName } from "./profile-name";
import { ProfileUsername } from "./profile-username";
import { logoutAction } from "@/app/actions";
import type { UserMembership } from "@/lib/auth";

export function ProfileTab({
  identifier,
  name,
  username,
  avatarUrl,
  fallbackInitial,
  memberships,
  stats,
}: {
  identifier: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  fallbackInitial: string;
  memberships: UserMembership[];
  stats: { upcoming: number; attended: number; favorites: number };
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <section className="panel-sage flex flex-col gap-4 p-5 sm:p-6">
          <p className="eyebrow text-primary">Your profile</p>
          <div className="surface flex items-center gap-4 p-4">
            <AvatarUploader size="md" initialAvatarUrl={avatarUrl} fallbackInitial={fallbackInitial} />
            <div className="flex min-w-0 flex-col gap-1">
              <ProfileName initialName={name} identifier={identifier} />
              <ProfileUsername initialUsername={username} />
            </div>
          </div>
          <form action={logoutAction} className="mt-auto">
            <Button type="submit" className="h-9 rounded-full px-5">
              Log out
            </Button>
          </form>
        </section>

        <section className="panel-sage flex flex-col gap-4 p-5 sm:p-6">
          <p className="eyebrow text-primary">Your businesses</p>
          {memberships.length > 0 ? (
            <div className="surface flex flex-col gap-2 p-4">
              {memberships.map((m) => (
                <Link
                  key={m.storeSlug}
                  href={m.href}
                  className="flex items-center justify-between rounded-lg border bg-background/40 px-3 py-2.5 text-sm hover:bg-sage-soft"
                >
                  <span className="truncate">{m.storeName}</span>
                  <span className="text-xs text-muted-foreground">{m.role === "ADMIN" ? "Owner" : "Staff"}</span>
                </Link>
              ))}
              <Link
                href="/onboarding"
                className="mt-2 flex w-fit items-center gap-1.5 text-sm font-medium text-coral underline underline-offset-4"
              >
                <PlusIcon className="size-3.5" />
                Add another business
              </Link>
            </div>
          ) : (
            <div className="surface p-4">
              <p className="text-sm font-medium">Run a business in Baku?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                List it on Schedule.az and take real bookings instead of managing them over WhatsApp.
              </p>
              <Button render={<Link href="/onboarding" />} nativeButton={false} size="sm" className="mt-3">
                List your business
              </Button>
            </div>
          )}
        </section>
      </div>

      <dl className="grid grid-cols-3 gap-3 sm:gap-5">
        <Stat label="Upcoming" value={stats.upcoming} />
        <Stat label="Attended" value={stats.attended} />
        <Stat label="Favorites" value={stats.favorites} accent />
      </dl>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="surface flex flex-col-reverse items-center gap-1 px-2 py-4">
      <dt className="eyebrow text-muted-foreground">{label}</dt>
      <dd className={`font-serif text-4xl italic ${accent ? "text-coral" : "text-foreground"}`}>{value}</dd>
    </div>
  );
}
