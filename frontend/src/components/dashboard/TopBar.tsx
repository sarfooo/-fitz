"use client";

import { Minus, Square, X } from "lucide-react";
import Image from "next/image";

export type TopBarView = "home" | "browse" | "closet" | "lookbook";

interface TopBarProps {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  active?: TopBarView;
  onNavigate?: (view: TopBarView) => void;
}

const NAV_ITEMS: Array<{ id: TopBarProps["active"]; label: string }> = [
  { id: "home", label: "HOME" },
  { id: "browse", label: "BROWSE" },
  { id: "closet", label: "CLOSET" },
  { id: "lookbook", label: "OUTFITS" },
];

export function TopBar({
  username,
  displayName,
  avatarUrl,
  active = "browse",
  onNavigate,
}: TopBarProps) {
  const primaryLabel = displayName?.trim() || username;

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-[color:var(--color-fc-border)] bg-black/70 backdrop-blur">
      <div className="flex items-baseline gap-4">
        <h1
          className="chrome-text text-5xl md:text-6xl font-black tracking-tighter leading-none"
          style={{ fontFamily: "var(--font-retro)" }}
        >
          FITZ
        </h1>
        <p
          className="text-[10px] md:text-xs tracking-[0.3em] text-[color:var(--color-fc-ice)]/60 uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Y2K Virtual Try-On
        </p>
      </div>

      <nav className="hidden md:flex items-center gap-6">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => item.id && onNavigate?.(item.id)}
              className={`text-sm tracking-[0.25em] font-semibold transition-colors ${
                isActive
                  ? "neon-pink px-3 py-1 border border-[color:var(--color-fc-hot)] rounded"
                  : "text-white/80 hover:text-white"
              }`}
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {isActive ? `[ ${item.label} ]` : item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <div className="hidden sm:block text-right leading-tight">
          <p className="text-[10px] uppercase tracking-widest text-white/50">welcome back,</p>
          <p className="text-sm font-semibold neon-pink">{primaryLabel}</p>
        </div>
        <div className="w-10 h-10 rounded border border-[color:var(--color-fc-neon)]/60 overflow-hidden">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              width={40}
              height={40}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[color:var(--color-fc-panel)]" />
          )}
        </div>
        <div className="hidden lg:flex items-center gap-1 ml-2">
          <WindowButton icon={<Minus size={12} />} />
          <WindowButton icon={<Square size={10} />} />
          <WindowButton icon={<X size={12} />} />
        </div>
      </div>
    </header>
  );
}

function WindowButton({ icon }: { icon: React.ReactNode }) {
  return (
    <button
      type="button"
      className="w-6 h-6 flex items-center justify-center border border-white/30 bg-[color:var(--color-fc-panel)] text-white/80 hover:text-white hover:border-white/50"
    >
      {icon}
    </button>
  );
}
