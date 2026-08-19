"use client";

import { useSwipeIndex } from "@/components/image-carousel";

export function StoreGallery({ images, guard }: { images: string[]; guard: string }) {
  const { active, setActive, handlers } = useSwipeIndex(images.length);

  if (images.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div
        className="relative aspect-4/3 w-full touch-pan-y select-none overflow-hidden rounded-md border"
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
      </div>
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Show photo ${i + 1}`}
              onClick={() => setActive(i)}
              className="h-1.5 w-1.5 rounded-full transition-colors"
              style={{ background: i === active ? guard : "var(--border)" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
