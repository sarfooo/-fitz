"use client";

import type { MouseEvent } from "react";
import { useCallback, useState } from "react";

import { ClosetPanel } from "@/components/dashboard/ClosetPanel";
import { MarketplacePanel, type MarketplaceItem } from "@/components/dashboard/MarketplacePanel";
import { TaskBar } from "@/components/dashboard/TaskBar";
import { TopBar } from "@/components/dashboard/TopBar";
import { TryOnPanel } from "@/components/dashboard/TryOnPanel";

interface DashboardShellProps {
  user: {
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  accessToken?: string | null;
}

export function DashboardShell({ user, accessToken = null }: DashboardShellProps) {
  const [activeView, setActiveView] = useState<"home" | "closet" | "lookbook">("home");
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [wornItems, setWornItems] = useState<MarketplaceItem[]>([]);
  const [closetVersion, setClosetVersion] = useState(0);
  const handleSelectItem = useCallback((item: MarketplaceItem | null) => {
    setSelectedItem(item);
  }, []);
  const handleWearItem = useCallback((item: MarketplaceItem | null) => {
    if (!item) {
      return;
    }
    setWornItems((current) =>
      current.some((entry) => entry.id === item.id)
        ? current.filter((entry) => entry.id !== item.id)
        : [...current, item]
    );
  }, []);
  const handleClosetSaved = useCallback(() => {
    setClosetVersion((current) => current + 1);
  }, []);
  const handleClosetSelectItem = useCallback((item: MarketplaceItem) => {
    setSelectedItem(item);
    setActiveView("home");
  }, []);
  const handleBrowseClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (activeView !== "home" || !selectedItem) {
        return;
      }

      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.closest("[data-selection-anchor='true']")) {
        return;
      }

      setSelectedItem(null);
    },
    [activeView, selectedItem]
  );

  return (
    <main
      className="flex flex-col h-screen overflow-hidden"
      style={{ fontFamily: "var(--font-pixel)" }}
      onClick={handleBrowseClick}
    >
      <TopBar
        username={user.username}
        displayName={user.displayName}
        avatarUrl={user.avatarUrl ?? null}
        active={activeView}
        onNavigate={setActiveView}
      />

      {activeView === "home" ? (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 p-4 flex-1 min-h-0 overflow-hidden">
          <MarketplacePanel selectedItemId={selectedItem?.id ?? null} onSelectItem={handleSelectItem} />
          <TryOnPanel
            currentItem={selectedItem}
            wornItems={wornItems}
            onToggleWearItem={handleWearItem}
            accessToken={accessToken}
            onClosetSaved={handleClosetSaved}
          />
        </div>
      ) : null}

      {activeView === "closet" ? (
        <div className="p-4 flex-1 min-h-0 overflow-hidden">
          <ClosetPanel
            accessToken={accessToken}
            version={closetVersion}
            onSelectItem={handleClosetSelectItem}
          />
        </div>
      ) : null}

      {activeView === "lookbook" ? (
        <div className="p-4 flex-1 min-h-0 overflow-hidden">
          <section className="y2k-window h-full flex items-center justify-center px-6 text-center text-white/55">
            <p style={{ fontFamily: "var(--font-pixel)" }}>
              Lookbook view is not wired yet. Home and Closet are active.
            </p>
          </section>
        </div>
      ) : null}

      <TaskBar />
    </main>
  );
}
