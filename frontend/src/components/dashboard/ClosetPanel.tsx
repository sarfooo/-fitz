"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { fetchClosetItems, fetchOutfits } from "@/lib/api/backend";

type ClosetCardItem = {
  id: string;
  image: string | null;
  itemName: string;
};

type OutfitCard = {
  id: string;
  name: string;
  count: number;
  previewUrl: string | null;
};

export function ClosetPanel({ accessToken = null }: { accessToken?: string | null }) {
  const [closetItems, setClosetItems] = useState<ClosetCardItem[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<OutfitCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCloset() {
      setLoading(true);
      setError(null);
      try {
        if (!accessToken) {
          if (!cancelled) {
            setClosetItems([]);
            setSavedOutfits([]);
            setLoading(false);
          }
          return;
        }

        const [closetResponse, outfitsResponse] = await Promise.all([
          fetchClosetItems(accessToken),
          fetchOutfits(accessToken),
        ]);

        if (cancelled) {
          return;
        }

        setClosetItems(
          closetResponse.items.map((item) => ({
            id: item.id,
            image: item.image,
            itemName: item.item_name,
          }))
        );
        setSavedOutfits(
          outfitsResponse.outfits.map((outfit) => ({
            id: outfit.id,
            name: outfit.name,
            count: outfit.item_count,
            previewUrl: outfit.cover_image,
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
  }, [accessToken]);

  return (
    <section className="y2k-window p-5 flex flex-col gap-5 h-full overflow-y-auto">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="neon-pink text-sm tracking-[0.3em] uppercase"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            My Closet
          </h2>
          <button
            type="button"
            className="text-[10px] tracking-[0.25em] text-white/60 hover:text-white"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            VIEW ALL
          </button>
        </div>
        <p
          className="text-[10px] tracking-[0.25em] text-white/50 uppercase mb-3"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {loading ? "Loading..." : `${closetItems.length} items`}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {closetItems.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="relative aspect-square bg-gradient-to-br from-neutral-300 to-neutral-500 border border-[color:var(--color-fc-border)] overflow-hidden"
              title={item.itemName}
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
          ))}
          {!loading && closetItems.length === 0 ? (
            <div className="col-span-2 text-xs text-white/50 border border-white/10 px-3 py-4 text-center">
              Your saved pieces will show up here.
            </div>
          ) : null}
        </div>
      </div>

      <div className="y2k-divider" />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3
            className="neon-pink text-sm tracking-[0.3em] uppercase"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Saved Outfits
          </h3>
          <button
            type="button"
            className="text-[10px] tracking-[0.25em] text-white/80 hover:text-white flex items-center gap-1"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <Plus size={10} /> NEW FIT
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {error ? (
            <div className="text-xs text-rose-300 border border-rose-400/30 bg-rose-500/10 px-3 py-2">
              {error}
            </div>
          ) : null}
          {savedOutfits.map((o) => (
            <button
              type="button"
              key={o.id}
              className="liquid-glass rounded-lg p-2 text-left group"
            >
              <div className="relative aspect-[3/4] bg-gradient-to-b from-purple-950/40 to-black border border-[color:var(--color-fc-border)] overflow-hidden">
                {o.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={o.previewUrl}
                    alt={o.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="p-2">
                <p className="text-sm font-semibold uppercase tracking-wide">{o.name}</p>
                <p className="text-[10px] text-white/50 tracking-widest uppercase">{o.count} items</p>
              </div>
            </button>
          ))}
          {!loading && savedOutfits.length === 0 ? (
            <div className="text-xs text-white/50 border border-white/10 px-3 py-4 text-center">
              Saved outfits will appear here once the backend is connected.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
