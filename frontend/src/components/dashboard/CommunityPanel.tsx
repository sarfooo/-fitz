"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";

import type { MarketplaceItem } from "@/components/dashboard/MarketplacePanel";
import { fetchCommunityOutfits, type CommunityOutfit } from "@/lib/api/backend";

interface CommunityPanelProps {
  accessToken?: string | null;
  onSelectOutfit?: (items: MarketplaceItem[]) => void;
}

function mapCommunityOutfitItems(outfit: CommunityOutfit): MarketplaceItem[] {
  return outfit.items.map((item) => ({
    id: item.listing_id,
    source: item.source.toUpperCase(),
    name: item.item_name,
    price: item.price,
    category: item.category,
    size: item.size,
    imageUrl: item.image,
    productUrl: item.product_url,
  }));
}

function shuffleOutfits(outfits: CommunityOutfit[]) {
  const next = [...outfits];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

async function loadCommunityOutfits(accessToken: string) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetchCommunityOutfits(accessToken);
      return shuffleOutfits(response.outfits);
    } catch (err) {
      lastError = err;
      if (attempt === 0) {
        await new Promise((resolve) => window.setTimeout(resolve, 500));
      }
    }
  }

  throw lastError;
}

export function CommunityPanel({ accessToken, onSelectOutfit }: CommunityPanelProps) {
  const [outfits, setOutfits] = useState<CommunityOutfit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await loadCommunityOutfits(accessToken);
        if (!cancelled) {
          setOutfits(response);
        }
      } catch {
        if (!cancelled) {
          setOutfits([]);
          setError("Couldn’t load community right now. Try refresh in a sec.");
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
  }, [accessToken]);

  async function handleRefresh() {
    if (!accessToken) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await loadCommunityOutfits(accessToken);
      setOutfits(response);
    } catch {
      setOutfits([]);
      setError("Couldn’t load community right now. Try refresh in a sec.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query.trim().toLowerCase());
  }

  const filteredOutfits = useMemo(() => {
    if (!submittedQuery) {
      return outfits;
    }

    return outfits.filter((outfit) => {
      const haystack = [
        outfit.name,
        outfit.username,
        outfit.display_name,
        ...outfit.items.map((item) => item.item_name),
        ...outfit.items.map((item) => item.category),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(submittedQuery);
    });
  }, [outfits, submittedQuery]);

  return (
    <section className="y2k-window p-5 flex h-full flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2
            className="neon-pink text-[24px] leading-none tracking-[0.12em] uppercase"
            style={{ fontFamily: "var(--font-pixel)" }}
          >
            Community
          </h2>
          <p className="mt-2 text-sm uppercase text-white/45">
            Looks from other users on Fitz
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleRefresh()}
          className="text-white/60 hover:text-white"
          aria-label="refresh community"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <form
        onSubmit={handleSearch}
        className="grid grid-cols-[minmax(0,1fr)_112px] gap-2"
      >
        <div className="min-w-0 flex items-center gap-2 px-3 py-2 bg-[color:var(--color-fc-panel)] border border-[color:var(--color-fc-border)] focus-within:border-[color:var(--color-fc-neon)]">
          <Search size={14} className="text-white/40" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search looks"
            className="min-w-0 flex-1 bg-transparent text-[18px] placeholder:text-[16px] placeholder:text-white/40 focus:outline-none"
          />
        </div>
        <button type="submit" className="pill-btn w-full shrink-0" disabled={loading}>
          Search
        </button>
      </form>

      {error ? (
        <div className="text-xs text-rose-300 border border-rose-400/30 bg-rose-500/10 px-3 py-2">
          {error}
        </div>
      ) : null}

      {!loading && filteredOutfits.length === 0 && !error ? (
        <div className="border border-white/10 bg-black/20 px-4 py-6 text-center text-sm text-white/50">
          {submittedQuery ? "No community outfits matched that search." : "No community outfits yet."}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden pb-2">
          <div className="flex min-w-max gap-3">
            {filteredOutfits.map((outfit) => (
              <button
                key={outfit.id}
                type="button"
                onClick={() => onSelectOutfit?.(mapCommunityOutfitItems(outfit))}
                className="group w-48 shrink-0 text-left rounded-lg border border-[color:var(--color-fc-border)] bg-[linear-gradient(180deg,rgba(15,9,22,0.94)_0%,rgba(7,4,12,0.98)_100%)] p-2 hover:border-[color:var(--color-fc-hot)] transition-colors"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="min-w-0 text-[11px] uppercase text-white line-clamp-1">
                    @{outfit.username}
                  </p>
                  <p className="text-[10px] uppercase text-white/35 shrink-0">
                    {outfit.item_count} items
                  </p>
                </div>
                <div className="relative aspect-[3/4] overflow-hidden rounded-md border border-white/10 bg-white/5">
                  {outfit.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={outfit.cover_image}
                      alt={outfit.name || "community outfit"}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-widest text-white/40">
                      No image
                    </div>
                  )}
                </div>
                <div className="pt-2 space-y-1">
                  <p className="text-[12px] uppercase text-white/88 line-clamp-1">
                    {outfit.name || "Untitled outfit"}
                  </p>
                  <p className="text-[10px] uppercase text-white/45 line-clamp-1">
                    {outfit.display_name ? `by ${outfit.display_name}` : "community look"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
