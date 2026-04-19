"use client";

interface FitDetailsStripProps {
  moodBoard?: string[];
  matchScore?: number;
}

export function FitDetailsStrip({
  moodBoard = ["star sweater", "baggy jeans", "chunky shoes", "silver chain"],
  matchScore = 92,
}: FitDetailsStripProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-[220px_1fr_260px] gap-6 px-6 py-5 items-center">
      {/* Sticky note */}
      <div className="sticky-note rounded-sm p-4 w-full max-w-[220px] text-sm leading-relaxed">
        <p className="text-xl mb-2 uppercase tracking-tight">Y2K GRUNGE</p>
        <ul className="space-y-1">
          {moodBoard.map((m) => (
            <li key={m}>- {m}</li>
          ))}
        </ul>
      </div>

      {/* Polaroid detail shots */}
      <div className="flex items-center justify-center gap-5">
        <p
          className="neon-pink text-[24px] leading-none tracking-[0.12em] uppercase self-start mt-2"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          Fit Details
        </p>
        <div className="polaroid rotate-[-4deg] w-40 aspect-square" />
        <div className="polaroid rotate-[3deg] w-40 aspect-square" />
      </div>

      {/* Fit match */}
      <div className="y2k-window p-4 flex flex-col gap-2">
        <p
          className="neon-pink text-[22px] leading-none tracking-[0.12em] uppercase"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          Fit Match
        </p>
        <p
          className="neon-lime text-5xl font-bold leading-none"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          {matchScore}%
        </p>
        <p className="text-[14px] tracking-[0.08em] text-white/60 uppercase">
          This look hits.
        </p>
        <div className="pixel-bar mt-1">
          <span style={{ width: `${matchScore}%` }} />
        </div>
      </div>
    </section>
  );
}
