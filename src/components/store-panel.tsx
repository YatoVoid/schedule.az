"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { categoryGuardVar } from "@/lib/category-color";
import { useSwipeIndex } from "@/components/image-carousel";

const CYCLE_MS = 3200;
const CLICK_SUPPRESS_PX = 8;

export function StorePanel({
  store,
}: {
  store: {
    id: string;
    slug: string;
    name: string;
    category: string;
    address: string | null;
    logoUrl: string | null;
    images: string[];
  };
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
      className="group/panel flex flex-col overflow-hidden rounded-md border bg-card transition-transform hover:-translate-y-0.5"
      style={{ borderColor: guard, borderWidth: 2 }}
    >
      <div
        className="relative aspect-4/3 w-full touch-pan-y overflow-hidden bg-muted select-none"
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
      >
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
            <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
              {store.images.map((src, i) => (
                <span
                  key={src}
                  className="h-1 w-1 rounded-full transition-colors"
                  style={{ background: i === active ? guard : "color-mix(in oklch, white 55%, transparent)" }}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Avatar className="h-16 w-16">
              {store.logoUrl && <AvatarImage src={store.logoUrl} alt="" />}
              <AvatarFallback className="text-lg" style={{ background: guard, color: "var(--primary-foreground)" }}>
                {store.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5 p-3">
        <p className="font-heading text-sm font-medium leading-snug">{store.name}</p>
        <span
          className="w-fit max-w-full truncate rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
          style={{ background: `color-mix(in oklch, ${guard} 16%, var(--card))`, color: guard }}
        >
          {store.category}
        </span>
        <p className="truncate text-xs text-muted-foreground">{store.address ?? "Baku"}</p>
      </div>
    </Link>
  );
}
