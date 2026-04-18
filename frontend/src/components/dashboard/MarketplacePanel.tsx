"use client";

import { Search, Star } from "lucide-react";
import { useState } from "react";

interface MarketplaceItem {
  id: string;
  brand: string;
  name: string;
  price: number;
  imageUrl?: string;
}

const SAMPLE_ITEMS: MarketplaceItem[] = [
  { id: "1", brand: "Vetements", name: "Star Knit Sweater", price: 280 },
  { id: "2", brand: "Jaded London", name: "Colossus Jeans", price: 190 },
  { id: "3", brand: "Ed Hardy", name: "Graphic Tee", price: 95 },
  { id: "4", brand: "Diesel", name: "Leather Jacket", price: 350 },
  { id: "5", brand: "Tripp NYC", name: "Bondage Pants", price: 140 },
  { id: "6", brand: "Vintage", name: "Fur Hoodie", price: 120 },
];

const CATEGORIES = ["ALL", "TOPS", "BOTTOMS", "OUTERWEAR"] as const;
type Category = (typeof CATEGORIES)[number];

export function MarketplacePanel() {
  const [source, setSource] = useState<"GRAILED" | "MERCARI">("GRAILED");
  const [category, setCategory] = useState<Category>("ALL");
  const [query, setQuery] = useState("");

  return (
    <section className="y2k-window p-5 flex flex-col gap-4 h-full overflow-hidden">
      <h2
        className="neon-pink text-sm tracking-[0.3em] uppercase"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Marketplace
      </h2>

      <div className="flex gap-2">
        {(["GRAILED", "MERCARI"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSource(s)}
            className={`text-xs tracking-[0.2em] font-semibold px-3 py-1.5 border transition-colors ${
              s === source
                ? "neon-pink border-[color:var(--color-fc-hot)] bg-[color:var(--color-fc-hot)]/10"
                : "text-white/50 border-white/15 hover:border-white/30"
            }`}
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-[color:var(--color-fc-panel)] border border-[color:var(--color-fc-border)] focus-within:border-[color:var(--color-fc-neon)]">
          <Search size={14} className="text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for pieces..."
            className="flex-1 bg-transparent text-sm placeholder:text-white/40 focus:outline-none"
          />
        </div>
        <button type="button" className="pill-btn">
          Search
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`text-[10px] tracking-[0.2em] font-semibold px-3 py-1 rounded-full transition-colors ${
              c === category
                ? "pill-btn"
                : "pill-btn-ghost"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-1">
        {SAMPLE_ITEMS.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function ItemCard({ item }: { item: MarketplaceItem }) {
  const [saved, setSaved] = useState(false);
  return (
    <div className="text-left group">
      <div className="relative aspect-square bg-gradient-to-br from-neutral-300 to-neutral-500 border border-[color:var(--color-fc-border)] overflow-hidden">
        <button
          type="button"
          onClick={() => setSaved((s) => !s)}
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
      <p className="text-xs font-semibold mt-2 neon-pink">{item.brand}</p>
      <p className="text-xs text-white/80">{item.name}</p>
      <p className="text-xs text-white/60">${item.price}</p>
    </div>
  );
}
