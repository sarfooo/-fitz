"use client";

import type { MouseEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import { AvatarSetupModal } from "@/components/dashboard/AvatarSetupModal";
import { ClosetPanel } from "@/components/dashboard/ClosetPanel";
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
  const value = category.toLowerCase();
  if (
    value.startsWith("tops_") ||
    /\b(shirt|polo|tee|t-shirt|sweater|knit|hoodie|jacket|coat|blazer|top)\b/.test(value)
  ) {
    return "top";
  }
  if (
    value.startsWith("bottoms_") ||
    /\b(pants|jean|trouser|short|denim|cargo|slack|bottom)\b/.test(value)
  ) {
    return "bottom";
  }
  return null;
}

export function DashboardShell({ user, accessToken = null }: DashboardShellProps) {
  const [activeView, setActiveView] = useState<TopBarView>("home");
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [slots, setSlots] = useState<OutfitSlots>({ top: null, bottom: null });
  const [avatar, setAvatar] = useState<AvatarIdentity | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [lookbookRefresh, setLookbookRefresh] = useState(0);
  const [closetVersion, setClosetVersion] = useState(0);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetchCurrentAvatar(accessToken);
        if (!cancelled) {
          setAvatar(response.avatar);
        }
      } catch {
        // Keep the UI usable even if avatar fetch fails.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const handleSelectItem = useCallback((item: MarketplaceItem | null) => {
    setSelectedItem(item);
  }, []);

  const handleWearItem = useCallback((item: MarketplaceItem, requestedSlot: GarmentSlot | null) => {
    const inferredSlot =
      requestedSlot ??
      detectSlot(item.category) ??
      (item.id === slots.top?.id ? "top" : null) ??
      (item.id === slots.bottom?.id ? "bottom" : null) ??
      (slots.top ? "bottom" : "top");

    setSlots((current) => {
      if (current[inferredSlot]?.id === item.id) {
        return { ...current, [inferredSlot]: null };
      }

      const next = { ...current, [inferredSlot]: item };
      const otherSlot: GarmentSlot = inferredSlot === "top" ? "bottom" : "top";
      if (next[otherSlot]?.id === item.id) {
        next[otherSlot] = null;
      }
      return next;
    });
  }, [slots.top, slots.bottom]);

  const handleRemoveSlot = useCallback((slot: GarmentSlot) => {
    setSlots((current) => ({ ...current, [slot]: null }));
  }, []);

  const handleResetOutfit = useCallback(() => {
    setSlots({ top: null, bottom: null });
  }, []);

  const handleOpenSetup = useCallback(() => {
    setSetupOpen(true);
  }, []);

  const handleCloseSetup = useCallback(() => {
    setSetupOpen(false);
  }, []);

  const handleCaptured = useCallback((captured: AvatarIdentity) => {
    setAvatar(captured);
  }, []);

  const handleFitSaved = useCallback(() => {
    setLookbookRefresh((current) => current + 1);
  }, []);

  const handleClosetSaved = useCallback(() => {
    setClosetVersion((current) => current + 1);
  }, []);

  const handleClosetSelectItem = useCallback((item: MarketplaceItem) => {
    setSelectedItem(item);
    setActiveView("home");
  }, []);

  const handleHomeClick = useCallback(
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

  const canvasAvatarUrl = avatar?.image_url ?? user.avatarUrl ?? null;

  return (
    <main
      className="flex flex-col h-screen overflow-hidden"
      style={{ fontFamily: "var(--font-pixel)" }}
      onClick={handleHomeClick}
    >
      <TopBar
        username={user.username}
        displayName={user.displayName}
        avatarUrl={canvasAvatarUrl}
        active={activeView}
        onNavigate={setActiveView}
      />

      {activeView === "home" ? (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 p-4 flex-1 min-h-0 overflow-hidden">
          <MarketplacePanel
            selectedItemId={selectedItem?.id ?? null}
            onSelectItem={handleSelectItem}
          />
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
          <LookbookPanel accessToken={accessToken} refreshKey={lookbookRefresh} />
        </div>
      ) : null}

      <TaskBar />

      {setupOpen ? (
        <AvatarSetupModal
          open={setupOpen}
          accessToken={accessToken}
          onClose={handleCloseSetup}
          onCaptured={handleCaptured}
        />
      ) : null}
    </main>
  );
}
