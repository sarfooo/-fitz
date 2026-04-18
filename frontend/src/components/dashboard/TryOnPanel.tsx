"use client";

import { useState } from "react";
import { Camera, PersonStanding, Shirt } from "lucide-react";

import type { MarketplaceItem } from "@/components/dashboard/MarketplacePanel";
import { addClosetItem } from "@/lib/api/backend";

interface TryOnPanelProps {
  avatarUrl?: string;
  currentItem?: MarketplaceItem | null;
  wornItem?: MarketplaceItem | null;
  onWearItem?: (item: MarketplaceItem | null) => void;
  accessToken?: string | null;
}

export function TryOnPanel({
  avatarUrl,
  currentItem,
  wornItem,
  onWearItem,
  accessToken,
}: TryOnPanelProps) {
  const hasSelectedItem = Boolean(currentItem);
  const isWearingSelectedItem = Boolean(currentItem && wornItem?.id === currentItem.id);

  return (
    <section className="y2k-window p-5 flex flex-col gap-4 h-full overflow-hidden">
      <h2
        className="neon-pink text-sm tracking-[0.3em] uppercase"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Virtual Try-On
      </h2>

      <div className="flex-1 flex gap-5 overflow-hidden">
        <aside className="flex flex-col gap-5 pt-2 shrink-0">
          <ToolButton icon={<PersonStanding size={22} />} label="Body" />
          <ToolButton icon={<Shirt size={22} />} label="Closet" />
          <ToolButton icon={<Camera size={22} />} label="Screenshot" />
        </aside>

        <div className="flex-1 relative flex items-end justify-center overflow-hidden rounded-lg bg-black/60 border border-[color:var(--color-fc-border)]">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="your avatar" className="h-full w-auto object-contain" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-white/40 text-sm">
              No avatar yet — generate one from your photos.
            </div>
          )}
          {wornItem?.imageUrl ? (
            <div className="absolute inset-x-6 top-6 bottom-20 pointer-events-none">
              <div className="absolute top-0 right-0 liquid-glass rounded-lg px-3 py-2">
                <p
                  className="text-[10px] uppercase tracking-[0.24em] text-white/55"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Wearing now
                </p>
                <p className="mt-1 max-w-[11rem] text-xs text-white/80 line-clamp-2">
                  {wornItem.name}
                </p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={wornItem.imageUrl}
                  alt={wornItem.name}
                  className="max-h-[70%] max-w-[68%] object-contain opacity-90 drop-shadow-[0_0_28px_rgba(255,38,185,0.22)]"
                />
              </div>
            </div>
          ) : null}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-64 h-10 rounded-full pointer-events-none"
               style={{
                 background:
                   "radial-gradient(ellipse, rgba(201,64,255,0.55) 0%, rgba(201,64,255,0) 70%)",
                 filter: "blur(6px)",
               }}
          />
        </div>

        <aside className="w-64 shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
          <ItemCard
            item={currentItem}
            isWearingSelectedItem={isWearingSelectedItem}
            hasSelectedItem={hasSelectedItem}
            accessToken={accessToken ?? null}
            onToggleWear={() => {
              if (!currentItem) {
                return;
              }
              onWearItem?.(isWearingSelectedItem ? null : currentItem);
            }}
          />
        </aside>
      </div>
    </section>
  );
}

function ToolButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors"
    >
      <span className="w-12 h-12 flex items-center justify-center border border-[color:var(--color-fc-border)] bg-[color:var(--color-fc-panel)] hover:border-[color:var(--color-fc-neon)]">
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

function ItemCard({
  item,
  hasSelectedItem,
  isWearingSelectedItem,
  accessToken,
  onToggleWear,
}: {
  item?: MarketplaceItem | null;
  hasSelectedItem: boolean;
  isWearingSelectedItem: boolean;
  accessToken: string | null;
  onToggleWear: () => void;
}) {
  const [isSavingToCloset, setIsSavingToCloset] = useState(false);
  const [closetSavedItemId, setClosetSavedItemId] = useState<string | null>(null);

  const normalizedSize = item?.size
    ? item.size
        .trim()
        .split(/\s+/)
        .map((part) => part.toUpperCase())
        .join(" ")
    : "--";

  async function handleAddToCloset() {
    if (!item || isSavingToCloset) {
      return;
    }

    try {
      setIsSavingToCloset(true);
      if (!accessToken) {
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
          disabled={!hasSelectedItem}
          className="pill-btn w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSavingToCloset ? "Saving..." : isSavedToCloset ? "Added to closet" : "Add to closet"}
        </button>
        <button
          type="button"
          onClick={onToggleWear}
          disabled={!hasSelectedItem}
          className="pill-btn-ghost w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isWearingSelectedItem ? "Remove item" : "Wear item"}
        </button>
      </div>
    </div>
  );
}
