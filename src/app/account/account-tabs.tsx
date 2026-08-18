"use client";

import { useState } from "react";
import { storeLogoUrl } from "@/lib/logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BookingRow, type AccountBooking } from "./booking-row";
import { FavoriteRow } from "./favorite-row";
import { markBookingsSeenAction } from "./actions";

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
}: {
  upcoming: AccountBooking[];
  past: AccountBooking[];
  favorites: FavoriteEntry[];
}) {
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

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
      defaultValue="upcoming"
      onValueChange={(value) => {
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
    </Tabs>
  );
}
