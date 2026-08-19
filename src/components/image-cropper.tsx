"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Every gallery photo ships at the same fixed size so the homepage carousel
// and the store detail gallery never show mismatched crops between photos.
export const CROP_OUTPUT_WIDTH = 1200;
export const CROP_OUTPUT_HEIGHT = 900; // 4:3, matches store-panel's aspect-4/3

const FRAME_ASPECT = CROP_OUTPUT_WIDTH / CROP_OUTPUT_HEIGHT;
const MAX_ZOOM = 3;

export function ImageCropper({
  file,
  queuePosition,
  queueTotal,
  onCancel,
  onConfirm,
}: {
  file: File;
  queuePosition: number;
  queueTotal: number;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgElRef = useRef<HTMLImageElement>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: 0.5, y: 0.5 });
  const [frameSize, setFrameSize] = useState({ w: 320, h: 320 / FRAME_ASPECT });
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  // Deliberately not a useMemo: the object URL must be re-created (a fresh
  // blob: URL) every time this effect re-runs, including React StrictMode's
  // dev-only double-invoke of setup/cleanup — a memoized URL would get
  // revoked by that synthetic cleanup with no re-creation to replace it,
  // leaving the <img> pointed at a dead URL (naturalWidth 0, broken image).
  useEffect(() => {
    const url = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronizing with the browser's object-URL API, not deriving app state
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => setFrameSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function baseScale(frameW: number, frameH: number) {
    if (!natural.w || !natural.h) return 1;
    return Math.max(frameW / natural.w, frameH / natural.h);
  }

  function clampCenter(cx: number, cy: number, effScale: number, frameW: number, frameH: number) {
    if (!natural.w || !natural.h) return { x: 0.5, y: 0.5 };
    const visibleW = frameW / effScale;
    const visibleH = frameH / effScale;
    const halfFracX = Math.min(0.5, visibleW / natural.w / 2);
    const halfFracY = Math.min(0.5, visibleH / natural.h / 2);
    return {
      x: Math.min(1 - halfFracX, Math.max(halfFracX, cx)),
      y: Math.min(1 - halfFracY, Math.max(halfFracY, cy)),
    };
  }

  function handlePointerDown(e: React.PointerEvent) {
    dragRef.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current || !frameRef.current || !natural.w) return;
    const rect = frameRef.current.getBoundingClientRect();
    const eff = baseScale(rect.width, rect.height) * zoom;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    setCenter((c) =>
      clampCenter(c.x - dx / eff / natural.w, c.y - dy / eff / natural.h, eff, rect.width, rect.height),
    );
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleZoomChange(next: number) {
    setZoom(next);
    if (!frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const eff = baseScale(rect.width, rect.height) * next;
    setCenter((c) => clampCenter(c.x, c.y, eff, rect.width, rect.height));
  }

  function handleConfirm() {
    if (!natural.w || !natural.h || !imgElRef.current) return;
    const rect = frameRef.current!.getBoundingClientRect();
    const eff = baseScale(rect.width, rect.height) * zoom;
    const visibleW = rect.width / eff;
    const visibleH = rect.height / eff;
    const sx = Math.max(0, Math.min(natural.w - visibleW, center.x * natural.w - visibleW / 2));
    const sy = Math.max(0, Math.min(natural.h - visibleH, center.y * natural.h - visibleH / 2));

    const canvas = document.createElement("canvas");
    canvas.width = CROP_OUTPUT_WIDTH;
    canvas.height = CROP_OUTPUT_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(imgElRef.current, sx, sy, visibleW, visibleH, 0, 0, CROP_OUTPUT_WIDTH, CROP_OUTPUT_HEIGHT);
    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      "image/jpeg",
      0.9,
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Position photo {queuePosition} of {queueTotal}
          </DialogTitle>
        </DialogHeader>

        <div
          ref={frameRef}
          className="relative w-full touch-none select-none overflow-hidden rounded-md border bg-muted"
          style={{ aspectRatio: FRAME_ASPECT }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Crop source, not the final asset — the canvas export is. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {imgUrl && <img
            ref={imgElRef}
            src={imgUrl}
            alt=""
            draggable={false}
            onLoad={(e) => {
              const el = e.currentTarget;
              setNatural({ w: el.naturalWidth, h: el.naturalHeight });
            }}
            className="pointer-events-none absolute max-w-none"
            style={
              natural.w
                ? (() => {
                    const eff = baseScale(frameSize.w, frameSize.h) * zoom;
                    const dispW = natural.w * eff;
                    const dispH = natural.h * eff;
                    const left = frameSize.w / 2 - center.x * dispW;
                    const top = frameSize.h / 2 - center.y * dispH;
                    return { width: dispW, height: dispH, left, top };
                  })()
                : undefined
            }
          />}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Zoom</span>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
        </div>
        <p className="text-xs text-muted-foreground">Drag the photo to reposition it.</p>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Skip
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Use this photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
