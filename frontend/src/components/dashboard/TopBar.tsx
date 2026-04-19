"use client";

import Image from "next/image";

interface TopBarProps {
  username: string;
  displayName?: string | null;
  avatarUrl?: string;
  active?: "home" | "closet" | "lookbook";
  onNavigate?: (view: NonNullable<TopBarProps["active"]>) => void;
}

const NAV_ITEMS: Array<{ id: TopBarProps["active"]; label: string }> = [
  { id: "home", label: "HOME" },
  { id: "closet", label: "CLOSET" },
  { id: "lookbook", label: "OUTFITS" },
];

export function TopBar({
  username,
  displayName,
  avatarUrl,
  active = "home",
  onNavigate,
}: TopBarProps) {
  const primaryLabel = displayName?.trim() || username;

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-[color:var(--color-fc-border)] bg-[linear-gradient(180deg,rgba(10,4,16,0.98)_0%,rgba(5,0,8,0.96)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_32px_rgba(0,0,0,0.38)] backdrop-blur">
      <div className="flex flex-col items-center gap-1">
        <h1
          className="chrome-text text-5xl md:text-6xl font-black tracking-tighter leading-none"
          style={{ fontFamily: "var(--font-retro)" }}
        >
          FITZ
        </h1>
        <p
          className="text-center text-[15px] md:text-[16px] tracking-[0.12em] text-white uppercase"
          style={{ fontFamily: "var(--font-pixel)" }}
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
              onClick={() => onNavigate?.(item.id)}
              className={`inline-flex items-center justify-center text-[17px] md:text-[18px] leading-none tracking-[0.02em] uppercase transition-colors ${
                isActive
                  ? "h-[34px] min-w-[94px] px-4 border border-[#ff8ce3] bg-[linear-gradient(180deg,rgba(150,74,140,0.82)_0%,rgba(112,52,110,0.86)_100%)] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_0_0_1px_rgba(255,38,185,0.22)]"
                  : "px-0 text-[#bbb2bb] hover:text-white"
              }`}
              style={{ fontFamily: "var(--font-pixel)", borderRadius: isActive ? "2px" : "0px" }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <div className="hidden sm:block text-right leading-tight">
          <p
            className="text-[16px] text-white/55"
            style={{ fontFamily: "var(--font-pixel)" }}
          >
            welcome back,
          </p>
          <p
            className="text-[22px] leading-none text-white"
            style={{ fontFamily: "var(--font-pixel)" }}
          >
            {primaryLabel}
          </p>
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
      </div>
    </header>
  );
}
