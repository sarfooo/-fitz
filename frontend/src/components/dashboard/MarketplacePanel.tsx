"use client";

import { Search, Star } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { BrowseItem, fetchBrowseItems } from "@/lib/api/backend";

export interface MarketplaceItem {
  id: string;
  source: string;
  name: string;
  price: number | null;
  category?: string | null;
  size?: string | null;
  imageUrl?: string | null;
  productUrl?: string | null;
}

const PAGE_SIZE = 40;

function mapBrowseItem(item: BrowseItem): MarketplaceItem {
  return {
    id: item.listing_id,
    source: item.source.toUpperCase(),
    name: item.item_name,
    price: item.price,
    category: item.category,
    size: item.size,
    imageUrl: item.image,
    productUrl: item.product_url,
  };
}

interface MarketplacePanelProps {
  selectedItemId?: string | null;
  onSelectItem?: (item: MarketplaceItem) => void;
}

export function MarketplacePanel({
  selectedItemId = null,
  onSelectItem,
}: MarketplacePanelProps) {
  const [query, setQuery] = useState("vetements");
  const [submittedQuery, setSubmittedQuery] = useState("vetements");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      const trimmed = submittedQuery.trim();
      if (!trimmed) {
        if (!cancelled) {
          setItems([]);
          setError(null);
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
        setError(null);
      }

      try {
        const data = await fetchBrowseItems(trimmed, page);
        if (!cancelled) {
          const nextItems = data.items.map(mapBrowseItem);
          setItems(nextItems);
          if (nextItems.length > 0 && !selectedItemId) {
            onSelectItem?.(nextItems[0]);
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load marketplace results.");
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      cancelled = true;
    };
  }, [onSelectItem, page, selectedItemId, submittedQuery]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    setPage(0);
    setSubmittedQuery(trimmed);
  }

  return (
    <section className="y2k-window p-5 flex flex-col gap-4 h-full overflow-hidden">
      <h2
        className="neon-pink text-sm tracking-[0.3em] uppercase"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Marketplace
      </h2>

      <form className="grid grid-cols-[minmax(0,1fr)_112px] gap-2" onSubmit={onSubmit}>
        <div className="min-w-0 flex items-center gap-2 px-3 py-2 bg-[color:var(--color-fc-panel)] border border-[color:var(--color-fc-border)] focus-within:border-[color:var(--color-fc-neon)]">
          <Search size={14} className="text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for pieces..."
            className="flex-1 bg-transparent text-sm placeholder:text-white/40 focus:outline-none"
          />
        </div>
        <button type="submit" className="pill-btn w-full shrink-0" disabled={loading}>
          {loading ? "Loading..." : "Search"}
        </button>
      </form>

      {error ? (
        <div className="text-xs text-rose-300 border border-rose-400/30 bg-rose-500/10 px-3 py-2">
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-between text-[10px] tracking-[0.2em] uppercase text-white/50">
        <span style={{ fontFamily: "var(--font-mono)" }}>
          {loading ? "Loading results..." : `${items.length} items`}
        </span>
        <span style={{ fontFamily: "var(--font-mono)" }}>
          Page {page + 1}
        </span>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-3 overflow-y-auto pr-1 min-h-0 content-start auto-rows-max">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            isSelected={item.id === selectedItemId}
            onSelect={() => onSelectItem?.(item)}
          />
        ))}
        {!loading && !error && items.length === 0 ? (
          <div className="col-span-2 text-xs text-white/50 border border-white/10 px-3 py-4 text-center">
            Search Grailed to load live pieces.
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between pt-1">
        <p className="text-[10px] tracking-[0.2em] text-white/50 uppercase max-w-[50%] truncate" style={{ fontFamily: "var(--font-mono)" }}>
          {submittedQuery ? `Results for ${submittedQuery}` : "Search Grailed"}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={loading || page === 0}
            className="pill-btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={loading || items.length < PAGE_SIZE}
            className="pill-btn disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

function ItemCard({
  item,
  isSelected,
  onSelect,
}: {
  item: MarketplaceItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [saved, setSaved] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className="text-left group cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--color-fc-neon)]"
    >
      <div
        className={`relative aspect-square bg-white/5 border overflow-hidden rounded-sm ${
          isSelected
            ? "border-[color:var(--color-fc-hot)] shadow-[0_0_0_1px_rgba(255,38,185,0.35)]"
            : "border-[color:var(--color-fc-border)]"
        }`}
      >
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="absolute inset-0 h-full w-full object-contain bg-neutral-100"
          />
        ) : null}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setSaved((s) => !s);
          }}
          aria-pressed={saved}
          aria-label={saved ? "Unsave" : "Save"}
          className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center bg-black/60 border border-white/30 rounded"
        >
          <Star
            size={14}
            className={saved ? "fill-[color:var(--color-fc-hot)] text-[color:var(--color-fc-hot)]" : "text-white/80"}
          />
        </button>
      </div>
      <div className="pt-2">
        <p className="text-[11px] font-semibold leading-snug neon-pink line-clamp-1">{item.name}</p>
        {item.category ? (
          <p className="text-[10px] text-white/55 uppercase tracking-[0.16em] mt-1 line-clamp-1">{item.category}</p>
        ) : null}
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-sm text-white/90">
            {item.price != null ? `$${item.price}` : "--"}
          </p>
          {item.size ? <p className="text-[10px] text-white/50 uppercase">Size {item.size}</p> : null}
        </div>
        {item.productUrl ? (
          <a
            href={item.productUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="mt-2 inline-flex text-[10px] tracking-[0.18em] uppercase text-white/55 hover:neon-pink"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            View
          </a>
        ) : null}
      </div>
    </div>
  );
}
