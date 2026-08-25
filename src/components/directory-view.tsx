"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StorePanel, type StoreListService } from "@/components/store-panel";

const DirectoryMap = dynamic(() => import("@/components/directory-map").then((m) => m.DirectoryMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-md bg-muted" />,
});

export type DirectoryStore = {
  id: string;
  slug: string;
  name: string;
  category: string;
  address: string | null;
  phone: string | null;
  description: string | null;
  logoUrl: string | null;
  images: string[];
  distanceKm?: number | null;
  rating: { average: number; count: number } | null;
  hasDuplicateName: boolean;
  services: StoreListService[];
  isFavorited: boolean;
  latitude: number | null;
  longitude: number | null;
};

export function DirectoryView({
  stores,
  isLoggedIn,
  emptyMessage,
}: {
  stores: DirectoryStore[];
  isLoggedIn: boolean;
  emptyMessage: string;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  const mapStores = stores
    .map((s, i) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      category: s.category,
      address: s.address,
      description: s.description,
      images: s.images.length > 0 ? s.images : s.logoUrl ? [s.logoUrl] : [],
      rating: s.rating,
      services: s.services,
      index: i + 1,
      latitude: s.latitude,
      longitude: s.longitude,
    }))
    .filter((s): s is typeof s & { latitude: number; longitude: number } => s.latitude != null && s.longitude != null);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_420px] lg:items-start">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between lg:hidden">
          <p className="text-sm text-muted-foreground">{stores.length} businesses</p>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setMapOpen(true)}>
            <MapIcon className="size-3.5" />
            Map view
          </Button>
        </div>
        {stores.length === 0 ? (
          <p className="rounded-md border p-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          stores.map((store, i) => (
            <StorePanel
              key={store.id}
              store={store}
              index={i + 1}
              isActive={hoveredId === store.id}
              isLoggedIn={isLoggedIn}
              onHoverChange={(hovered) => setHoveredId(hovered ? store.id : null)}
            />
          ))
        )}
      </div>

      <div className="sticky top-4 hidden h-[calc(100vh-2rem)] max-h-[720px] overflow-hidden rounded-md border lg:block">
        <DirectoryMap stores={mapStores} activeId={hoveredId} onHoverChange={setHoveredId} />
      </div>

      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent
          className="flex h-[85vh] max-w-[calc(100%-1.5rem)] flex-col p-2 sm:max-w-[calc(100%-2rem)]"
          showCloseButton
        >
          <DialogHeader className="shrink-0 px-2 pt-1">
            <DialogTitle>Map view</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-hidden rounded-md border">
            {mapOpen && <DirectoryMap stores={mapStores} activeId={hoveredId} onHoverChange={setHoveredId} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
