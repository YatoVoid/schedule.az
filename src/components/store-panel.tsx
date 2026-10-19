"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { StarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { categoryGuardVar } from "@/lib/category-color";
import { useSwipeIndex } from "@/components/image-carousel";
import { FavoriteHeartButton } from "@/components/favorite-heart-button";

const CYCLE_MS = 3200;
const CLICK_SUPPRESS_PX = 8;

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

// Address is the primary way a customer tells two same-named businesses
// apart, but it's optional — an owner might not have set one. Phone is the
// next-best real, honest signal (also optional). The store's slug is the
// only field guaranteed unique for every store, so it's the last-resort
// fallback rather than showing identical text on both duplicate cards.
function disambiguatorLine(store: { address: string | null; phone: string | null; slug: string; hasDuplicateName: boolean }): string {
  if (store.address) return store.address;
  if (!store.hasDuplicateName) return "Baku";
  if (store.phone) return store.phone;
  return `@${store.slug}`;
}

export type StoreListService = { id: string; name: string; durationMin: number; priceAzn: string | null };

export function StorePanel({
  store,
  index,
  isActive,
  isLoggedIn,
  onHoverChange,
}: {
  store: {
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
  };
  index: number;
  isActive?: boolean;
  isLoggedIn: boolean;
  onHoverChange?: (hovered: boolean) => void;
}) {
  const guard = categoryGuardVar(store.category);
  const showCarousel = store.images.length >= 2;
  const { active, setActive, dragOffset, handlers } = useSwipeIndex(store.images.length);
  const draggedRef = useRef(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (!showCarousel) return;
    const id = setInterval(() => {
      if (!pausedRef.current) setActive(active + 1);
    }, CYCLE_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCarousel, active]);

  return (
    <Link
      href={`/${store.slug}`}
      onClick={(e) => {
        if (draggedRef.current) {
          e.preventDefault();
          draggedRef.current = false;
        }
      }}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      className={`surface group/panel flex overflow-hidden transition-shadow hover:shadow-md ${isActive ? "ring-2 ring-primary/30" : ""}`}
    >
      <div
        className={`group/carousel relative aspect-square w-32 shrink-0 touch-pan-y overflow-hidden bg-muted select-none sm:w-44 ${showCarousel ? "cursor-grab active:cursor-grabbing" : ""}`}
        onPointerDown={(e) => {
          pausedRef.current = true;
          handlers.onPointerDown(e);
        }}
        onPointerMove={handlers.onPointerMove}
        onPointerUp={() => {
          if (Math.abs(dragOffset) > CLICK_SUPPRESS_PX) draggedRef.current = true;
          handlers.onPointerUp();
          pausedRef.current = false;
        }}
        onPointerCancel={() => {
          handlers.onPointerCancel();
          pausedRef.current = false;
        }}
        onPointerLeave={() => {
          handlers.onPointerLeave();
          pausedRef.current = false;
        }}
        onMouseEnter={() => {
          pausedRef.current = true;
        }}
        onMouseLeave={() => {
          pausedRef.current = false;
        }}
      >
        <span
          className="absolute top-2 left-2 z-10 flex size-6 items-center justify-center rounded-full text-xs font-medium text-primary-foreground"
          style={{ background: guard }}
        >
          {index}
        </span>
        <FavoriteHeartButton
          storeId={store.id}
          initialFavorited={store.isFavorited}
          isLoggedIn={isLoggedIn}
          className="absolute top-2 right-2 z-10"
        />
        {showCarousel ? (
          <>
            {store.images.map((src, i) => (
              // Real business photos, not a design asset.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt=""
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out"
                style={{ opacity: i === active ? 1 : 0 }}
              />
            ))}
            {/* Desktop affordance: dragging with a mouse isn't a pattern
                people reach for on their own, so hover-revealed arrows are
                the actual obvious control there — touch already has swipe. */}
            <button
              type="button"
              aria-label="Previous photo"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActive(active - 1);
              }}
              className="absolute top-1/2 left-1 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-foreground opacity-70 transition-opacity hover:bg-card hover:opacity-100"
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActive(active + 1);
              }}
              className="absolute top-1/2 right-1 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-foreground opacity-70 transition-opacity hover:bg-card hover:opacity-100"
            >
              <ChevronRightIcon className="size-4" />
            </button>
            <div className="absolute inset-x-0 bottom-1 z-10 flex justify-center">
              {store.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  aria-label={`Show photo ${i + 1}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActive(i);
                  }}
                  className="flex size-5 items-center justify-center"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full transition-colors"
                    style={{ background: i === active ? guard : "color-mix(in oklch, white 55%, transparent)" }}
                  />
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Avatar className="h-14 w-14">
              {store.logoUrl && <AvatarImage src={store.logoUrl} alt="" />}
              <AvatarFallback className="text-base" style={{ background: guard, color: "var(--primary-foreground)" }}>
                {store.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3 sm:px-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-heading text-base font-semibold leading-snug tracking-tight text-primary sm:text-lg">{store.name}</p>
          {store.rating && (
            <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <StarIcon className="size-3 text-coral" fill="currentColor" />
              <span className="font-medium text-foreground">{store.rating.average.toFixed(1)}</span>
              <span>({store.rating.count})</span>
            </span>
          )}
        </div>
        <span
          className="w-fit max-w-full truncate rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ background: `color-mix(in oklch, ${guard} 16%, var(--card))`, color: guard }}
        >
          {store.category}
        </span>
        <p
          className={`truncate text-xs ${store.hasDuplicateName ? "font-medium text-foreground" : "text-muted-foreground"} ${
            store.hasDuplicateName && !store.address && !store.phone ? "font-mono" : ""
          }`}
        >
          {disambiguatorLine(store)}
          {store.distanceKm != null && <span className="text-foreground"> · {formatDistance(store.distanceKm)}</span>}
        </p>
        {store.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{store.description}</p>
        )}
        {store.services.length > 0 && (
          <div className="mt-1 flex flex-col divide-y divide-border border-t">
            {store.services.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 py-1.5 text-xs">
                <span className="truncate font-medium">{s.name}</span>
                <span className="flex shrink-0 items-center gap-2 font-mono text-muted-foreground">
                  <span>{s.durationMin} min</span>
                  <span className="text-foreground">{s.priceAzn ? `${s.priceAzn} AZN` : "Ask"}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
