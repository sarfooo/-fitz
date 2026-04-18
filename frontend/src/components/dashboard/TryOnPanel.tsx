"use client";

import { Camera, Heart, PersonStanding, Shirt } from "lucide-react";
import { useState } from "react";

interface TryOnPanelProps {
  avatarUrl?: string;
}

export function TryOnPanel({ avatarUrl }: TryOnPanelProps) {
  const [fit, setFit] = useState(50);
  const [layering, setLayering] = useState(70);
  const [showOriginal, setShowOriginal] = useState(false);

  return (
    <section className="y2k-window p-5 flex flex-col gap-4 h-full overflow-hidden">
      <h2
        className="neon-pink text-sm tracking-[0.3em] uppercase"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Virtual Try-On
      </h2>

      <div className="flex-1 flex gap-5 overflow-hidden">
        <aside className="flex flex-col gap-5 pt-2 shrink-0">
          <ToolButton icon={<PersonStanding size={22} />} label="Body" />
          <ToolButton icon={<Shirt size={22} />} label="Closet" />
          <ToolButton icon={<Camera size={22} />} label="Screenshot" />
        </aside>

        <div className="flex-1 relative flex items-end justify-center overflow-hidden rounded-lg bg-black/60 border border-[color:var(--color-fc-border)]">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="your avatar" className="h-full w-auto object-contain" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-white/40 text-sm">
              No avatar yet — generate one from your photos.
            </div>
          )}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-64 h-10 rounded-full pointer-events-none"
               style={{
                 background:
                   "radial-gradient(ellipse, rgba(201,64,255,0.55) 0%, rgba(201,64,255,0) 70%)",
                 filter: "blur(6px)",
               }}
          />
        </div>

        <aside className="w-64 shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
          <ItemCard />
          <FitControls
            fit={fit}
            setFit={setFit}
            layering={layering}
            setLayering={setLayering}
          />
        </aside>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <span className="text-[10px] tracking-[0.2em] text-white/60 uppercase" style={{ fontFamily: "var(--font-mono)" }}>
          Show original
        </span>
        <button
          type="button"
          onClick={() => setShowOriginal((v) => !v)}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            showOriginal ? "bg-[color:var(--color-fc-hot)]" : "bg-[color:var(--color-fc-panel-raised)] border border-[color:var(--color-fc-border)]"
          }`}
          aria-pressed={showOriginal}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
              showOriginal ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>
    </section>
  );
}

function ToolButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors"
    >
      <span className="w-12 h-12 flex items-center justify-center border border-[color:var(--color-fc-border)] bg-[color:var(--color-fc-panel)] hover:border-[color:var(--color-fc-neon)]">
        {icon}
      </span>
      <span
        className="text-[10px] tracking-[0.2em] uppercase"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}
      </span>
    </button>
  );
}

function ItemCard() {
  return (
    <div className="liquid-glass rounded-lg p-4 flex flex-col gap-3">
      <p
        className="text-[10px] tracking-[0.25em] neon-pink uppercase"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Current item
      </p>
      <div>
        <p className="text-lg font-semibold">VETEMENTS</p>
        <p className="text-sm text-white/70">Star Knit Sweater</p>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/60">SIZE:</span>
        <select className="bg-black/60 border border-[color:var(--color-fc-border)] px-2 py-1">
          <option>L</option>
          <option>M</option>
          <option>S</option>
        </select>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/60">PRICE:</span>
        <span className="text-white">$280</span>
      </div>
      <button type="button" className="pill-btn w-full">
        Add to closet
      </button>
      <button
        type="button"
        className="pill-btn-ghost w-full gap-2"
      >
        <Heart size={12} /> Save to wishlist
      </button>
    </div>
  );
}

function FitControls({
  fit,
  setFit,
  layering,
  setLayering,
}: {
  fit: number;
  setFit: (n: number) => void;
  layering: number;
  setLayering: (n: number) => void;
}) {
  return (
    <div className="liquid-glass rounded-lg p-4 flex flex-col gap-4">
      <p
        className="text-[10px] tracking-[0.25em] neon-pink uppercase"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Fit controls
      </p>
      <SliderRow label="Oversized ▸ Fitted" value={fit} onChange={setFit} />
      <SliderRow label="Layering" value={layering} onChange={setLayering} />
      <div>
        <p
          className="text-[10px] tracking-[0.25em] text-white/60 uppercase mb-1"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Rotate
        </p>
        <p className="text-center text-xs neon-pink tracking-wider">&lt; drag to rotate &gt;</p>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span
        className="text-[10px] tracking-[0.25em] text-white/60 uppercase block mb-1"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[color:var(--color-fc-hot)]"
      />
    </label>
  );
}
