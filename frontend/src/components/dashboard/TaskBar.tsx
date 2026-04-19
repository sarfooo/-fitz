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
      className="flex items-center justify-between border-t border-[#8f84d6] bg-[linear-gradient(180deg,#5c5792_0%,#555287_100%)] px-3 py-1 gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_-1px_0_rgba(30,20,58,0.9)]"
      style={{ fontFamily: "var(--font-pixel)" }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex items-center gap-2 rounded-[4px] px-3 py-1 border border-[#867e9f] bg-[linear-gradient(180deg,#b9b5b3_0%,#8a8787_100%)] text-[0.78rem] tracking-[0.08em] text-black shadow-[inset_1px_1px_0_rgba(255,255,255,0.45),inset_-1px_-1px_0_rgba(0,0,0,0.28)]"
        >
          <span className="relative inline-block h-3.5 w-3.5 rotate-[-10deg] shadow-[0_0_0_1px_rgba(0,0,0,0.18)]">
            <span className="absolute left-0 top-0 h-[45%] w-[45%] bg-[#f05b8d]" />
            <span className="absolute right-0 top-0 h-[45%] w-[45%] bg-[#79d7ff]" />
            <span className="absolute bottom-0 left-0 h-[45%] w-[45%] bg-[#6ed36f]" />
            <span className="absolute bottom-0 right-0 h-[45%] w-[45%] bg-[#ffd75a]" />
          </span>
          START
        </button>
        <div className="min-w-[164px] rounded-[4px] border border-[#af67c8] bg-[linear-gradient(180deg,#dd75d6_0%,#cb5cc2_100%)] px-4 py-1 text-[0.88rem] tracking-[0.04em] text-[#240818] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
          FITCHECK.EXE
        </div>
      </div>

      <div className="flex items-center gap-3 pr-2 text-[0.88rem] text-white/90">
        <span className="tabular-nums">{time}</span>
        <Wifi size={13} strokeWidth={1.8} />
        <Volume2 size={13} strokeWidth={1.8} />
      </div>
    </footer>
  );
}
