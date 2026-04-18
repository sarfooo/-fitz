"use client";

import { useCallback, useEffect, useState } from "react";

import { AvatarSetupModal } from "@/components/dashboard/AvatarSetupModal";
import { ClosetPanel } from "@/components/dashboard/ClosetPanel";
import { FitDetailsStrip } from "@/components/dashboard/FitDetailsStrip";
import { LookbookPanel } from "@/components/dashboard/LookbookPanel";
import { MarketplacePanel, type MarketplaceItem } from "@/components/dashboard/MarketplacePanel";
import { TaskBar } from "@/components/dashboard/TaskBar";
import { TopBar, type TopBarView } from "@/components/dashboard/TopBar";
import { TryOnPanel } from "@/components/dashboard/TryOnPanel";
import { type AvatarIdentity, fetchCurrentAvatar } from "@/lib/api/backend";

export type GarmentSlot = "top" | "bottom";

export interface OutfitSlots {
  top: MarketplaceItem | null;
  bottom: MarketplaceItem | null;
}

interface DashboardShellProps {
  user: {
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  accessToken?: string | null;
}

function detectSlot(category: string | null | undefined): GarmentSlot | null {
  if (!category) return null;
  const c = category.toLowerCase();
  if (c.startsWith("tops_") || /\b(shirt|polo|tee|t-shirt|sweater|knit|hoodie|jacket|coat|blazer|top)\b/.test(c)) {
    return "top";
  }
  if (c.startsWith("bottoms_") || /\b(pants|jean|trouser|short|denim|cargo|slack|bottom)\b/.test(c)) {
    return "bottom";
  }
  return null;
}

export function DashboardShell({ user, accessToken = null }: DashboardShellProps) {
  const [view, setView] = useState<TopBarView>("browse");
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [slots, setSlots] = useState<OutfitSlots>({ top: null, bottom: null });
  const [avatar, setAvatar] = useState<AvatarIdentity | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [lookbookRefresh, setLookbookRefresh] = useState(0);
  const [closetVersion, setClosetVersion] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchCurrentAvatar(accessToken);
        if (!cancelled) setAvatar(res.avatar);
      } catch {
        // 401 / network error — surface through the setup flow later.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const handleSelectItem = useCallback((item: MarketplaceItem) => {
    setSelectedItem(item);
  }, []);

  const handleWearItem = useCallback(
    (item: MarketplaceItem, slot: GarmentSlot | null) => {
      const resolved = slot ?? detectSlot(item.category);
      if (!resolved) return;
      setSlots((prev) => ({ ...prev, [resolved]: item }));
    },
    [],
  );

  const handleRemoveSlot = useCallback((slot: GarmentSlot) => {
    setSlots((prev) => ({ ...prev, [slot]: null }));
  }, []);

  const handleResetOutfit = useCallback(() => {
    setSlots({ top: null, bottom: null });
  }, []);

  const handleOpenSetup = useCallback(() => setSetupOpen(true), []);
  const handleCloseSetup = useCallback(() => setSetupOpen(false), []);
  const handleCaptured = useCallback((captured: AvatarIdentity) => {
    setAvatar(captured);
  }, []);
  const handleFitSaved = useCallback(() => {
    setLookbookRefresh((n) => n + 1);
  }, []);
  const handleClosetSaved = useCallback(() => {
    setClosetVersion((n) => n + 1);
  }, []);
  const handleClosetSelectItem = useCallback((item: MarketplaceItem) => {
    setSelectedItem(item);
    setView("browse");
  }, []);

  const canvasAvatarUrl = avatar?.image_url ?? user.avatarUrl ?? null;

  return (
    <main className="flex flex-col h-screen overflow-hidden">
      <TopBar
        username={user.username}
        displayName={user.displayName}
        avatarUrl={canvasAvatarUrl}
        active={view}
        onNavigate={setView}
      />

      {/* Browse — kept mounted so in-flight renders / selections survive tab switches. */}
      <div
        className={`grid grid-cols-1 lg:grid-cols-[280px_1fr_240px_240px] gap-4 p-4 flex-1 min-h-0 overflow-hidden ${
          view === "browse" ? "" : "hidden"
        }`}
      >
        <MarketplacePanel selectedItemId={selectedItem?.id ?? null} onSelectItem={handleSelectItem} />
        <TryOnPanel
          currentItem={selectedItem}
          slots={slots}
          onWearItem={handleWearItem}
          onRemoveSlot={handleRemoveSlot}
          onResetOutfit={handleResetOutfit}
          accessToken={accessToken}
          avatarUrl={canvasAvatarUrl}
          avatarReady={avatar !== null}
          onRequestAvatarSetup={handleOpenSetup}
          onFitSaved={handleFitSaved}
          onClosetSaved={handleClosetSaved}
        />
        <ClosetPanel
          accessToken={accessToken}
          version={closetVersion}
          onSelectItem={handleClosetSelectItem}
        />
        <LookbookPanel accessToken={accessToken} refreshKey={lookbookRefresh} />
      </div>

      {view === "lookbook" ? (
        <div className="flex-1 min-h-0 overflow-hidden p-4">
          <LookbookPanel accessToken={accessToken} refreshKey={lookbookRefresh} />
        </div>
      ) : null}

      {view === "closet" ? (
        <div className="flex-1 min-h-0 overflow-hidden p-4">
          <ClosetPanel
            accessToken={accessToken}
            version={closetVersion}
            onSelectItem={handleClosetSelectItem}
          />
        </div>
      ) : null}

      {view === "home" ? (
        <div className="flex-1 min-h-0 overflow-hidden p-4">
          <section className="y2k-window h-full flex items-center justify-center px-6 text-center text-white/55">
            <p style={{ fontFamily: "var(--font-mono)" }}>
              Home view is not wired yet. Browse, Closet, and Outfits are active.
            </p>
          </section>
        </div>
      ) : null}

      <FitDetailsStrip />

      <TaskBar />

      <AvatarSetupModal
        open={setupOpen}
        accessToken={accessToken}
        onClose={handleCloseSetup}
        onCaptured={handleCaptured}
      />
    </main>
  );
}
