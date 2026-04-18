"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { fetchLookbook, type LookbookFit } from "@/lib/api/backend";

interface LookbookPanelProps {
  accessToken?: string | null;
  refreshKey?: number;
}

export function LookbookPanel({ accessToken, refreshKey = 0 }: LookbookPanelProps) {
  const [fits, setFits] = useState<LookbookFit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchLookbook(accessToken);
      setFits(res.fits);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lookbook.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <section className="y2k-window p-5 flex flex-col gap-3 h-full overflow-hidden">
      <div className="flex items-center justify-between">
        <h2
          className="neon-pink text-sm tracking-[0.3em] uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Lookbook
        </h2>
        <button
          type="button"
          onClick={() => void load()}
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

      <div className="flex-1 grid grid-cols-2 gap-3 overflow-y-auto pr-1 min-h-0 content-start auto-rows-max">
        {fits.map((fit) => (
          <a
            key={fit.render_id}
            href={fit.image_url ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="group"
          >
            <div className="relative aspect-[3/4] bg-white/5 border border-[color:var(--color-fc-border)] overflow-hidden rounded-sm group-hover:border-[color:var(--color-fc-hot)] transition-colors">
              {fit.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fit.image_url}
                  alt={fit.name ?? "saved fit"}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/40 uppercase tracking-widest">
                  No image
                </div>
              )}
            </div>
            <p className="mt-2 text-[11px] font-semibold neon-pink line-clamp-1">
              {fit.name ?? "Untitled fit"}
            </p>
            <p className="text-[10px] text-white/55">
              {new Date(fit.created_at).toLocaleDateString()}
            </p>
          </a>
        ))}

        {!loading && fits.length === 0 && !error ? (
          <div className="col-span-2 text-xs text-white/50 border border-white/10 px-3 py-6 text-center">
            No saved fits yet. Render a fit, then hit &quot;Save to lookbook&quot;.
          </div>
        ) : null}
      </div>
    </section>
  );
}
