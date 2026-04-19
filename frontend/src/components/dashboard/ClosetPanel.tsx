"use client";

import { Trash2 } from "lucide-react";
import { MouseEvent, useEffect, useMemo, useState } from "react";

import type { MarketplaceItem } from "@/components/dashboard/MarketplacePanel";
import { deleteClosetItem, fetchClosetItems } from "@/lib/api/backend";

type ClosetCardItem = {
  id: string;
  listingId: string;
  image: string | null;
  itemName: string;
  source: string;
  price: number | null;
  size: string | null;
  category: string | null;
  productUrl: string | null;
};

export function ClosetPanel({
  accessToken = null,
  version = 0,
  onSelectItem,
  onWearItems,
  onCheckoutItems,
}: {
  accessToken?: string | null;
  version?: number;
  onSelectItem?: (item: MarketplaceItem) => void;
  onWearItems?: (items: MarketplaceItem[]) => void;
  onCheckoutItems?: (items: MarketplaceItem[]) => void;
}) {
  const [closetItems, setClosetItems] = useState<ClosetCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadCloset() {
      setLoading(true);
      setError(null);
      try {
        if (!accessToken) {
          if (!cancelled) {
            setClosetItems([]);
            setLoading(false);
          }
          return;
        }

        const closetResponse = await fetchClosetItems(accessToken);

        if (cancelled) {
          return;
        }

        setClosetItems(
          closetResponse.items.map((item) => ({
            id: item.id,
            listingId: item.listing_id,
            image: item.image,
            itemName: item.item_name,
            source: item.source.toUpperCase(),
            price: item.price,
            size: item.size,
            category: item.category ?? null,
            productUrl: item.product_url ?? null,
          }))
        );
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load closet data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCloset();

    return () => {
      cancelled = true;
    };
  }, [accessToken, version]);

  const selectedItems = useMemo(
    () => closetItems.filter((item) => selectedIds.includes(item.id)),
    [closetItems, selectedIds]
  );
  const selectedIdSet = useMemo(() => new Set(selectedItems.map((item) => item.id)), [selectedItems]);

  function mapClosetItem(item: ClosetCardItem): MarketplaceItem {
    return {
      id: item.listingId,
      source: item.source,
      name: item.itemName,
      price: item.price,
      category: item.category,
      size: item.size,
      imageUrl: item.image ?? undefined,
      productUrl: item.productUrl,
    };
  }

  function handleCardClick(event: MouseEvent<HTMLButtonElement>, item: ClosetCardItem) {
    const shouldToggleMulti = event.metaKey || event.ctrlKey;

    if (shouldToggleMulti) {
      setSelectedIds((current) =>
        current.includes(item.id)
          ? current.filter((selectedId) => selectedId !== item.id)
          : [...current, item.id]
      );
      return;
    }

    setSelectedIds([item.id]);
    onSelectItem?.(mapClosetItem(item));
  }

  async function handleRemoveItem(closetItemId: string) {
    if (!accessToken || removingId) {
      return;
    }

    try {
      setRemovingId(closetItemId);
      setError(null);
      await deleteClosetItem(accessToken, closetItemId);
      setClosetItems((current) => current.filter((item) => item.id !== closetItemId));
      setSelectedIds((current) => current.filter((itemId) => itemId !== closetItemId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove closet item.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section className="y2k-window p-5 flex flex-col gap-4 h-full overflow-hidden">
      <div className="flex items-center justify-between">
        <h2
          className="neon-pink text-[24px] leading-none tracking-[0.12em] uppercase"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          My Closet
        </h2>
        <p
          className="text-[14px] tracking-[0.08em] text-white/50 uppercase"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          {loading ? "Loading..." : `${closetItems.length} items`}
        </p>
      </div>

      {selectedItems.length > 0 ? (
        <div className="flex items-center justify-between gap-3 rounded border border-[color:var(--color-fc-border)] bg-black/30 px-3 py-2">
          <p className="text-[14px] uppercase tracking-[0.08em] text-white/60">
            {selectedItems.length} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onWearItems?.(selectedItems.map(mapClosetItem));
                setSelectedIds([]);
              }}
              className="pill-btn"
            >
              Wear Selected
            </button>
            <button
              type="button"
              onClick={() => {
                onCheckoutItems?.(selectedItems.map(mapClosetItem));
                setSelectedIds([]);
              }}
              className="pill-btn-ghost"
            >
              Checkout
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-[13px] uppercase text-white/50 transition hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="text-xs text-rose-300 border border-rose-400/30 bg-rose-500/10 px-3 py-2">
          {error}
        </div>
      ) : null}

      {!loading && closetItems.length === 0 ? (
        <div className="text-xs text-white/50 border border-white/10 px-3 py-4 text-center">
          Items you save from marketplace will show up here.
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-hidden pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-3 min-w-max">
            {closetItems.map((item) => (
              <div
                key={item.id}
                className="relative w-36 shrink-0 liquid-glass overflow-visible rounded-lg p-2"
              >
                <button
                  type="button"
                    onClick={(event) => handleCardClick(event, item)}
                    className={`block w-full rounded text-left transition ${
                    selectedIdSet.has(item.id)
                      ? "shadow-[0_0_0_1px_rgba(255,77,196,0.45)]"
                      : ""
                  }`}
                  title={item.itemName}
                >
                  <div
                    className={`relative aspect-[3/4] overflow-hidden rounded-md border bg-gradient-to-br from-neutral-200 to-neutral-500 ${
                      selectedIdSet.has(item.id)
                        ? "border-[color:var(--color-fc-hot)]"
                        : "border-[color:var(--color-fc-border)]"
                    }`}
                  >
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.itemName}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="pt-2 space-y-1">
                    <p className="text-[14px] tracking-[0.08em] text-white/45 uppercase">
                      {item.source}
                    </p>
                    <p className="text-[18px] leading-tight text-white/85 line-clamp-2">
                      {item.itemName}
                    </p>
                    <div className="flex items-center justify-between gap-2 text-[14px] uppercase text-white/55">
                      <span>{item.price != null ? `$${item.price}` : "--"}</span>
                      <span>{item.size ?? "--"}</span>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleRemoveItem(item.id);
                  }}
                  disabled={removingId === item.id}
                  className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded border border-white/20 bg-black/60 text-white/75 transition hover:text-rose-300 disabled:opacity-50"
                  aria-label={`Remove ${item.itemName} from closet`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
