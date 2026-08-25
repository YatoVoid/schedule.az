"use client";

import Link from "next/link";
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
}: {
  identifier: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  fallbackInitial: string;
  memberships: UserMembership[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
        <AvatarUploader size="md" initialAvatarUrl={avatarUrl} fallbackInitial={fallbackInitial} />
        <div className="flex flex-col gap-1">
          <ProfileName initialName={name} identifier={identifier} />
          <ProfileUsername initialUsername={username} />
        </div>
      </div>

      {memberships.length > 0 ? (
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-2 text-sm font-medium">Your businesses</p>
          <div className="flex flex-col gap-2">
            {memberships.map((m) => (
              <Link
                key={m.storeSlug}
                href={m.href}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted"
              >
                <span>{m.storeName}</span>
                <span className="text-xs text-muted-foreground">{m.role === "ADMIN" ? "Owner" : "Staff"}</span>
              </Link>
            ))}
          </div>
          <Link
            href="/onboarding"
            className="mt-3 inline-block text-sm font-medium text-primary underline underline-offset-4"
          >
            Add another business
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-medium">Run a business in Baku?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            List it on Schedule.az and take real bookings instead of managing them over WhatsApp.
          </p>
          <Button render={<Link href="/onboarding" />} nativeButton={false} size="sm" className="mt-3">
            List your business
          </Button>
        </div>
      )}

      <form action={logoutAction}>
        <Button type="submit" variant="outline" className="w-full">
          Log out
        </Button>
      </form>
    </div>
  );
}
