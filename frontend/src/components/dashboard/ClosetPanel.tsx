"use client";

import { Plus } from "lucide-react";

interface ClosetPanelProps {
  itemCount?: number;
  savedOutfits?: Array<{ id: string; name: string; count: number; previewUrl?: string }>;
}

export function ClosetPanel({
  itemCount = 12,
  savedOutfits = [
    { id: "1", name: "Y2K Grunge", count: 6 },
  ],
}: ClosetPanelProps) {
  return (
    <section className="y2k-window p-5 flex flex-col gap-5 h-full overflow-y-auto">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="neon-pink text-sm tracking-[0.3em] uppercase"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            My Closet
          </h2>
          <button
            type="button"
            className="text-[10px] tracking-[0.25em] text-white/60 hover:text-white"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            VIEW ALL
          </button>
        </div>
        <p
          className="text-[10px] tracking-[0.25em] text-white/50 uppercase mb-3"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {itemCount} items
        </p>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-gradient-to-br from-neutral-300 to-neutral-500 border border-[color:var(--color-fc-border)]"
            />
          ))}
        </div>
      </div>

      <div className="y2k-divider" />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3
            className="neon-pink text-sm tracking-[0.3em] uppercase"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Saved Outfits
          </h3>
          <button
            type="button"
            className="text-[10px] tracking-[0.25em] text-white/80 hover:text-white flex items-center gap-1"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <Plus size={10} /> NEW FIT
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {savedOutfits.map((o) => (
            <button
              type="button"
              key={o.id}
              className="liquid-glass rounded-lg p-2 text-left group"
            >
              <div className="aspect-[3/4] bg-gradient-to-b from-purple-950/40 to-black border border-[color:var(--color-fc-border)]" />
              <div className="p-2">
                <p className="text-sm font-semibold uppercase tracking-wide">{o.name}</p>
                <p className="text-[10px] text-white/50 tracking-widest uppercase">{o.count} items</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
