"use client";

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
  const [activeView, setActiveView] = useState<"home" | "browse" | "closet" | "lookbook">("browse");
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [wornItem, setWornItem] = useState<MarketplaceItem | null>(null);
  const [closetVersion, setClosetVersion] = useState(0);
  const handleSelectItem = useCallback((item: MarketplaceItem) => {
    setSelectedItem(item);
  }, []);
  const handleWearItem = useCallback((item: MarketplaceItem | null) => {
    setWornItem(item);
  }, []);
  const handleClosetSaved = useCallback(() => {
    setClosetVersion((current) => current + 1);
    setActiveView("closet");
  }, []);
  const handleClosetSelectItem = useCallback((item: MarketplaceItem) => {
    setSelectedItem(item);
    setActiveView("browse");
  }, []);

  return (
    <main className="flex flex-col h-screen overflow-hidden">
      <TopBar
        username={user.username}
        displayName={user.displayName}
        avatarUrl={user.avatarUrl ?? null}
        active={activeView}
        onNavigate={setActiveView}
      />

      {activeView === "browse" ? (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 p-4 flex-1 min-h-0 overflow-hidden">
          <MarketplacePanel selectedItemId={selectedItem?.id ?? null} onSelectItem={handleSelectItem} />
          <TryOnPanel
            currentItem={selectedItem}
            wornItem={wornItem}
            onWearItem={handleWearItem}
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

      {activeView === "home" || activeView === "lookbook" ? (
        <div className="p-4 flex-1 min-h-0 overflow-hidden">
          <section className="y2k-window h-full flex items-center justify-center px-6 text-center text-white/55">
            <p style={{ fontFamily: "var(--font-mono)" }}>
              {activeView === "home"
                ? "Home view is not wired yet. Browse and Closet are active."
                : "Lookbook view is not wired yet. Browse and Closet are active."}
            </p>
          </section>
        </div>
      ) : null}

      <TaskBar />
    </main>
  );
}
