"use client";

import { useState } from "react";
import { Camera, PersonStanding, Shirt } from "lucide-react";

import type { MarketplaceItem } from "@/components/dashboard/MarketplacePanel";
import { addClosetItem } from "@/lib/api/backend";

interface TryOnPanelProps {
  avatarUrl?: string;
  currentItem?: MarketplaceItem | null;
  wornItems?: MarketplaceItem[];
  onToggleWearItem?: (item: MarketplaceItem) => void;
  accessToken?: string | null;
  onClosetSaved?: () => void;
}

export function TryOnPanel({
  avatarUrl,
  currentItem,
  wornItems = [],
  onToggleWearItem,
  accessToken,
  onClosetSaved,
}: TryOnPanelProps) {
  const hasSelectedItem = Boolean(currentItem);
  const isWearingSelectedItem = Boolean(
    currentItem && wornItems.some((item) => item.id === currentItem.id)
  );

  return (
    <section className="y2k-window p-5 flex flex-col gap-4 h-full overflow-hidden">
      <h2
        className="neon-pink text-[24px] leading-none tracking-[0.12em] uppercase"
        style={{ fontFamily: "var(--font-pixel)" }}
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
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-64 h-10 rounded-full pointer-events-none"
               style={{
                 background:
                   "radial-gradient(ellipse, rgba(201,64,255,0.55) 0%, rgba(201,64,255,0) 70%)",
                 filter: "blur(6px)",
               }}
          />

          <div
            className={`absolute right-5 top-5 bottom-5 w-[18.5rem] max-w-[36%] flex items-start transition-all duration-300 ease-out ${
              currentItem
                ? "translate-x-0 opacity-100"
                : "translate-x-6 opacity-0 pointer-events-none"
            }`}
            data-selection-anchor="true"
          >
            <ItemCard
              item={currentItem}
              hasSelectedItem={hasSelectedItem}
              isWearingSelectedItem={isWearingSelectedItem}
              accessToken={accessToken ?? null}
              onClosetSaved={onClosetSaved}
              onToggleWear={() => {
                if (!currentItem) {
                  return;
                }
                onToggleWearItem?.(currentItem);
              }}
            />
          </div>
        </div>

        <aside className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
          <WornItemsPanel
            wornItems={wornItems}
            onToggleWearItem={onToggleWearItem}
          />
        </aside>
      </div>
    </section>
  );
}

function WornItemsPanel({
  wornItems,
  onToggleWearItem,
}: {
  wornItems: MarketplaceItem[];
  onToggleWearItem?: (item: MarketplaceItem) => void;
}) {
  return (
    <div className="liquid-glass overflow-hidden rounded-lg p-4 flex flex-col gap-3">
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
        <div className="flex flex-col gap-3 max-h-[19rem] overflow-y-auto pr-1">
          {wornItems.map((item) => (
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
                <p className="text-[0.9rem] uppercase text-white/50">{item.source}</p>
                <p className="text-[1rem] leading-5 text-white/85 break-words">{item.name}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[0.9rem] text-white/55">
                    {item.price != null ? `$${item.price}` : "--"}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleWearItem?.(item)}
                    className="pill-btn-ghost px-3 py-1 text-[0.8rem]"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {wornItems.length > 0 ? (
        <button
          type="button"
          className="w-full border border-[#ff7ddd] bg-[linear-gradient(180deg,#f08be4_0%,#d960cf_100%)] px-4 py-3 text-[1.1rem] uppercase text-[#22061e] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0_18px_rgba(255,38,185,0.15)]"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          Render Outfit
        </button>
      ) : null}
    </div>
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
        style={{ fontFamily: "var(--font-pixel)" }}
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
  onClosetSaved,
  onToggleWear,
}: {
  item?: MarketplaceItem | null;
  hasSelectedItem: boolean;
  isWearingSelectedItem: boolean;
  accessToken: string | null;
  onClosetSaved?: () => void;
  onToggleWear: () => void;
}) {
  const [isSavingToCloset, setIsSavingToCloset] = useState(false);
  const [closetSavedItemId, setClosetSavedItemId] = useState<string | null>(null);
  const [closetError, setClosetError] = useState<string | null>(null);

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
          onClick={onToggleWear}
          disabled={!hasSelectedItem}
          className="w-full border border-white/22 bg-transparent px-4 py-3 text-[1.05rem] uppercase text-white/88 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          {isWearingSelectedItem ? "Remove item" : "Wear item"}
        </button>
        {closetError ? (
          <p className="text-[0.82rem] text-rose-300">{closetError}</p>
        ) : null}
      </div>
    </div>
  );
}
