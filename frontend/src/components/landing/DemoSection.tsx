"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";

const ANGLES = [
  { label: "LEFT", src: "/angles/left.png", rotate: -4 },
  { label: "L.3/4", src: "/angles/left_three_quarter.png", rotate: -2 },
  { label: "FRONT", src: "/angles/front.png", rotate: 0 },
  { label: "R.3/4", src: "/angles/right_three_quarter.png", rotate: 2 },
  { label: "RIGHT", src: "/angles/right.png", rotate: 4 },
];

export function DemoSection() {
  const ref = useRef<HTMLElement | null>(null);
  // Parallax drift so the row feels "alive" as you scroll into it.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const rowX = useTransform(scrollYProgress, [0, 1], ["5%", "-5%"]);

  return (
    <section
      id="demo"
      ref={ref}
      className="relative py-24 md:py-36 px-6 bg-black overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_rgba(201,64,255,0.08)_0%,_transparent_60%)]" />
      <div className="max-w-6xl mx-auto relative z-10 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="neon-pink text-xs tracking-[0.4em] uppercase mb-4"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          See the fit from every angle
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-14 text-white"
          style={{ fontFamily: "var(--font-retro)" }}
        >
          FIVE ANGLES.
          <br />ONE OUTFIT.
        </motion.h2>

        <motion.div
          style={{ x: rowX }}
          className="flex items-end justify-center gap-2 md:gap-5 flex-wrap"
        >
          {ANGLES.map((a, i) => (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.08 }}
              className="liquid-glass rounded-2xl p-2"
              style={{ transform: `rotate(${a.rotate}deg)` }}
            >
              <div className="relative w-32 h-48 md:w-44 md:h-64 rounded-xl overflow-hidden bg-black">
                <Image
                  src={a.src}
                  alt={`avatar ${a.label}`}
                  fill
                  sizes="(max-width: 768px) 128px, 176px"
                  className="object-cover"
                />
                <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-black to-transparent" />
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] md:text-[10px] tracking-[0.35em] text-white/70"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {a.label}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-white/50 text-sm mt-10 max-w-xl mx-auto"
        >
          Each frame is a fresh render locked to your identity and outfit.
          Scrub them like a lookbook. No video needed.
        </motion.p>
      </div>
    </section>
  );
}
