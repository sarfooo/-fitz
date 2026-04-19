"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { fetchOutfits, type SavedOutfit } from "@/lib/api/backend";

interface LookbookPanelProps {
  accessToken?: string | null;
  refreshKey?: number;
  onSelectOutfit?: (outfit: SavedOutfit) => void;
}

export function LookbookPanel({
  accessToken,
  refreshKey = 0,
  onSelectOutfit,
}: LookbookPanelProps) {
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchOutfits(accessToken);
        if (!cancelled) {
          setOutfits(res.outfits);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load outfits.");
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
  }, [accessToken, refreshKey]);

  async function handleRefresh() {
    if (!accessToken) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOutfits(accessToken);
      setOutfits(res.outfits);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load outfits.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="y2k-window p-5 flex flex-col gap-3 h-full overflow-hidden">
      <div className="flex items-center justify-between">
        <h2
          className="neon-pink text-sm tracking-[0.3em] uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Outfits
        </h2>
        <button
          type="button"
          onClick={() => void handleRefresh()}
          className="text-white/60 hover:text-white"
          aria-label="refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {error ? (
        <div className="text-xs text-rose-300 border border-rose-400/30 bg-rose-500/10 px-3 py-2">
          {error}
        </div>
      ) : null}

      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pr-1 min-h-0 content-start auto-rows-max">
        {outfits.map((outfit) => (
          <button
            key={outfit.id}
            type="button"
            onClick={() => onSelectOutfit?.(outfit)}
            className="group text-left"
          >
            <div className="relative aspect-[4/5] bg-white/5 border border-[color:var(--color-fc-border)] overflow-hidden rounded-sm group-hover:border-[color:var(--color-fc-hot)] transition-colors">
              {outfit.cover_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={outfit.cover_image}
                  alt={outfit.name || "saved outfit"}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/40 uppercase tracking-widest">
                  No image
                </div>
              )}
            </div>
            <p className="mt-2 text-[10px] font-semibold neon-pink line-clamp-1">
              {outfit.name || "Untitled outfit"}
            </p>
            <p className="text-[9px] text-white/55">
              {outfit.item_count} items
            </p>
          </button>
        ))}

        {!loading && outfits.length === 0 && !error ? (
          <div className="col-span-full flex min-h-[14rem] items-center justify-center text-xs text-white/50 border border-white/10 px-3 py-6 text-center">
            No saved outfits yet. Wear some pieces, then hit &quot;Save Outfit&quot;.
          </div>
        ) : null}
      </div>
    </section>
  );
}
