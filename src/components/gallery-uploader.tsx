"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  deleteStoreImageAction,
  reorderStoreImagesAction,
  uploadStoreImageAction,
} from "@/app/admin/[slug]/settings/actions";
import { ImageCropper } from "@/components/image-cropper";

const MAX_IMAGES = 8;

export function GalleryUploader({
  slug,
  initialImages,
}: {
  slug: string;
  initialImages: { id: string; url: string }[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState(initialImages);
  const [isPending, startTransition] = useTransition();

  // Files picked in one dialog, in the order the OS picker returned them
  // (Selection order, per the request — not re-sorted by name or size).
  const [queue, setQueue] = useState<File[]>([]);
  const [queueTotal, setQueueTotal] = useState(0);

  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  // Confirmed crops upload one at a time, oldest first, so the server's
  // "position = current count" assignment (uploadStoreImageAction) can never
  // race between two blobs picked in the same batch.
  const uploadChainRef = useRef<Promise<void>>(Promise.resolve());

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length === 0) return;

    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`Up to ${MAX_IMAGES} photos per store`);
      return;
    }
    const accepted = picked.slice(0, room);
    if (picked.length > accepted.length) {
      toast.error(`Only added the first ${accepted.length} — ${MAX_IMAGES} photos max`);
    }
    setQueue(accepted);
    setQueueTotal(accepted.length);
  }

  function handleCropConfirm(blob: Blob) {
    uploadChainRef.current = uploadChainRef.current.then(
      () =>
        new Promise<void>((resolve) => {
          startTransition(async () => {
            const formData = new FormData();
            formData.append("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
            const result = await uploadStoreImageAction(slug, formData);
            if (!result.ok) {
              toast.error(result.error);
            } else {
              router.refresh();
            }
            resolve();
          });
        }),
    );
    setQueue((q) => q.slice(1));
  }

  function handleCropCancel() {
    setQueue((q) => q.slice(1));
  }

  function handleDelete(id: string) {
    setImages((prev) => prev.filter((img) => img.id !== id));
    startTransition(async () => {
      const result = await deleteStoreImageAction(slug, id);
      if (!result.ok) {
        toast.error(result.error);
        router.refresh();
        return;
      }
      router.refresh();
    });
  }

  function commitReorder(next: { id: string; url: string }[]) {
    setImages(next);
    startTransition(async () => {
      const result = await reorderStoreImagesAction(slug, next.map((img) => img.id));
      if (!result.ok) {
        toast.error(result.error);
        router.refresh();
      }
    });
  }

  function handleDrop(targetIndex: number) {
    const sourceIndex = dragIndexRef.current;
    dragIndexRef.current = null;
    setDragOverIndex(null);
    if (sourceIndex === null || sourceIndex === targetIndex) return;
    const next = [...images];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    commitReorder(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        These cycle on your directory card, in the order listed below. Drag a photo to reorder it. Add at
        least 2 for the carousel to show; with fewer, your logo shows instead. Every photo is cropped to the
        same {""}
        4:3 frame so cards line up cleanly.
      </p>

      <div className="flex max-h-100 flex-col gap-2 overflow-y-auto pr-1">
        {images.map((img, index) => (
          <div
            key={img.id}
            draggable
            onDragStart={() => {
              dragIndexRef.current = index;
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverIndex(index);
            }}
            onDragLeave={() => setDragOverIndex((i) => (i === index ? null : i))}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(index);
            }}
            onDragEnd={() => {
              dragIndexRef.current = null;
              setDragOverIndex(null);
            }}
            className="flex cursor-grab items-center gap-3 rounded-md border bg-card p-2 active:cursor-grabbing"
            style={{ borderColor: dragOverIndex === index ? "var(--primary)" : undefined, borderWidth: dragOverIndex === index ? 2 : 1 }}
          >
            <span className="shrink-0 text-muted-foreground" aria-hidden>
              ⠿
            </span>
            <div className="h-14 w-18 shrink-0 overflow-hidden rounded-sm border">
              {/* Store gallery photos, not a design asset. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </div>
            <span className="flex-1 text-sm text-muted-foreground">Photo {index + 1}</span>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleDelete(img.id)}
              className="shrink-0 rounded-sm px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {images.length < MAX_IMAGES && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => fileInputRef.current?.click()}
          className="flex h-12 items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground hover:bg-muted"
        >
          + Add photos
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {queue.length > 0 && (
        <ImageCropper
          key={queueTotal - queue.length}
          file={queue[0]}
          queuePosition={queueTotal - queue.length + 1}
          queueTotal={queueTotal}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}
