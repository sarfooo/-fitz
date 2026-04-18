"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, Camera, Check, PersonStanding, RefreshCw, Shirt, X } from "lucide-react";

import type { GarmentSlot, OutfitSlots } from "@/components/dashboard/DashboardShell";
import type { MarketplaceItem } from "@/components/dashboard/MarketplacePanel";
import { addClosetItem, generateFit, getRenderStatus, saveRenderToLookbook } from "@/lib/api/backend";

interface TryOnPanelProps {
  avatarUrl?: string | null;
  currentItem?: MarketplaceItem | null;
  slots: OutfitSlots;
  onWearItem: (item: MarketplaceItem, slot: GarmentSlot | null) => void;
  onRemoveSlot: (slot: GarmentSlot) => void;
  onResetOutfit: () => void;
  accessToken?: string | null;
  avatarReady?: boolean;
  onRequestAvatarSetup?: () => void;
  onFitSaved?: () => void;
  onClosetSaved?: () => void;
}

type Mode = "base" | "outfit" | "rendered";

export function TryOnPanel({
  avatarUrl,
  currentItem,
  slots,
  onWearItem,
  onRemoveSlot,
  onResetOutfit,
  accessToken,
  avatarReady = true,
  onRequestAvatarSetup,
  onFitSaved,
  onClosetSaved,
}: TryOnPanelProps) {
  const [mode, setMode] = useState<Mode>("base");
  const [rendered, setRendered] = useState<string | null>(null);
  const [lastRenderId, setLastRenderId] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [savingFit, setSavingFit] = useState(false);
  const [savedFit, setSavedFit] = useState(false);
  const pollAbortRef = useRef<{ cancelled: boolean } | null>(null);

  const slotCount = Number(Boolean(slots.top)) + Number(Boolean(slots.bottom));
  const slotsReady = slotCount === 2;
  const canGenerate = slotsReady && !isRendering;

  // Tick an elapsed-time counter while a render is in flight.
  useEffect(() => {
    if (!isRendering) return;
    const started = performance.now();
    setElapsedMs(0);
    const id = window.setInterval(() => {
      setElapsedMs(performance.now() - started);
    }, 200);
    return () => window.clearInterval(id);
  }, [isRendering]);

  useEffect(() => {
    return () => {
      if (pollAbortRef.current) pollAbortRef.current.cancelled = true;
    };
  }, []);

  function handleBody() {
    // Reset back to the avatar's base picture with no clothing applied.
    onResetOutfit();
    setMode("base");
    setRendered(null);
    setRenderError(null);
  }

  async function pollForRender(token: string, renderId: string) {
    const controller = { cancelled: false };
    pollAbortRef.current = controller;

    const maxAttempts = 90; // ~3 min at 2s intervals
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (controller.cancelled) return;
      await new Promise((resolve) => setTimeout(resolve, 2000));
      if (controller.cancelled) return;
      try {
        const status = await getRenderStatus(token, renderId);
        console.info("[tryon] poll", attempt, status);
        if (status.status === "ready" && status.image?.signed_url) {
          setRendered(status.image.signed_url);
          setLastRenderId(renderId);
          setSavedFit(false);
          setMode("rendered");
          return;
        }
        if (status.status === "failed") {
          setRenderError(status.error || "Render failed — credit refunded.");
          return;
        }
      } catch (err) {
        console.warn("[tryon] poll attempt failed", err);
        // transient errors — keep polling
      }
    }
    setRenderError("Render is taking longer than expected. Try again.");
  }

  async function handleSaveFit() {
    if (!lastRenderId || !accessToken || savingFit || savedFit) return;
    setSavingFit(true);
    try {
      const name = [slots.top?.name, slots.bottom?.name].filter(Boolean).join(" + ") || null;
      const res = await saveRenderToLookbook(accessToken, lastRenderId, name);
      if (res.success) {
        setSavedFit(true);
        onFitSaved?.();
      } else {
        setRenderError(res.error || "Failed to save fit.");
      }
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : "Failed to save fit.");
    } finally {
      setSavingFit(false);
    }
  }

  async function handleGenerate() {
    setRenderError(null);
    if (!slots.top && !slots.bottom) {
      setRenderError("Pick a top and a bottom first — tap an item, then 'Wear as top/bottom'.");
      return;
    }
    if (!slots.top) {
      setRenderError("Missing a top — tap an item and hit 'Wear as top'.");
      return;
    }
    if (!slots.bottom) {
      setRenderError("Missing a bottom — tap an item and hit 'Wear as bottom'.");
      return;
    }
    if (!slots.top.imageUrl || !slots.bottom.imageUrl) {
      setRenderError("Both items need an image before we can render.");
      return;
    }
    if (!accessToken) {
      setRenderError("You need to be logged in to generate a fit.");
      return;
    }
    if (!avatarReady) {
      setRenderError("Set up your avatar first — opening the capture flow.");
      onRequestAvatarSetup?.();
      return;
    }
    setIsRendering(true);
    setRendered(null);
    try {
      const payload = {
        top: { image_url: slots.top.imageUrl, name: slots.top.name },
        bottom: { image_url: slots.bottom.imageUrl, name: slots.bottom.name },
      };
      console.info("[tryon] starting fit job", payload);
      const start = await generateFit(accessToken, payload);
      console.info("[tryon] job started", start);
      await pollForRender(accessToken, start.render_id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Render failed.";
      console.error("[tryon] generate fit failed", err);
      if (/no avatar set up/i.test(message) || (/avatar/i.test(message) && /set up|generate/i.test(message))) {
        onRequestAvatarSetup?.();
        setRenderError("Set up your avatar first — opening the capture flow.");
      } else {
        setRenderError(message);
      }
    } finally {
      setIsRendering(false);
    }
  }

  return (
    <section className="y2k-window p-5 flex flex-col gap-4 h-full overflow-hidden">
      <div className="flex items-center justify-between">
        <h2
          className="neon-pink text-sm tracking-[0.3em] uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Virtual Try-On
        </h2>
        {mode !== "base" ? (
          <button
            type="button"
            onClick={handleBody}
            className="text-[10px] tracking-[0.2em] uppercase text-white/60 hover:text-white flex items-center gap-1"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <RefreshCw size={12} /> reset
          </button>
        ) : null}
      </div>

      <div className="flex-1 flex gap-5 overflow-hidden">
        <aside className="flex flex-col gap-5 pt-2 shrink-0">
          <ToolButton
            icon={<PersonStanding size={22} />}
            label="Body"
            active={mode === "base"}
            onClick={handleBody}
          />
          <ToolButton
            icon={<Shirt size={22} />}
            label="Closet"
            active={mode === "outfit" || mode === "rendered"}
            onClick={() => setMode("outfit")}
          />
          <ToolButton icon={<Camera size={22} />} label="Screenshot" />
          <ToolButton
            icon={savedFit ? <Check size={22} /> : <Bookmark size={22} />}
            label={savedFit ? "Saved" : savingFit ? "Saving" : "Save fit"}
            active={savedFit}
            onClick={handleSaveFit}
            disabled={!lastRenderId || savingFit || savedFit || mode !== "rendered"}
          />
        </aside>

        <div className="flex-1 relative flex items-end justify-center overflow-hidden rounded-lg bg-black/60 border border-[color:var(--color-fc-border)]">
          {mode === "rendered" && rendered ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={rendered} alt="rendered fit" className="h-full w-auto object-contain" />
              {lastRenderId ? (
                <button
                  type="button"
                  onClick={handleSaveFit}
                  disabled={savingFit || savedFit}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 pill-btn disabled:opacity-60"
                >
                  {savingFit ? "Saving..." : savedFit ? "✓ Saved to lookbook" : "Save to lookbook"}
                </button>
              ) : null}
            </>
          ) : avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="your avatar" className="h-full w-auto object-contain" />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-white/60 text-sm">
                No avatar yet. Capture your look so fits render as you.
              </p>
              {onRequestAvatarSetup ? (
                <button
                  type="button"
                  onClick={onRequestAvatarSetup}
                  className="pill-btn"
                >
                  Set up your avatar
                </button>
              ) : null}
            </div>
          )}

          {mode === "outfit" ? (
            <OutfitOverlay slots={slots} onRemoveSlot={onRemoveSlot} />
          ) : null}

          {isRendering ? (
            <RenderingOverlay elapsedMs={elapsedMs} />
          ) : null}

          {!isRendering && renderError ? (
            <div className="absolute inset-x-4 top-4 z-10 liquid-glass rounded-lg p-3 border border-rose-400/60 bg-rose-500/20">
              <p className="text-[10px] tracking-[0.25em] uppercase text-rose-200 mb-1"
                 style={{ fontFamily: "var(--font-mono)" }}>
                Render error
              </p>
              <p className="text-sm text-white/90 leading-snug">{renderError}</p>
            </div>
          ) : null}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-64 h-10 rounded-full pointer-events-none"
               style={{
                 background: "radial-gradient(ellipse, rgba(201,64,255,0.55) 0%, rgba(201,64,255,0) 70%)",
                 filter: "blur(6px)",
               }}
          />
        </div>

        <aside className="w-64 shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
          <SelectedItemCard
            item={currentItem}
            slots={slots}
            accessToken={accessToken ?? null}
            onWearItem={onWearItem}
            onClosetSaved={onClosetSaved}
          />
          <SlotsSummary
            slots={slots}
            canGenerate={canGenerate}
            isRendering={isRendering}
            onGenerate={handleGenerate}
            onRemoveSlot={onRemoveSlot}
            error={renderError}
          />
        </aside>
      </div>
    </section>
  );
}

function RenderingOverlay({ elapsedMs }: { elapsedMs: number }) {
  const seconds = Math.floor(elapsedMs / 1000);
  const tenths = Math.floor((elapsedMs % 1000) / 100);
  const estimatedTotal = 30;
  const pct = Math.min(99, Math.floor((seconds / estimatedTotal) * 100));

  const stage =
    seconds < 4
      ? "Reading your garments"
      : seconds < 10
      ? "Matching colors and cut"
      : seconds < 20
      ? "Dressing your avatar"
      : seconds < 30
      ? "Final composition"
      : "Still rendering — almost there";

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm gap-5 p-6">
      <div
        className="text-[10px] tracking-[0.35em] uppercase text-white/70"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Rendering fit
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
          className="flex items-center justify-between text-[10px] tracking-[0.2em] uppercase text-white/60"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span>{stage}</span>
          <span>{pct}%</span>
        </div>
      </div>

      <p className="text-[11px] text-white/50 max-w-xs text-center">
        gpt-image-1 typically takes 20-40s. We refund your credit if anything fails.
      </p>
    </div>
  );
}

function ToolButton({
  icon,
  label,
  active,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1 transition-colors ${
        active ? "text-white" : "text-white/60 hover:text-white"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <span
        className={`w-12 h-12 flex items-center justify-center border bg-[color:var(--color-fc-panel)] ${
          active
            ? "border-[color:var(--color-fc-hot)]"
            : "border-[color:var(--color-fc-border)] hover:border-[color:var(--color-fc-neon)]"
        }`}
      >
        {icon}
      </span>
      <span
        className="text-[10px] tracking-[0.2em] uppercase"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}
      </span>
    </button>
  );
}

function OutfitOverlay({
  slots,
  onRemoveSlot,
}: {
  slots: OutfitSlots;
  onRemoveSlot: (slot: GarmentSlot) => void;
}) {
  return (
    <div className="absolute inset-x-6 top-6 bottom-20 pointer-events-none">
      {slots.top ? (
        <SlotFloater slot="top" item={slots.top} position="top" onRemove={() => onRemoveSlot("top")} />
      ) : null}
      {slots.bottom ? (
        <SlotFloater slot="bottom" item={slots.bottom} position="bottom" onRemove={() => onRemoveSlot("bottom")} />
      ) : null}
    </div>
  );
}

function SlotFloater({
  slot,
  item,
  position,
  onRemove,
}: {
  slot: GarmentSlot;
  item: MarketplaceItem;
  position: "top" | "bottom";
  onRemove: () => void;
}) {
  return (
    <div
      className={`absolute ${position === "top" ? "top-0 left-0" : "bottom-0 right-0"} liquid-glass rounded-lg px-3 py-2 max-w-[12rem] pointer-events-auto`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <p
          className="text-[10px] uppercase tracking-[0.24em] text-white/55"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {slot === "top" ? "Top" : "Bottom"}
        </p>
        <button
          type="button"
          onClick={onRemove}
          className="text-white/60 hover:text-white"
          aria-label={`remove ${slot}`}
        >
          <X size={12} />
        </button>
      </div>
      <p className="text-xs text-white/80 line-clamp-2">{item.name}</p>
    </div>
  );
}

function SelectedItemCard({
  item,
  slots,
  accessToken,
  onWearItem,
  onClosetSaved,
}: {
  item?: MarketplaceItem | null;
  slots: OutfitSlots;
  accessToken: string | null;
  onWearItem: (item: MarketplaceItem, slot: GarmentSlot | null) => void;
  onClosetSaved?: () => void;
}) {
  const [isSavingToCloset, setIsSavingToCloset] = useState(false);
  const [closetSavedItemId, setClosetSavedItemId] = useState<string | null>(null);
  const [closetError, setClosetError] = useState<string | null>(null);

  const normalizedSize = item?.size
    ? item.size.trim().split(/\s+/).map((part) => part.toUpperCase()).join(" ")
    : "--";

  const inferredSlot = useMemo<GarmentSlot | null>(() => {
    if (!item?.category) return null;
    const c = item.category.toLowerCase();
    if (c.startsWith("tops_") || /\b(shirt|polo|tee|sweater|knit|hoodie|jacket|coat|blazer|top)\b/.test(c)) return "top";
    if (c.startsWith("bottoms_") || /\b(pants|jean|trouser|short|denim|cargo|slack|bottom)\b/.test(c)) return "bottom";
    return null;
  }, [item?.category]);

  const isInTop = Boolean(item && slots.top?.id === item.id);
  const isInBottom = Boolean(item && slots.bottom?.id === item.id);

  async function handleAddToCloset() {
    if (!item || isSavingToCloset || !accessToken) return;
    try {
      setIsSavingToCloset(true);
      setClosetError(null);
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
    <div className="liquid-glass overflow-visible rounded-lg p-4 flex flex-col gap-3">
      <p
        className="text-[10px] tracking-[0.25em] neon-pink uppercase"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Current item
      </p>
      <div className="space-y-2">
        <p className="text-lg font-semibold">{item?.source ?? "No selection"}</p>
        <p className="text-sm leading-7 text-white/70 break-words">
          {item?.name ?? "Pick an item from marketplace"}
        </p>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/60">SIZE:</span>
        <span className="text-white uppercase">{normalizedSize}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/60">PRICE:</span>
        <span className="text-white">{item?.price != null ? `$${item.price}` : "--"}</span>
      </div>
      <div className="px-1 pt-5 pb-5 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleAddToCloset}
          disabled={!item || !accessToken}
          className="pill-btn w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSavingToCloset ? "Saving..." : isSavedToCloset ? "Added to closet" : "Add to closet"}
        </button>

        {inferredSlot ? (
          <button
            type="button"
            onClick={() => item && onWearItem(item, inferredSlot)}
            disabled={!item}
            className="pill-btn-ghost w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(inferredSlot === "top" && isInTop) || (inferredSlot === "bottom" && isInBottom)
              ? `Wearing as ${inferredSlot}`
              : `Wear as ${inferredSlot}`}
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => item && onWearItem(item, "top")}
              disabled={!item}
              className={`pill-btn-ghost w-full disabled:opacity-50 disabled:cursor-not-allowed ${
                isInTop ? "!border-[color:var(--color-fc-hot)] !text-white" : ""
              }`}
            >
              Top
            </button>
            <button
              type="button"
              onClick={() => item && onWearItem(item, "bottom")}
              disabled={!item}
              className={`pill-btn-ghost w-full disabled:opacity-50 disabled:cursor-not-allowed ${
                isInBottom ? "!border-[color:var(--color-fc-hot)] !text-white" : ""
              }`}
            >
              Bottom
            </button>
          </div>
        )}

        {closetError ? (
          <p className="text-[10px] text-rose-300">{closetError}</p>
        ) : null}
      </div>
    </div>
  );
}

function SlotsSummary({
  slots,
  canGenerate,
  isRendering,
  onGenerate,
  onRemoveSlot,
  error,
}: {
  slots: OutfitSlots;
  canGenerate: boolean;
  isRendering: boolean;
  onGenerate: () => void;
  onRemoveSlot: (slot: GarmentSlot) => void;
  error: string | null;
}) {
  return (
    <div className="liquid-glass rounded-lg p-4 flex flex-col gap-3">
      <p
        className="text-[10px] tracking-[0.25em] neon-pink uppercase"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        This fit
      </p>
      <SlotRow label="Top" item={slots.top} onRemove={() => onRemoveSlot("top")} />
      <SlotRow label="Bottom" item={slots.bottom} onRemove={() => onRemoveSlot("bottom")} />
      <button
        type="button"
        onClick={onGenerate}
        disabled={isRendering}
        className="pill-btn w-full disabled:opacity-60 disabled:cursor-wait"
      >
        {isRendering ? "Rendering..." : canGenerate ? "Generate fit" : "Generate fit"}
      </button>
      {error ? (
        <p className="text-[11px] text-rose-300 border border-rose-400/30 bg-rose-500/10 px-2 py-1.5">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SlotRow({
  label,
  item,
  onRemove,
}: {
  label: string;
  item: MarketplaceItem | null;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-white/55 uppercase tracking-[0.2em] w-14" style={{ fontFamily: "var(--font-mono)" }}>
        {label}
      </span>
      <span className="flex-1 text-white/85 line-clamp-1">
        {item?.name ?? "—"}
      </span>
      {item ? (
        <button
          type="button"
          onClick={onRemove}
          className="text-white/55 hover:text-white"
          aria-label={`remove ${label.toLowerCase()}`}
        >
          <X size={12} />
        </button>
      ) : null}
    </div>
  );
}
