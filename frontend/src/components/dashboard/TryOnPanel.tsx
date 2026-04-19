"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, FolderHeart, RotateCcw, Shirt } from "lucide-react";

import type { WornItems } from "@/components/dashboard/DashboardShell";
import type { MarketplaceItem } from "@/components/dashboard/MarketplacePanel";
import { ScrollReel } from "@/components/ui/ScrollReel";
import {
  addClosetItem,
  addOutfit,
  generateFit,
  generateMoreAngles,
  getRenderStatus,
} from "@/lib/api/backend";

interface TryOnPanelProps {
  avatarUrl?: string | null;
  previewImageUrl?: string | null;
  currentItem?: MarketplaceItem | null;
  wornItems: WornItems;
  onWearItem: (item: MarketplaceItem) => void;
  onRemoveItem: (itemId: string) => void;
  onResetOutfit: () => void;
  onClearPreviewImage?: () => void;
  onStageImageChange?: (imageUrl: string | null) => void;
  accessToken?: string | null;
  avatarReady?: boolean;
  onRequestAvatarSetup?: () => void;
  onFitSaved?: () => void;
  onClosetSaved?: () => void;
  preloadedAngles?: string[];
  preloadedRenderId?: string | null;
}

type Mode = "base" | "rendered";

export function TryOnPanel({
  avatarUrl,
  previewImageUrl,
  currentItem,
  wornItems,
  onWearItem,
  onRemoveItem,
  onResetOutfit,
  onClearPreviewImage,
  onStageImageChange,
  accessToken,
  avatarReady = true,
  onRequestAvatarSetup,
  onFitSaved,
  onClosetSaved,
  preloadedAngles,
  preloadedRenderId,
}: TryOnPanelProps) {
  const [mode, setMode] = useState<Mode>("base");
  const [renderedImages, setRenderedImages] = useState<string[]>([]);
  const [renderId, setRenderId] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isLoadingAngles, setIsLoadingAngles] = useState(false);
  const [anglesError, setAnglesError] = useState<string | null>(null);
  const [isSavingClothes, setIsSavingClothes] = useState(false);
  const [isSavingOutfit, setIsSavingOutfit] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const pollAbortRef = useRef<{ cancelled: boolean } | null>(null);
  const renderedImage = renderedImages[0] ?? null;
  const stageImage = renderedImage ?? previewImageUrl ?? avatarUrl ?? null;
  const downloadableImage = stageImage;

  useEffect(() => {
    if (!isRendering) {
      return;
    }
    const started = performance.now();
    const timer = window.setInterval(() => {
      setElapsedMs(performance.now() - started);
    }, 200);
    return () => window.clearInterval(timer);
  }, [isRendering]);

  useEffect(() => {
    return () => {
      if (pollAbortRef.current) {
        pollAbortRef.current.cancelled = true;
      }
    };
  }, []);

  useEffect(() => {
    if (!preloadedAngles || preloadedAngles.length === 0) return;
    setRenderedImages(preloadedAngles);
    setRenderId(preloadedRenderId ?? null);
    setMode("rendered");
    setAnglesError(null);
    onStageImageChange?.(preloadedAngles[0]);
  }, [preloadedAngles, preloadedRenderId, onStageImageChange]);

  function handleResetView() {
    onResetOutfit();
    setMode("base");
    setRenderedImages([]);
    setRenderId(null);
    setAnglesError(null);
    setRenderError(null);
    setSaveMessage(null);
    setSaveError(null);
    onStageImageChange?.(null);
  }

  function handleResetToBaseImage() {
    setMode("base");
    setRenderedImages([]);
    setRenderId(null);
    setAnglesError(null);
    setRenderError(null);
    setSaveMessage(null);
    setSaveError(null);
    onClearPreviewImage?.();
    onStageImageChange?.(null);
  }

  async function pollForRender(token: string, renderId: string) {
    const controller = { cancelled: false };
    pollAbortRef.current = controller;

    for (let attempt = 0; attempt < 90; attempt += 1) {
      if (controller.cancelled) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
      if (controller.cancelled) {
        return;
      }

      try {
        const status = await getRenderStatus(token, renderId);
        if (status.status === "ready" && status.image?.signed_url) {
          const urls = status.angles
            .map((angle) => angle.image_url)
            .filter((url): url is string => Boolean(url));
          const ordered = urls.length > 0 ? urls : [status.image.signed_url];
          setRenderedImages(ordered);
          setRenderId(status.render_id);
          setMode("rendered");
          onStageImageChange?.(ordered[0]);
          return;
        }
        if (status.status === "failed") {
          setRenderError(status.error || "Render failed.");
          return;
        }
      } catch {
        // Keep polling through transient backend errors.
      }
    }

    setRenderError("Render is taking longer than expected. Try again.");
  }

  async function handleRenderOutfit() {
    setRenderError(null);

    if (wornItems.length === 0) {
      setRenderError("Wear at least one item before rendering.");
      return;
    }
    if (wornItems.some((item) => !item.imageUrl)) {
      setRenderError("Every worn item needs an image before rendering.");
      return;
    }
    if (!accessToken) {
      setRenderError("You need to be logged in to render a fit.");
      return;
    }
    if (!avatarReady) {
      setRenderError("Set up your avatar first.");
      onRequestAvatarSetup?.();
      return;
    }

    setIsRendering(true);
    setElapsedMs(0);
    setRenderedImages([]);
    setRenderId(null);
    setAnglesError(null);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const start = await generateFit(accessToken, {
        garments: wornItems.map((item) => ({
          image_url: item.imageUrl!,
          name: item.name,
        })),
      });
      await pollForRender(accessToken, start.render_id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Render failed.";
      if (/avatar/i.test(message)) {
        onRequestAvatarSetup?.();
      }
      setRenderError(message);
    } finally {
      setIsRendering(false);
    }
  }

  async function handleGetMoreAngles() {
    if (!accessToken || !renderId || isLoadingAngles) return;
    setAnglesError(null);
    setIsLoadingAngles(true);
    try {
      const response = await generateMoreAngles(accessToken, renderId);
      if (!response.success) {
        setAnglesError(response.error || "Failed to generate more angles.");
        return;
      }
      const urls = response.angles
        .map((angle) => angle.image_url)
        .filter((url): url is string => Boolean(url));
      if (urls.length > 0) {
        setRenderedImages(urls);
      }
    } catch (err: unknown) {
      setAnglesError(err instanceof Error ? err.message : "Failed to generate more angles.");
    } finally {
      setIsLoadingAngles(false);
    }
  }

  async function saveWornItemsToCloset() {
    if (!accessToken) {
      throw new Error("You need to be logged in to save clothes.");
    }

    if (wornItems.length === 0) {
      throw new Error("Wear at least one item first.");
    }

    const savedItems = await Promise.all(
      wornItems.map(async (item) => {
        const response = await addClosetItem(accessToken, {
          listing_id: item.id,
          item_name: item.name,
          price: item.price,
          size: item.size ?? null,
          image: item.imageUrl ?? null,
          category: item.category ?? null,
          source: item.source.toLowerCase(),
          product_url: item.productUrl ?? null,
        });
        return response.item;
      })
    );

    onClosetSaved?.();
    return savedItems;
  }

  async function handleSaveClothes() {
    if (isSavingClothes) {
      return;
    }

    try {
      setIsSavingClothes(true);
      setSaveError(null);
      setSaveMessage(null);
      const savedItems = await saveWornItemsToCloset();
      setSaveMessage(savedItems.length === 1 ? "Clothing item saved." : "Clothing items saved.");
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save clothes.");
    } finally {
      setIsSavingClothes(false);
    }
  }

  async function handleSaveOutfit() {
    if (!accessToken || isSavingOutfit) {
      return;
    }

    try {
      setIsSavingOutfit(true);
      setSaveError(null);
      setSaveMessage(null);

      const savedItems = await saveWornItemsToCloset();
      const outfitName =
        wornItems.map((item) => item.name).join(" + ") || "Saved outfit";
      const coverImage =
        renderedImage ?? previewImageUrl ?? avatarUrl ?? savedItems[0]?.image ?? null;

      await addOutfit(accessToken, {
        name: outfitName,
        closet_item_ids: savedItems.map((item) => item.id),
        cover_image: coverImage,
        render_id: renderId,
      });

      setSaveMessage("Outfit saved.");
      onFitSaved?.();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save outfit.");
    } finally {
      setIsSavingOutfit(false);
    }
  }

  async function handleDownloadCurrent() {
    if (!downloadableImage) {
      return;
    }

    try {
      const response = await fetch(downloadableImage);
      if (!response.ok) {
        throw new Error("Failed to download image.");
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = mode === "rendered" ? "fitz-rendered-outfit.png" : "fitz-avatar.png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (err: unknown) {
      setRenderError(err instanceof Error ? err.message : "Failed to download image.");
    }
  }

  return (
    <section className="y2k-window p-5 flex flex-col gap-4 h-full overflow-hidden">
      <div className="flex items-center justify-between">
        <h2
          className="neon-pink text-[24px] leading-none tracking-[0.12em] uppercase"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          Virtual Try-On
        </h2>
        {mode === "rendered" ? (
          <button
            type="button"
            onClick={handleResetView}
            className="text-[0.95rem] uppercase text-white/65 hover:text-white"
            style={{ fontFamily: "var(--font-pixel)" }}
          >
            Reset
          </button>
        ) : null}
      </div>

      <div className="flex-1 flex gap-5 overflow-hidden">
        <aside className="flex flex-col gap-5 pt-2 shrink-0">
          <ToolButton
            icon={<Shirt size={22} />}
            label={isSavingClothes ? "Saving..." : "Save Clothes"}
            onClick={() => void handleSaveClothes()}
            disabled={isSavingClothes}
          />
          <ToolButton
            icon={<FolderHeart size={22} />}
            label={isSavingOutfit ? "Saving..." : "Save Outfit"}
            onClick={() => void handleSaveOutfit()}
            disabled={isSavingOutfit}
          />
          <ToolButton
            icon={<Camera size={22} />}
            label="Screenshot"
            onClick={() => void handleDownloadCurrent()}
            disabled={!downloadableImage}
          />
          <ToolButton
            icon={<RotateCcw size={22} />}
            label="Base Image"
            onClick={handleResetToBaseImage}
            disabled={mode === "base" && !renderedImage && !previewImageUrl}
          />
        </aside>

        <div className="flex-1 relative flex items-end justify-center overflow-hidden rounded-lg bg-black/60 border border-[color:var(--color-fc-border)]">
          {mode === "rendered" && renderedImages.length > 0 ? (
            <ScrollReel
              className="h-full w-full"
              trackClassName="h-full items-end"
              ariaLabel="rendered outfit angles"
            >
              {renderedImages.map((src, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${src}-${idx}`}
                  src={src}
                  alt={`rendered outfit ${idx + 1}`}
                  className="h-full w-full flex-shrink-0 snap-center object-contain"
                />
              ))}
            </ScrollReel>
          ) : stageImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={stageImage} alt="your avatar" className="h-full w-auto object-contain" />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-white/60 text-sm">
                No avatar yet. Capture your look so rendered fits look like you.
              </p>
              {onRequestAvatarSetup ? (
                <button type="button" onClick={onRequestAvatarSetup} className="pill-btn">
                  Set up avatar
                </button>
              ) : null}
            </div>
          )}

          {isRendering ? <RenderingOverlay elapsedMs={elapsedMs} /> : null}

          {mode === "rendered" && renderId && !isRendering && renderedImages.length < 5 ? (
            <button
              type="button"
              onClick={() => void handleGetMoreAngles()}
              disabled={isLoadingAngles}
              className="absolute right-4 top-4 z-10 rounded-full border border-white/20 bg-black/70 px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-white backdrop-blur hover:border-[color:var(--color-fc-hot)] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              {isLoadingAngles ? "Generating..." : "Get more angles"}
            </button>
          ) : null}

          {anglesError ? (
            <div className="absolute inset-x-4 top-14 z-10 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {anglesError}
            </div>
          ) : null}

          {!isRendering && renderError ? (
            <div className="absolute inset-x-4 top-4 z-10 liquid-glass rounded-lg p-3 border border-rose-400/60 bg-rose-500/20">
              <p
                className="text-[0.8rem] uppercase text-rose-200 mb-1"
                style={{ fontFamily: "var(--font-pixel)" }}
              >
                Render error
              </p>
              <p className="text-sm text-white/90 leading-snug">{renderError}</p>
            </div>
          ) : null}

          {!isRendering && saveError ? (
            <div className="absolute inset-x-4 bottom-4 z-10 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {saveError}
            </div>
          ) : null}

          {!isRendering && !saveError && saveMessage ? (
            <div className="absolute inset-x-4 bottom-4 z-10 rounded-lg border border-[color:var(--color-fc-border)] bg-black/45 px-3 py-2 text-sm text-white/80">
              {saveMessage}
            </div>
          ) : null}

          <div
            className={`absolute right-5 top-5 bottom-5 w-[18.5rem] max-w-[36%] flex items-start transition-all duration-300 ease-out ${
              currentItem
                ? "translate-x-0 opacity-100"
                : "translate-x-6 opacity-0 pointer-events-none"
            }`}
            data-selection-anchor="true"
          >
            <CurrentItemCard
              item={currentItem}
              wornItems={wornItems}
              accessToken={accessToken ?? null}
              onWearItem={onWearItem}
              onClosetSaved={onClosetSaved}
            />
          </div>
        </div>

        <aside className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
          <WearingNowPanel
            wornItems={wornItems}
            isRendering={isRendering}
            onRemoveItem={onRemoveItem}
            onRender={handleRenderOutfit}
          />
        </aside>
      </div>
    </section>
  );
}

function RenderingOverlay({ elapsedMs }: { elapsedMs: number }) {
  const seconds = Math.floor(elapsedMs / 1000);
  const tenths = Math.floor((elapsedMs % 1000) / 100);
  const pct = Math.min(99, Math.floor((seconds / 30) * 100));

  const stage =
    seconds < 4
      ? "Reading your garments"
      : seconds < 10
      ? "Matching colors and cut"
      : seconds < 20
      ? "Styling the avatar"
      : seconds < 30
      ? "Final composition"
      : "Almost done";

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm gap-5 p-6">
      <div
        className="text-[0.8rem] uppercase text-white/70"
        style={{ fontFamily: "var(--font-pixel)" }}
      >
        Rendering outfit
      </div>

      <div
        className="text-5xl font-black tabular-nums chrome-text"
        style={{ fontFamily: "var(--font-retro)" }}
      >
        {seconds.toString().padStart(2, "0")}.{tenths}s
      </div>

      <div className="w-64 max-w-full space-y-2">
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10 border border-[color:var(--color-fc-border)]">
          <div
            className="h-full transition-[width] duration-300 ease-out"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, var(--color-fc-neon) 0%, var(--color-fc-hot) 100%)",
              boxShadow: "0 0 10px rgba(201,64,255,0.6)",
            }}
          />
        </div>
        <div
          className="flex items-center justify-between text-[0.8rem] uppercase text-white/60"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          <span>{stage}</span>
          <span>{pct}%</span>
        </div>
      </div>
    </div>
  );
}

function ToolButton({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1 transition-colors ${
        active ? "text-white" : "text-white/80 hover:text-white"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <span
        className={`w-12 h-12 flex items-center justify-center border bg-[color:var(--color-fc-panel)] ${
          active ? "border-[color:var(--color-fc-hot)]" : "border-[color:var(--color-fc-border)] hover:border-[color:var(--color-fc-neon)]"
        }`}
      >
        {icon}
      </span>
      <span
        className="text-[10px] tracking-[0.2em] uppercase"
        style={{ fontFamily: "var(--font-pixel)" }}
      >
        {label}
      </span>
    </button>
  );
}

function CurrentItemCard({
  item,
  wornItems,
  accessToken,
  onWearItem,
  onClosetSaved,
}: {
  item?: MarketplaceItem | null;
  wornItems: WornItems;
  accessToken: string | null;
  onWearItem: (item: MarketplaceItem) => void;
  onClosetSaved?: () => void;
}) {
  const [isSavingToCloset, setIsSavingToCloset] = useState(false);
  const [closetSavedItemId, setClosetSavedItemId] = useState<string | null>(null);
  const [closetError, setClosetError] = useState<string | null>(null);

  const hasSelectedItem = Boolean(item);
  const normalizedSize = item?.size
    ? item.size.trim().split(/\s+/).map((part) => part.toUpperCase()).join(" ")
    : "--";
  const isWearingSelectedItem = Boolean(
    item && wornItems.some((wornItem) => wornItem.id === item.id)
  );

  async function handleAddToCloset() {
    if (!item || isSavingToCloset) {
      return;
    }

    try {
      setIsSavingToCloset(true);
      setClosetError(null);
      if (!accessToken) {
        setClosetError("Sign in to save items to your closet.");
        return;
      }

      await addClosetItem(accessToken, {
        listing_id: item.id,
        item_name: item.name,
        price: item.price,
        size: item.size ?? null,
        image: item.imageUrl ?? null,
        category: item.category ?? null,
        source: item.source.toLowerCase(),
        product_url: item.productUrl ?? null,
      });
      setClosetSavedItemId(item.id);
      onClosetSaved?.();
    } catch (err: unknown) {
      setClosetError(err instanceof Error ? err.message : "Failed to save item.");
    } finally {
      setIsSavingToCloset(false);
    }
  }

  const isSavedToCloset = Boolean(item && closetSavedItemId === item.id);

  return (
    <div className="w-full rounded-[6px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(19,10,28,0.96)_0%,rgba(10,6,16,0.98)_100%)] px-4 py-4 shadow-[0_0_0_1px_rgba(255,38,185,0.08),0_20px_45px_rgba(0,0,0,0.45)]">
      <p
        className="text-[0.95rem] tracking-[0.1em] neon-pink uppercase"
        style={{ fontFamily: "var(--font-pixel)" }}
      >
        Current item
      </p>
      <div className="mt-3 space-y-2">
        <p
          className="text-[1.1rem] leading-6 text-white/82 break-words"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          {item?.name ?? "Pick an item from marketplace"}
        </p>
      </div>
      <div className="mt-4 h-px bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.14)_16%,rgba(255,255,255,0.14)_84%,transparent_100%)]" />
      <div
        className="mt-3 flex items-center justify-between text-[1.2rem]"
        style={{ fontFamily: "var(--font-pixel)" }}
      >
        <span className="text-white/65">SIZE:</span>
        <span className="text-white uppercase">{normalizedSize}</span>
      </div>
      <div className="mt-3 h-px bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.14)_16%,rgba(255,255,255,0.14)_84%,transparent_100%)]" />
      <div
        className="mt-3 flex items-center justify-between text-[1.2rem]"
        style={{ fontFamily: "var(--font-pixel)" }}
      >
        <span className="text-white/65">PRICE:</span>
        <span className="text-white">{item?.price != null ? `$${item.price}` : "--"}</span>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleAddToCloset}
          disabled={!hasSelectedItem}
          className="w-full border border-[#ff7ddd] bg-[linear-gradient(180deg,#f06ddd_0%,#d957ce_100%)] px-4 py-3 text-[1.2rem] uppercase text-[#22061e] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0_18px_rgba(255,38,185,0.18)] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          {isSavingToCloset ? "Saving..." : isSavedToCloset ? "Added to closet" : "Add to closet"}
        </button>
        <button
          type="button"
          onClick={() => item && onWearItem(item)}
          disabled={!hasSelectedItem}
          className="w-full border border-white/22 bg-transparent px-4 py-3 text-[1.05rem] uppercase text-white/88 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          {isWearingSelectedItem ? "Remove item" : "Wear item"}
        </button>
        {closetError ? <p className="text-[0.82rem] text-rose-300">{closetError}</p> : null}
      </div>
    </div>
  );
}

function WearingNowPanel({
  wornItems,
  isRendering,
  onRemoveItem,
  onRender,
}: {
  wornItems: WornItems;
  isRendering: boolean;
  onRemoveItem: (itemId: string) => void;
  onRender: () => void;
}) {
  return (
    <div className="liquid-glass overflow-hidden rounded-lg p-4 flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center justify-between">
        <p
          className="text-[18px] tracking-[0.08em] neon-pink uppercase"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          Wearing Now
        </p>
        <p className="text-[0.9rem] uppercase text-white/50">{wornItems.length} items</p>
      </div>

      {wornItems.length === 0 ? (
        <p className="text-[0.95rem] leading-5 text-white/55">
          Add pieces from the marketplace and they&apos;ll stack here.
        </p>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="flex flex-col gap-3">
            {wornItems.map((item, index) => (
              <div
                key={item.id}
                className="border border-[color:var(--color-fc-border)] bg-black/20 p-2 rounded-sm flex gap-3 items-start"
                data-selection-anchor="true"
              >
                <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-sm border border-[color:var(--color-fc-border)] bg-white/5">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="absolute inset-0 h-full w-full object-cover bg-neutral-100"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.9rem] uppercase text-white/50">
                    {item.category || `item ${index + 1}`}
                  </p>
                  <p className="text-[1rem] leading-5 text-white/85 break-words">{item.name}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[0.9rem] text-white/55">
                      {item.price != null ? `$${item.price}` : "--"}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="pill-btn-ghost px-3 py-1 text-[0.8rem]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {wornItems.length > 0 ? (
        <button
          type="button"
          onClick={onRender}
          disabled={isRendering}
          className="w-full border border-[#ff7ddd] bg-[linear-gradient(180deg,#f08be4_0%,#d960cf_100%)] px-4 py-3 text-[1.1rem] uppercase text-[#22061e] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0_18px_rgba(255,38,185,0.15)] disabled:opacity-50 disabled:cursor-wait"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          {isRendering ? "Rendering..." : "Render outfit"}
        </button>
      ) : null}
    </div>
  );
}
