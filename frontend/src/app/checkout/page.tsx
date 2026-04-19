"use client";

import Link from "next/link";
import { ExternalLink, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";

import type { MarketplaceItem } from "@/components/dashboard/MarketplacePanel";

const CHECKOUT_STORAGE_KEY = "fitz-checkout-selection-v1";

function getGrailedUrl(item: MarketplaceItem) {
  return item.productUrl ?? `https://www.grailed.com/listings/${item.id}`;
}

export default function CheckoutPage() {
  const [items] = useState<MarketplaceItem[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const raw = window.sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as MarketplaceItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      window.sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
      return [];
    }
  });

  const total = useMemo(
    () => items.reduce((sum, item) => sum + (item.price ?? 0), 0),
    [items]
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(72,24,84,0.3),transparent_30%),linear-gradient(180deg,#09070d_0%,#050308_100%)] px-6 py-8 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[14px] uppercase tracking-[0.1em] text-white/45">Checkout</p>
            <h1
              className="mt-2 text-[28px] uppercase tracking-[0.12em] text-[#f18de4]"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              Selected Pieces
            </h1>
          </div>
          <Link href="/dashboard" className="pill-btn-ghost">
            Back to dashboard
          </Link>
        </div>

        <section className="y2k-window flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-white/70">
              <ShoppingBag size={16} />
              <p className="text-[14px] uppercase tracking-[0.08em]">
                {items.length} item{items.length === 1 ? "" : "s"} ready
              </p>
            </div>
            <p className="text-[14px] uppercase tracking-[0.08em] text-white/55">
              Total {total > 0 ? `$${total}` : "--"}
            </p>
          </div>

          {items.length === 0 ? (
            <div className="rounded border border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-white/50">
              No items selected yet. Go back to Closet and hit checkout on the pieces you want.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded border border-[color:var(--color-fc-border)] bg-black/25 p-3"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded border border-white/10 bg-white/5">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="absolute inset-0 h-full w-full object-contain bg-neutral-100"
                      />
                    ) : null}
                  </div>
                  <div className="space-y-2 pt-3">
                    <p className="text-[16px] uppercase tracking-[0.04em] text-white/90">
                      {item.name}
                    </p>
                    <div className="flex items-center justify-between gap-2 text-[13px] uppercase text-white/55">
                      <span>{item.category ?? item.source}</span>
                      <span>{item.size ?? "--"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[18px] text-white/90">
                        {item.price != null ? `$${item.price}` : "--"}
                      </p>
                      <a
                        href={getGrailedUrl(item)}
                        target="_blank"
                        rel="noreferrer"
                        className="pill-btn inline-flex items-center gap-2"
                      >
                        Buy
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
