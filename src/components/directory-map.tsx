"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, MapPinIcon, StarIcon } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { categoryGuardVar } from "@/lib/category-color";

const BAKU_CENTER: [number, number] = [40.4093, 49.8671];

export type MapStore = {
  id: string;
  slug: string;
  name: string;
  category: string;
  address: string | null;
  description: string | null;
  images: string[];
  rating: { average: number; count: number } | null;
  services: { name: string; priceAzn: string | null }[];
  index: number;
  latitude: number;
  longitude: number;
};

// The popup's own carousel, separate from the directory card's — Leaflet
// popup content isn't part of the normal React tree lifecycle in the same
// way, so this stays a small self-contained piece of state per marker.
function PopupImages({ images, guard, name }: { images: string[]; guard: string; name: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div
        className="flex h-32 w-full items-center justify-center text-lg font-medium text-primary-foreground"
        style={{ background: guard }}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <div className="relative h-32 w-full overflow-hidden bg-muted">
      {images.map((src, i) => (
        // Real business photo, not a design asset.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-200"
          style={{ opacity: i === active ? 1 : 0 }}
        />
      ))}
      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActive((active - 1 + images.length) % images.length);
            }}
            className="absolute top-1/2 left-1 z-[1] flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-foreground"
          >
            <ChevronLeftIcon className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActive((active + 1) % images.length);
            }}
            className="absolute top-1/2 right-1 z-[1] flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-foreground"
          >
            <ChevronRightIcon className="size-3.5" />
          </button>
          <div className="absolute inset-x-0 bottom-1 z-[1] flex justify-center gap-1">
            {images.map((src, i) => (
              <span
                key={src}
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: i === active ? guard : "color-mix(in oklch, white 55%, transparent)" }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function pinIcon(color: string, index: number, active: boolean): L.DivIcon {
  const size = active ? 34 : 28;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:9999px;
      background:${color};color:var(--primary-foreground);
      display:flex;align-items:center;justify-content:center;
      font:600 ${active ? 13 : 11}px var(--font-body, sans-serif);
      border:2px solid var(--card);
      transition:width .15s,height .15s;
    ">${index}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FitBounds({ stores }: { stores: MapStore[] }) {
  const map = useMap();
  const key = stores.map((s) => s.id).join(",");
  useEffect(() => {
    if (stores.length === 0) return;
    if (stores.length === 1) {
      map.setView([stores[0].latitude, stores[0].longitude], 14);
      return;
    }
    const bounds = L.latLngBounds(stores.map((s) => [s.latitude, s.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [32, 32] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

function cheapestPrice(services: { priceAzn: string | null }[]): string | null {
  const priced = services.map((s) => (s.priceAzn ? Number(s.priceAzn) : null)).filter((n): n is number => n !== null);
  if (priced.length === 0) return null;
  return Math.min(...priced).toString();
}

export function DirectoryMap({
  stores,
  activeId,
  onHoverChange,
}: {
  stores: MapStore[];
  activeId: string | null;
  onHoverChange?: (id: string | null) => void;
}) {
  return (
    <MapContainer
      center={BAKU_CENTER}
      zoom={12}
      scrollWheelZoom
      className="h-full w-full rounded-md"
      style={{ background: "var(--muted)" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds stores={stores} />
      {stores.map((s) => {
        const guard = categoryGuardVar(s.category);
        const fromPrice = cheapestPrice(s.services);
        return (
          <Marker
            key={s.id}
            position={[s.latitude, s.longitude]}
            icon={pinIcon(guard, s.index, s.id === activeId)}
            eventHandlers={{
              mouseover: () => onHoverChange?.(s.id),
              mouseout: () => onHoverChange?.(null),
            }}
          >
            <Popup className="schedule-map-popup" minWidth={260} maxWidth={280}>
              <div className="flex w-64 flex-col overflow-hidden rounded-lg">
                <div className="relative">
                  <PopupImages images={s.images} guard={guard} name={s.name} />
                  <span
                    className="absolute top-2 left-2 z-[1] flex size-6 items-center justify-center rounded-full text-xs font-medium text-primary-foreground"
                    style={{ background: guard }}
                  >
                    {s.index}
                  </span>
                </div>

                <div className="flex flex-col gap-2 bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-heading text-sm font-medium leading-snug">{s.name}</p>
                    {fromPrice && (
                      <span className="shrink-0 rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-secondary-foreground">
                        from {fromPrice} AZN
                      </span>
                    )}
                  </div>

                  {s.rating && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <StarIcon className="size-3 text-primary" fill="currentColor" />
                      <span className="font-medium text-foreground">{s.rating.average.toFixed(1)}</span>
                      <span>({s.rating.count})</span>
                    </span>
                  )}

                  {s.description && <p className="line-clamp-2 text-xs text-muted-foreground">{s.description}</p>}

                  <span
                    className="w-fit rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                    style={{ background: `color-mix(in oklch, ${guard} 16%, var(--card))`, color: guard }}
                  >
                    {s.category}
                  </span>

                  {s.address && (
                    <p className="flex items-start gap-1 text-xs text-muted-foreground">
                      <MapPinIcon className="mt-0.5 size-3 shrink-0" />
                      <span>{s.address}</span>
                    </p>
                  )}

                  {s.services.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {s.services.slice(0, 2).map((svc) => (
                        <span key={svc.name} className="rounded-sm bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                          {svc.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <Link
                    href={`/${s.slug}`}
                    className="schedule-map-popup-cta mt-1 flex items-center justify-between rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Open business page
                    <ArrowRightIcon className="size-3.5" />
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
