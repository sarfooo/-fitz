"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function FooterCtaSection() {
  return (
    <section className="relative py-24 md:py-36 px-6 overflow-hidden text-center">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,38,185,0.18) 0%, transparent 55%)",
        }}
      />
      <motion.h2
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7 }}
        className="chrome-text text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.95] relative"
        style={{ fontFamily: "var(--font-retro)" }}
      >
        FIT CHECK.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="text-white/60 text-base md:text-lg mt-6 max-w-md mx-auto"
      >
        Stop returning things that didn't fit. Start rendering them first.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, delay: 0.45 }}
        className="flex justify-center gap-3 mt-10"
      >
        <Link href="/signup" className="pill-btn">
          Sign up free
        </Link>
        <Link href="/dashboard" className="pill-btn-ghost">
          Try the demo
        </Link>
      </motion.div>
      <p
        className="text-white/30 text-[10px] tracking-[0.35em] uppercase mt-16"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        fitz © {new Date().getFullYear()}
      </p>
    </section>
  );
}
