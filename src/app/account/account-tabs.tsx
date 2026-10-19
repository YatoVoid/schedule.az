"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, CalendarDaysIcon, HeartIcon, HistoryIcon, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  attendedCount,
  profile,
}: {
  attendedCount: number;
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
      <TabsList variant="line" className="mb-6 h-auto! w-full justify-start gap-6 rounded-none border-b p-0">
        <TabsTrigger value="upcoming" className={TAB_CLASS}>
          Upcoming
          {upcomingUnseenCount > 0 && <Badge className="h-4 min-w-4 px-1 text-[10px]">{upcomingUnseenCount}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="favorites" className={TAB_CLASS}>
          Favorites
        </TabsTrigger>
        <TabsTrigger value="past" className={TAB_CLASS}>
          Past
          {pastUnseenCount > 0 && <Badge className="h-4 min-w-4 px-1 text-[10px]">{pastUnseenCount}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="profile" className={TAB_CLASS}>
          Profile
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="flex flex-col gap-3">
        {upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarDaysIcon}
            eyebrow="Your calendar is clear"
            title="No upcoming bookings."
            body="When you book a service, it shows up here with the time, the place and who you're seeing."
            cta
          />
        ) : (
          <>
            <ListHeading label="Upcoming bookings" count={upcoming.length} noun="booking" />
            {withLocalSeen(upcoming).map((b) => <BookingRow key={b.id} booking={b} canManage />)}
          </>
        )}
      </TabsContent>

      <TabsContent value="favorites" className="flex flex-col gap-3">
        {favorites.length === 0 ? (
          <EmptyState
            icon={HeartIcon}
            eyebrow="Nothing saved yet"
            title="No favorites yet."
            body="Tap the heart on a business to keep it here for next time."
            cta
          />
        ) : (
          <>
            <ListHeading label="Saved places" count={favorites.length} noun="place" />
            {favorites.map((f) => (
              <FavoriteRow
                key={f.storeId}
                storeId={f.storeId}
                slug={f.slug}
                name={f.name}
                category={f.category}
                logoUrl={storeLogoUrl(f.storeId, f.logoUpdatedAt)}
              />
            ))}
          </>
        )}
      </TabsContent>

      <TabsContent value="past" className="flex flex-col gap-3">
        {past.length === 0 ? (
          <EmptyState
            icon={HistoryIcon}
            eyebrow="No history yet"
            title="No past bookings."
            body="Finished, cancelled and declined bookings are kept here."
          />
        ) : (
          <>
            <ListHeading label="Past bookings" count={past.length} noun="booking" />
            {withLocalSeen(past).map((b) => <BookingRow key={b.id} booking={b} canManage={false} />)}
          </>
        )}
      </TabsContent>

      <TabsContent value="profile">
        <ProfileTab
          {...profile}
          stats={{ upcoming: upcoming.length, attended: attendedCount, favorites: favorites.length }}
        />
      </TabsContent>
    </Tabs>
  );
}

const TAB_CLASS =
  "h-auto flex-none rounded-none px-0 pb-3 text-[15px] font-normal text-muted-foreground data-active:font-medium data-active:text-foreground after:bottom-[-1px]! after:h-[3px]! after:rounded-full after:bg-primary!";

function ListHeading({ label, count, noun }: { label: string; count: number; noun: string }) {
  return (
    <div className="flex items-baseline justify-between px-1">
      <p className="eyebrow text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">
        {count} {count === 1 ? noun : `${noun}s`}
      </p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  eyebrow,
  title,
  body,
  cta,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
  cta?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <span className="mb-2 flex size-16 items-center justify-center rounded-full bg-sage">
        <Icon className="size-6 text-primary" />
      </span>
      <p className="eyebrow text-muted-foreground">{eyebrow}</p>
      <p className="font-heading text-2xl font-medium tracking-tight">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
      {cta && (
        <Button render={<Link href="/#discover" />} nativeButton={false} className="mt-3 h-10 gap-2 px-5">
          Explore businesses
          <ArrowRightIcon className="size-4" />
        </Button>
      )}
    </div>
  );
}
