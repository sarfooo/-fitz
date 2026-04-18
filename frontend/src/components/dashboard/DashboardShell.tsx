"use client";

import { useCallback, useState } from "react";

import { ClosetPanel } from "@/components/dashboard/ClosetPanel";
import { FitDetailsStrip } from "@/components/dashboard/FitDetailsStrip";
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
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [wornItem, setWornItem] = useState<MarketplaceItem | null>(null);
  const handleSelectItem = useCallback((item: MarketplaceItem) => {
    setSelectedItem(item);
  }, []);
  const handleWearItem = useCallback((item: MarketplaceItem | null) => {
    setWornItem(item);
  }, []);

  return (
    <main className="flex flex-col h-screen overflow-hidden">
      <TopBar
        username={user.username}
        displayName={user.displayName}
        avatarUrl={user.avatarUrl ?? null}
        active="browse"
      />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-4 p-4 flex-1 min-h-0 overflow-hidden">
        <MarketplacePanel selectedItemId={selectedItem?.id ?? null} onSelectItem={handleSelectItem} />
        <TryOnPanel
          currentItem={selectedItem}
          wornItem={wornItem}
          onWearItem={handleWearItem}
          accessToken={accessToken}
        />
        <ClosetPanel accessToken={accessToken} />
      </div>

      <FitDetailsStrip />

      <TaskBar />
    </main>
  );
}
