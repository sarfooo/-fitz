"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface ScrollReelProps {
  children: ReactNode;
  className?: string;
  trackClassName?: string;
  ariaLabel?: string;
}

export function ScrollReel({
  children,
  className = "",
  trackClassName = "",
  ariaLabel = "scrollable items",
}: ScrollReelProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{ startX: number; startScroll: number; dragging: boolean }>({
    startX: 0,
    startScroll: 0,
    dragging: false,
  });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const refreshEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const { scrollLeft, scrollWidth, clientWidth } = track;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    refreshEdges();
    const observer = new ResizeObserver(refreshEdges);
    observer.observe(track);
    track.addEventListener("scroll", refreshEdges, { passive: true });
    return () => {
      observer.disconnect();
      track.removeEventListener("scroll", refreshEdges);
    };
  }, [refreshEdges, children]);

  const scrollByAmount = useCallback((direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const delta = Math.max(track.clientWidth * 0.8, 240) * direction;
    track.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const track = trackRef.current;
    if (!track) return;
    dragState.current = {
      startX: event.clientX,
      startScroll: track.scrollLeft,
      dragging: true,
    };
    track.setPointerCapture(event.pointerId);
    track.style.cursor = "grabbing";
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const state = dragState.current;
    const track = trackRef.current;
    if (!state.dragging || !track) return;
    track.scrollLeft = state.startScroll - (event.clientX - state.startX);
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    const state = dragState.current;
    const track = trackRef.current;
    if (!state.dragging) return;
    state.dragging = false;
    if (track) {
      track.releasePointerCapture(event.pointerId);
      track.style.cursor = "";
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={trackRef}
        role="region"
        aria-label={ariaLabel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        className={`flex overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${trackClassName}`}
        style={{ touchAction: "pan-y" }}
      >
        {children}
      </div>

      {canScrollLeft ? (
        <button
          type="button"
          aria-label="scroll left"
          onClick={() => scrollByAmount(-1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur hover:bg-black/80"
        >
          <ChevronLeft size={18} />
        </button>
      ) : null}

      {canScrollRight ? (
        <button
          type="button"
          aria-label="scroll right"
          onClick={() => scrollByAmount(1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur hover:bg-black/80"
        >
          <ChevronRight size={18} />
        </button>
      ) : null}
    </div>
  );
}
