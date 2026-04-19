"use client";

import { X } from "lucide-react";

import { ScrollReel } from "@/components/ui/ScrollReel";
import type { SavedOutfit } from "@/lib/api/backend";

interface OutfitDetailModalProps {
  outfit: SavedOutfit | null;
  onClose: () => void;
  onShowInTryOn: (outfit: SavedOutfit) => void;
}

export function OutfitDetailModal({
  outfit,
  onClose,
  onShowInTryOn,
}: OutfitDetailModalProps) {
  if (!outfit) return null;

  const angleUrls = outfit.angles
    .map((angle) => angle.image_url)
    .filter((url): url is string => Boolean(url));
  const previewImages = angleUrls.length > 0
    ? angleUrls
    : outfit.cover_image
      ? [outfit.cover_image]
      : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="liquid-glass w-full max-w-4xl h-[85vh] rounded-xl flex flex-col relative overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 text-white/70 hover:text-white"
          aria-label="close"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col lg:flex-row flex-1 min-h-0">
          <div className="flex-1 relative flex items-center justify-center bg-black/60 border-b lg:border-b-0 lg:border-r border-[color:var(--color-fc-border)] min-h-0">
            {previewImages.length > 0 ? (
              <ScrollReel
                className="h-full w-full"
                trackClassName="h-full items-center"
                ariaLabel="outfit angles"
              >
                {previewImages.map((src, idx) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${src}-${idx}`}
                    src={src}
                    alt={`${outfit.name} angle ${idx + 1}`}
                    className="h-full w-full flex-shrink-0 snap-center object-contain"
                  />
                ))}
              </ScrollReel>
            ) : (
              <div className="p-6 text-sm text-white/50 uppercase tracking-[0.15em]">
                No preview available
              </div>
            )}
          </div>

          <aside className="w-full lg:w-[320px] flex flex-col p-5 gap-4 overflow-y-auto">
            <div>
              <p
                className="neon-pink text-[11px] tracking-[0.3em] uppercase"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Saved outfit
              </p>
              <h2
                className="mt-1 text-2xl font-black tracking-tight text-white"
                style={{ fontFamily: "var(--font-retro)" }}
              >
                {outfit.name || "Untitled outfit"}
              </h2>
              <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-white/50">
                {outfit.item_count} {outfit.item_count === 1 ? "item" : "items"}
                {angleUrls.length > 0 ? ` · ${angleUrls.length} angles` : ""}
              </p>
            </div>

            {outfit.items.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p
                  className="text-[10px] tracking-[0.25em] uppercase text-white/45"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Items
                </p>
                <div className="flex flex-col gap-2">
                  {outfit.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 rounded border border-white/10 bg-black/30 p-2"
                    >
                      <div className="h-10 w-10 flex-shrink-0 rounded overflow-hidden bg-white/5">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image}
                            alt={item.item_name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] text-white/90">
                          {item.item_name}
                        </p>
                        {item.category ? (
                          <p className="truncate text-[10px] uppercase tracking-[0.1em] text-white/45">
                            {item.category}
                          </p>
                        ) : null}
                      </div>
                      {item.price != null ? (
                        <span className="text-[11px] uppercase text-white/60">
                          ${item.price}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-auto flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onShowInTryOn(outfit)}
                className="pill-btn w-full"
              >
                Show in Try-On
              </button>
              <p className="text-center text-[10px] uppercase tracking-[0.15em] text-white/40">
                Edit items or render a new fit from the try-on view.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
