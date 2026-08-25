"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useSwipeIndex } from "@/components/image-carousel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const GRID_TILE_COUNT = 4;

export function StoreGallery({ images, guard }: { images: string[]; guard: string }) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const { active, setActive, handlers } = useSwipeIndex(images.length);

  if (images.length === 0) return null;

  const gridTiles = images.slice(1, 1 + GRID_TILE_COUNT);
  const overflowCount = images.length - 1 - GRID_TILE_COUNT;

  return (
    <>
      {/* Mobile: single swipeable frame, matches the directory card's carousel. */}
      <div className="sm:hidden">
        <Carousel images={images} guard={guard} active={active} setActive={setActive} handlers={handlers} />
      </div>

      {/* sm+: one large photo beside a 2x2 grid, richer than the mobile carousel
          since there's room for it. Every tile opens the same full gallery. */}
      {images.length > 1 ? (
        <div className="hidden gap-2 sm:grid sm:grid-cols-2 sm:grid-rows-2">
          <button
            type="button"
            onClick={() => {
              setActive(0);
              setGalleryOpen(true);
            }}
            className="col-span-1 row-span-2 overflow-hidden rounded-md border"
            style={{ borderColor: guard, borderWidth: 2 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[0]} alt="" className="h-full w-full object-cover" />
          </button>
          <div className="col-span-1 row-span-2 grid grid-cols-2 grid-rows-2 gap-2">
            {gridTiles.map((src, i) => {
              const isLastVisible = i === gridTiles.length - 1 && overflowCount > 0;
              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => {
                    setActive(i + 1);
                    setGalleryOpen(true);
                  }}
                  className="relative overflow-hidden rounded-md border"
                  style={{ borderColor: guard, borderWidth: 2 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  {isLastVisible && (
                    <span className="absolute inset-0 flex items-center justify-center bg-foreground/50 text-sm font-medium text-background">
                      See all photos
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="hidden sm:block">
          <button
            type="button"
            onClick={() => setGalleryOpen(true)}
            className="aspect-4/3 w-full overflow-hidden rounded-md border"
            style={{ borderColor: guard, borderWidth: 2 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[0]} alt="" className="h-full w-full object-cover" />
          </button>
        </div>
      )}

      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Photos</DialogTitle>
          </DialogHeader>
          <Carousel images={images} guard={guard} active={active} setActive={setActive} handlers={handlers} tall />
        </DialogContent>
      </Dialog>
    </>
  );
}

function Carousel({
  images,
  guard,
  active,
  setActive,
  handlers,
  tall,
}: {
  images: string[];
  guard: string;
  active: number;
  setActive: (i: number) => void;
  handlers: ReturnType<typeof useSwipeIndex>["handlers"];
  tall?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={`group/carousel relative ${tall ? "aspect-square" : "aspect-4/3"} w-full touch-pan-y select-none overflow-hidden rounded-md border ${images.length > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
        style={{ borderColor: guard, borderWidth: 2 }}
        {...handlers}
        tabIndex={0}
        role="group"
        aria-label="Store photos"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setActive(active + 1);
          if (e.key === "ArrowLeft") setActive(active - 1);
        }}
      >
        {images.map((src, i) => (
          // Real business photos, not a design asset.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-out"
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
                setActive(active - 1);
              }}
              className="absolute top-1/2 left-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-foreground opacity-70 transition-opacity hover:bg-card hover:opacity-100"
            >
              <ChevronLeftIcon className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActive(active + 1);
              }}
              className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-foreground opacity-70 transition-opacity hover:bg-card hover:opacity-100"
            >
              <ChevronRightIcon className="size-5" />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex justify-center">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Show photo ${i + 1}`}
              onClick={() => setActive(i)}
              className="flex size-6 items-center justify-center"
            >
              <span
                className="h-1.5 w-1.5 rounded-full transition-colors"
                style={{ background: i === active ? guard : "var(--border)" }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
