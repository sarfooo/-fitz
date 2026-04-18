"use client";

import { Volume2, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

export function TaskBar() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hh = ((now.getHours() + 11) % 12) + 1;
      const mm = now.getMinutes().toString().padStart(2, "0");
      const ampm = now.getHours() < 12 ? "AM" : "PM";
      setTime(`${hh}:${mm} ${ampm}`);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer
      className="flex items-center justify-between border-t border-[color:var(--color-fc-border)] bg-[color:var(--color-fc-panel)] px-2 py-1 gap-2"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-1 bg-gradient-to-b from-[color:var(--color-fc-panel-raised)] to-[color:var(--color-fc-panel)] border border-white/15 text-xs font-semibold tracking-widest"
        >
          <span className="inline-block w-3 h-3 bg-[conic-gradient(from_0deg,#ff26b9,#c940ff,#5df9ff,#72ff6b,#ff26b9)] rounded-sm" />
          START
        </button>
        <div className="pill-btn text-[10px] py-1">FITZ.EXE</div>
      </div>
      <div className="flex items-center gap-3 pr-3 text-xs text-white/70">
        <Wifi size={12} />
        <Volume2 size={12} />
        <span className="tabular-nums">{time}</span>
      </div>
    </footer>
  );
}
