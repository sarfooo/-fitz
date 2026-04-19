"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

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
}: {
  accessToken?: string | null;
  version?: number;
  onSelectItem?: (item: MarketplaceItem) => void;
}) {
  const [closetItems, setClosetItems] = useState<ClosetCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

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

  async function handleRemoveItem(closetItemId: string) {
    if (!accessToken || removingId) {
      return;
    }

    try {
      setRemovingId(closetItemId);
      setError(null);
      await deleteClosetItem(accessToken, closetItemId);
      setClosetItems((current) => current.filter((item) => item.id !== closetItemId));
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
        <div className="overflow-x-auto overflow-y-hidden pb-2">
          <div className="flex gap-3 min-w-max">
            {closetItems.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() =>
                  onSelectItem?.({
                    id: item.listingId,
                    source: item.source,
                    name: item.itemName,
                    price: item.price,
                    category: item.category,
                    size: item.size,
                    imageUrl: item.image ?? undefined,
                    productUrl: item.productUrl,
                  })
                }
                className="w-36 shrink-0 liquid-glass overflow-visible rounded-lg p-2 text-left"
                title={item.itemName}
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-md border border-[color:var(--color-fc-border)] bg-gradient-to-br from-neutral-200 to-neutral-500">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.itemName}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleRemoveItem(item.id);
                    }}
                    disabled={removingId === item.id}
                    className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded border border-white/20 bg-black/60 text-white/75 transition hover:text-rose-300 disabled:opacity-50"
                    aria-label={`Remove ${item.itemName} from closet`}
                  >
                    <Trash2 size={14} />
                  </button>
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
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
