"use client";

import { useState } from "react";
import { storeLogoUrl } from "@/lib/logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BookingRow, type AccountBooking } from "./booking-row";
import { FavoriteRow } from "./favorite-row";
import { ProfileTab } from "./profile-tab";
import { markBookingsSeenAction } from "./actions";
import type { UserMembership } from "@/lib/auth";

type FavoriteEntry = {
  storeId: string;
  slug: string;
  name: string;
  category: string;
  logoUpdatedAt: string | null;
};

export function AccountTabs({
  upcoming,
  past,
  favorites,
  initialTab = "upcoming",
  profile,
}: {
  upcoming: AccountBooking[];
  past: AccountBooking[];
  favorites: FavoriteEntry[];
  initialTab?: "upcoming" | "favorites" | "past" | "profile";
  profile: {
    identifier: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
    fallbackInitial: string;
    memberships: UserMembership[];
  };
}) {
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  // The bottom tab bar links to /account?tab=... which is a soft navigation:
  // this component stays mounted and just receives a new `initialTab` prop
  // rather than remounting, so Tabs has to be controlled (Base UI warns if
  // an uncontrolled Tabs' defaultValue changes after mount instead of
  // actually switching). Adjusting state during render (rather than in an
  // effect) is the documented React pattern for state that should reset
  // when a prop changes, and avoids the extra commit a setState-in-effect
  // would cause.
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);
  const [activeTab, setActiveTab] = useState(initialTab);
  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab);
    setActiveTab(initialTab);
  }

  const upcomingUnseenCount = upcoming.filter((b) => b.unseen && !seenIds.has(b.id)).length;
  const pastUnseenCount = past.filter((b) => b.unseen && !seenIds.has(b.id)).length;

  function markTabSeen(rows: AccountBooking[]) {
    const ids = rows.filter((b) => b.unseen && !seenIds.has(b.id)).map((b) => b.id);
    if (ids.length === 0) return;
    setSeenIds((prev) => new Set([...prev, ...ids]));
    markBookingsSeenAction(ids);
  }

  function withLocalSeen(rows: AccountBooking[]): AccountBooking[] {
    return rows.map((b) => (seenIds.has(b.id) ? { ...b, unseen: false } : b));
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        setActiveTab(value as typeof activeTab);
        if (value === "upcoming") markTabSeen(upcoming);
        if (value === "past") markTabSeen(past);
      }}
    >
      <TabsList className="mb-4">
        <TabsTrigger value="upcoming" className="gap-1.5">
          Upcoming
          {upcomingUnseenCount > 0 && <Badge className="h-4 min-w-4 px-1 text-[10px]">{upcomingUnseenCount}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="favorites">Favorites</TabsTrigger>
        <TabsTrigger value="past" className="gap-1.5">
          Past
          {pastUnseenCount > 0 && <Badge className="h-4 min-w-4 px-1 text-[10px]">{pastUnseenCount}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="profile">Profile</TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="flex flex-col gap-3">
        {upcoming.length === 0 ? (
          <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No upcoming bookings. Find a business on the homepage to book one.
          </p>
        ) : (
          withLocalSeen(upcoming).map((b) => <BookingRow key={b.id} booking={b} canManage />)
        )}
      </TabsContent>

      <TabsContent value="favorites" className="flex flex-col gap-3">
        {favorites.length === 0 ? (
          <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No favorites yet, tap the star on a business page to save it here.
          </p>
        ) : (
          favorites.map((f) => (
            <FavoriteRow
              key={f.storeId}
              storeId={f.storeId}
              slug={f.slug}
              name={f.name}
              category={f.category}
              logoUrl={storeLogoUrl(f.storeId, f.logoUpdatedAt)}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="past" className="flex flex-col gap-3">
        {past.length === 0 ? (
          <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No past bookings yet.
          </p>
        ) : (
          withLocalSeen(past).map((b) => <BookingRow key={b.id} booking={b} canManage={false} />)
        )}
      </TabsContent>

      <TabsContent value="profile">
        <ProfileTab {...profile} />
      </TabsContent>
    </Tabs>
  );
}
