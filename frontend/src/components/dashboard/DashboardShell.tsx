"use client";

import type { MouseEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AvatarSetupModal } from "@/components/dashboard/AvatarSetupModal";
import { ClosetPanel } from "@/components/dashboard/ClosetPanel";
import { CommunityPanel } from "@/components/dashboard/CommunityPanel";
import { LookbookPanel } from "@/components/dashboard/LookbookPanel";
import { MarketplacePanel, type MarketplaceItem } from "@/components/dashboard/MarketplacePanel";
import { SuggestionsPanel } from "@/components/dashboard/SuggestionsPanel";
import { TaskBar } from "@/components/dashboard/TaskBar";
import { TopBar, type TopBarView } from "@/components/dashboard/TopBar";
import { TryOnPanel } from "@/components/dashboard/TryOnPanel";
import { type AvatarIdentity, type SavedOutfit, fetchCurrentAvatar } from "@/lib/api/backend";

export type WornItems = MarketplaceItem[];

type SuggestionSignalKind = "viewed" | "worn" | "checkout";

type SuggestionSignals = Record<SuggestionSignalKind, MarketplaceItem[]>;

const SIGNALS_STORAGE_KEY = "fitz-suggestion-signals-v1";
const CHECKOUT_STORAGE_KEY = "fitz-checkout-selection-v1";

const EMPTY_SIGNALS: SuggestionSignals = {
  viewed: [],
  worn: [],
  checkout: [],
};

function mergeUniqueItems(items: MarketplaceItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

interface DashboardShellProps {
  user: {
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  accessToken?: string | null;
}

export function DashboardShell({ user, accessToken = null }: DashboardShellProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<TopBarView>("home");
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [selectedItemOrigin, setSelectedItemOrigin] = useState<"marketplace" | "external" | null>(
    null
  );
  const [wornItems, setWornItems] = useState<WornItems>([]);
  const [avatar, setAvatar] = useState<AvatarIdentity | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [lookbookRefresh, setLookbookRefresh] = useState(0);
  const [closetVersion, setClosetVersion] = useState(0);
  const [outfitPreviewImage, setOutfitPreviewImage] = useState<string | null>(null);
  const [suggestionSignals, setSuggestionSignals] = useState<SuggestionSignals>(() => {
    if (typeof window === "undefined") {
      return EMPTY_SIGNALS;
    }

    const rawSignals = window.localStorage.getItem(SIGNALS_STORAGE_KEY);
    if (!rawSignals) {
      return EMPTY_SIGNALS;
    }

    try {
      const parsed = JSON.parse(rawSignals) as Partial<SuggestionSignals>;
      return {
        viewed: Array.isArray(parsed.viewed) ? parsed.viewed : [],
        worn: Array.isArray(parsed.worn) ? parsed.worn : [],
        checkout: Array.isArray(parsed.checkout) ? parsed.checkout : [],
      };
    } catch {
      window.localStorage.removeItem(SIGNALS_STORAGE_KEY);
      return EMPTY_SIGNALS;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(SIGNALS_STORAGE_KEY, JSON.stringify(suggestionSignals));
  }, [suggestionSignals]);

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

  const trackItems = useCallback((kind: SuggestionSignalKind, items: MarketplaceItem[]) => {
    if (items.length === 0) {
      return;
    }

    setSuggestionSignals((current) => ({
      ...current,
      [kind]: mergeUniqueItems([...items, ...current[kind]]).slice(0, 24),
    }));
  }, []);

  const handleSelectItem = useCallback(
    (item: MarketplaceItem | null) => {
      setSelectedItem(item);
      setSelectedItemOrigin(item ? "marketplace" : null);
      if (item) {
        trackItems("viewed", [item]);
      }
    },
    [trackItems]
  );

  const handleWearItem = useCallback(
    (item: MarketplaceItem) => {
      setWornItems((current) =>
        current.some((existing) => existing.id === item.id)
          ? current.filter((existing) => existing.id !== item.id)
          : [...current, item]
      );
      trackItems("worn", [item]);
    },
    [trackItems]
  );

  const handleRemoveItem = useCallback((itemId: string) => {
    setWornItems((current) => current.filter((item) => item.id !== itemId));
  }, []);

  const handleResetOutfit = useCallback(() => {
    setWornItems([]);
    setOutfitPreviewImage(null);
  }, []);

  const handleClearPreviewImage = useCallback(() => {
    setOutfitPreviewImage(null);
  }, []);

  const handleStageImageChange = useCallback((imageUrl: string | null) => {
    setOutfitPreviewImage(imageUrl);
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

  const handleClosetSelectItem = useCallback(
    (item: MarketplaceItem) => {
      setSelectedItem(item);
      setSelectedItemOrigin("external");
      setActiveView("home");
      trackItems("viewed", [item]);
    },
    [trackItems]
  );

  const handleWearClosetItems = useCallback(
    (items: MarketplaceItem[]) => {
      if (items.length === 0) {
        return;
      }

      setWornItems((current) => mergeUniqueItems([...current, ...items]));
      setSelectedItem(items[items.length - 1] ?? null);
      setSelectedItemOrigin("external");
      setActiveView("home");
      trackItems("worn", items);
    },
    [trackItems]
  );

  const handleCheckoutItems = useCallback(
    (items: MarketplaceItem[]) => {
      if (items.length === 0) {
        return;
      }

      window.sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(items));
      trackItems("checkout", items);
      router.push("/checkout");
    },
    [router, trackItems]
  );

  const handleSelectOutfit = useCallback((outfit: SavedOutfit) => {
    const restoredItems: MarketplaceItem[] = outfit.items.map((item) => ({
      id: item.listing_id,
      source: item.source.toUpperCase(),
      name: item.item_name,
      price: item.price,
      category: item.category,
      size: item.size,
      imageUrl: item.image,
      productUrl: item.product_url,
    }));

    setWornItems(restoredItems);
    setSelectedItem(null);
    setSelectedItemOrigin(null);
    setOutfitPreviewImage(outfit.cover_image ?? null);
    setActiveView("home");
  }, []);

  const handleSelectCommunityOutfit = useCallback((items: MarketplaceItem[]) => {
    setWornItems(items);
    setSelectedItem(null);
    setSelectedItemOrigin(null);
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
      setSelectedItemOrigin(null);
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
        onUpdateAvatar={handleOpenSetup}
      />

      {activeView === "home" ? (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 p-4 flex-1 min-h-0 overflow-hidden">
          <MarketplacePanel
            selectedItemId={selectedItem?.id ?? null}
            selectedItemOrigin={selectedItemOrigin}
            onSelectItem={handleSelectItem}
          />
          <TryOnPanel
            previewImageUrl={outfitPreviewImage}
            currentItem={selectedItem}
            wornItems={wornItems}
            onWearItem={handleWearItem}
            onRemoveItem={handleRemoveItem}
            onResetOutfit={handleResetOutfit}
            onClearPreviewImage={handleClearPreviewImage}
            onStageImageChange={handleStageImageChange}
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
            onWearItems={handleWearClosetItems}
            onCheckoutItems={handleCheckoutItems}
          />
        </div>
      ) : null}

      {activeView === "lookbook" ? (
        <div className="p-4 flex-1 min-h-0 overflow-hidden">
          <LookbookPanel
            accessToken={accessToken}
            refreshKey={lookbookRefresh}
            onSelectOutfit={handleSelectOutfit}
          />
        </div>
      ) : null}

      {activeView === "community" ? (
        <div className="p-4 flex-1 min-h-0 overflow-hidden">
          <CommunityPanel
            accessToken={accessToken}
            onSelectOutfit={handleSelectCommunityOutfit}
          />
        </div>
      ) : null}

      {activeView === "suggestions" ? (
        <div className="p-4 flex-1 min-h-0 overflow-hidden">
          <SuggestionsPanel
            accessToken={accessToken}
            signals={suggestionSignals}
            onSelectItem={(item) => {
              setSelectedItem(item);
              setSelectedItemOrigin("external");
              setActiveView("home");
              trackItems("viewed", [item]);
            }}
            onClosetSaved={handleClosetSaved}
          />
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
