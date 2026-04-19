"use client";

import type { MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link2, Sparkles } from "lucide-react";

import type { MarketplaceItem } from "@/components/dashboard/MarketplacePanel";
import { ScrollReel } from "@/components/ui/ScrollReel";
import { addClosetItem, fetchBrowseItems } from "@/lib/api/backend";

interface SuggestionsPanelProps {
  accessToken?: string | null;
  signals: {
    viewed: MarketplaceItem[];
    worn: MarketplaceItem[];
    checkout: MarketplaceItem[];
  };
  onSelectItem?: (item: MarketplaceItem) => void;
  onClosetSaved?: () => void;
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "grailed",
  "size",
  "item",
  "mens",
  "women",
  "womens",
  "menswear",
]);

function pickSuggestionKeywords(items: MarketplaceItem[]) {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    const parts = `${item.name} ${item.category ?? ""}`
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .filter((part) => part.length > 2 && !STOP_WORDS.has(part));

    parts.forEach((part) => {
      counts.set(part, (counts.get(part) ?? 0) + 1);
    });
  });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([term]) => term);
}

export function SuggestionsPanel({
  accessToken = null,
  signals,
  onSelectItem,
  onClosetSaved,
}: SuggestionsPanelProps) {
  const [results, setResults] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSavingSelected, setIsSavingSelected] = useState(false);

  const sourceItems = useMemo(
    () => [...signals.checkout, ...signals.worn, ...signals.viewed],
    [signals]
  );
  const keywordTerms = useMemo(() => pickSuggestionKeywords(sourceItems), [sourceItems]);
  const defaultQuery = keywordTerms.join(" ");
  const activeQuery = defaultQuery;
  const visibleResults = useMemo(() => (activeQuery ? results : []), [activeQuery, results]);
  const visibleError = activeQuery ? error : null;
  const selectedItems = useMemo(
    () => visibleResults.filter((item) => selectedIds.includes(item.id)),
    [selectedIds, visibleResults]
  );
  const selectedIdSet = useMemo(() => new Set(selectedItems.map((item) => item.id)), [selectedItems]);

  useEffect(() => {
    if (!activeQuery) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchBrowseItems(activeQuery);
        if (!cancelled) {
          setResults(
            response.items.map((item) => ({
              id: item.listing_id,
              source: item.source.toUpperCase(),
              name: item.item_name,
              price: item.price,
              category: item.category,
              size: item.size,
              imageUrl: item.image,
              productUrl: item.product_url,
            }))
          );
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setResults([]);
          setError(err instanceof Error ? err.message : "Couldn’t load suggestions right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeQuery]);

  async function handleSaveSelected() {
    if (!accessToken || selectedItems.length === 0 || isSavingSelected) {
      return;
    }

    try {
      setIsSavingSelected(true);
      setError(null);

      await Promise.all(
        selectedItems.map((item) =>
          addClosetItem(accessToken, {
            listing_id: item.id,
            item_name: item.name,
            price: item.price,
            size: item.size ?? null,
            image: item.imageUrl ?? null,
            category: item.category ?? null,
            source: item.source.toLowerCase(),
            product_url: item.productUrl ?? null,
          })
        )
      );

      setSelectedIds([]);
      onClosetSaved?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn’t save selected suggestions.");
    } finally {
      setIsSavingSelected(false);
    }
  }

  function handleItemClick(event: MouseEvent<HTMLButtonElement>, item: MarketplaceItem) {
    const shouldToggleMulti = event.metaKey || event.ctrlKey;

    if (shouldToggleMulti) {
      setSelectedIds((current) =>
        current.includes(item.id)
          ? current.filter((selectedId) => selectedId !== item.id)
          : [...current, item.id]
      );
      return;
    }

    setSelectedIds([]);
    onSelectItem?.(item);
  }

  return (
    <section className="y2k-window flex h-full flex-col gap-4 overflow-hidden p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            className="neon-pink text-[24px] leading-none tracking-[0.12em] uppercase"
            style={{ fontFamily: "var(--font-pixel)" }}
          >
            Suggestions
          </h2>
          <p className="mt-2 text-sm uppercase text-white/45">
            Based on pieces you viewed, wore, or checked out
          </p>
        </div>
      </div>

      {keywordTerms.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {keywordTerms.map((term) => (
            <div
              key={term}
              className="rounded border border-white/10 bg-white/5 px-3 py-1 text-[12px] uppercase tracking-[0.08em] text-white/60"
            >
              {term}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded border border-white/10 bg-black/20 px-4 py-5 text-sm text-white/50">
          Start clicking pieces, wearing them, or checking them out and this tab will build live
          search suggestions from that activity.
        </div>
      )}

      {selectedItems.length > 0 ? (
        <div className="flex items-center justify-between gap-3 rounded border border-[color:var(--color-fc-border)] bg-black/30 px-3 py-2">
          <p className="text-[14px] uppercase tracking-[0.08em] text-white/60">
            {selectedItems.length} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleSaveSelected()}
              disabled={!accessToken || isSavingSelected}
              className="pill-btn disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSavingSelected ? "Saving..." : "Add to Closet"}
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

      {visibleError ? (
        <div className="border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {visibleError}
        </div>
      ) : null}

      <div className="flex items-center justify-between text-[13px] uppercase tracking-[0.08em] text-white/45">
        <span>{activeQuery ? `Auto suggestions for ${activeQuery}` : "Suggested pieces"}</span>
        <span>{loading ? "Loading..." : `${visibleResults.length} items`}</span>
      </div>

      <ScrollReel
        className="min-h-0 flex-1"
        trackClassName="gap-3 pr-1"
        ariaLabel="suggested items"
      >
        {visibleResults.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={(event) => handleItemClick(event, item)}
            className={`group flex-shrink-0 w-[200px] snap-start rounded border bg-black/20 p-2 text-left transition ${
              selectedIdSet.has(item.id)
                ? "border-[color:var(--color-fc-hot)] shadow-[0_0_0_1px_rgba(255,38,185,0.28)]"
                : "border-[color:var(--color-fc-border)] hover:border-[color:var(--color-fc-hot)]"
            }`}
          >
            <div className="relative aspect-square overflow-hidden rounded border border-white/10 bg-white/5">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="absolute inset-0 h-full w-full object-contain bg-neutral-100"
                />
              ) : null}
            </div>
            <div className="space-y-1 pt-2">
              <p className="line-clamp-2 text-[13px] uppercase text-white/90">{item.name}</p>
              {item.category ? (
                <p className="line-clamp-1 text-[11px] uppercase tracking-[0.08em] text-white/45">
                  {item.category}
                </p>
              ) : null}
              <div className="flex items-center justify-between gap-2 text-[12px] uppercase text-white/60">
                <span>{item.price != null ? `$${item.price}` : "--"}</span>
                <span>{item.size ?? "--"}</span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1 text-[11px] uppercase tracking-[0.08em]">
                <span className="flex items-center gap-1 text-white/55">
                  <Sparkles size={12} />
                  Suggested
                </span>
                {item.productUrl ? (
                  <a
                    href={item.productUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="flex items-center gap-1 text-white/55 transition hover:text-white"
                  >
                    <Link2 size={12} />
                    View
                  </a>
                ) : null}
              </div>
            </div>
          </button>
        ))}
      </ScrollReel>
    </section>
  );
}
