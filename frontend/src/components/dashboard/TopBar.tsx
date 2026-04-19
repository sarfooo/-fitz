"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export type TopBarView = "home" | "closet" | "lookbook" | "community" | "suggestions";

interface TopBarProps {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  active?: TopBarView;
  onNavigate?: (view: TopBarView) => void;
  onUpdateAvatar?: () => void;
}

const NAV_ITEMS: Array<{ id: TopBarView; label: string }> = [
  { id: "home", label: "HOME" },
  { id: "closet", label: "CLOSET" },
  { id: "lookbook", label: "OUTFITS" },
  { id: "community", label: "COMMUNITY" },
  { id: "suggestions", label: "SUGGESTIONS" },
];

export function TopBar({
  username,
  displayName,
  avatarUrl,
  active = "home",
  onNavigate,
  onUpdateAvatar,
}: TopBarProps) {
  const primaryLabel = displayName?.trim() || username;
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
      setMenuOpen(false);
    }
  }

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

      <div className="relative flex items-center gap-3" ref={menuRef} data-selection-anchor="true">
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
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex items-center gap-2 rounded border border-white/15 px-2 py-1 hover:border-white/30"
        >
          <div className="relative w-10 h-10 rounded overflow-hidden bg-[color:var(--color-fc-panel)]">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                className="h-full w-full object-cover object-top scale-[2.6] origin-top"
                style={{ objectPosition: "center top" }}
              />
            ) : (
              <div className="w-full h-full bg-[color:var(--color-fc-panel)]" />
            )}
          </div>
          <ChevronDown size={16} className="text-white/60" />
        </button>

        {menuOpen ? (
          <div className="absolute right-0 top-[calc(100%+10px)] z-30 min-w-[160px] border border-[color:var(--color-fc-border)] bg-[linear-gradient(180deg,rgba(18,10,26,0.98)_0%,rgba(7,3,12,0.98)_100%)] p-2 shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
            {onUpdateAvatar ? (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onUpdateAvatar();
                }}
                className="w-full px-3 py-2 text-left text-[14px] uppercase text-white/85 hover:bg-white/5"
                style={{ fontFamily: "var(--font-pixel)" }}
              >
                Update avatar
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              className="w-full px-3 py-2 text-left text-[14px] uppercase text-white/85 hover:bg-white/5 disabled:opacity-50"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              {isLoggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
