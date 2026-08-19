"use client";

import { useRef, useState } from "react";

const SWIPE_THRESHOLD_PX = 40;

// Shared drag/swipe gesture for both the homepage panel's small carousel and
// the store detail page's larger gallery: pointer events cover mouse drag
// and touch swipe in one handler, no separate mobile/desktop code paths.
export function useSwipeIndex(length: number) {
  const [active, setActiveState] = useState(0);
  const dragStartX = useRef<number | null>(null);
  const dragDeltaX = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);

  function clamp(i: number) {
    return length === 0 ? 0 : ((i % length) + length) % length;
  }

  function setActive(i: number) {
    setActiveState(clamp(i));
  }

  function onPointerDown(e: React.PointerEvent) {
    if (length < 2) return;
    dragStartX.current = e.clientX;
    dragDeltaX.current = 0;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (dragStartX.current === null) return;
    dragDeltaX.current = e.clientX - dragStartX.current;
    setDragOffset(dragDeltaX.current);
  }

  function endDrag() {
    if (dragStartX.current === null) return;
    const delta = dragDeltaX.current;
    if (delta <= -SWIPE_THRESHOLD_PX) setActiveState((i) => clamp(i + 1));
    else if (delta >= SWIPE_THRESHOLD_PX) setActiveState((i) => clamp(i - 1));
    dragStartX.current = null;
    dragDeltaX.current = 0;
    setDragOffset(0);
  }

  return {
    active,
    setActive,
    dragOffset,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onPointerLeave: endDrag,
    },
  };
}
