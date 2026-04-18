"use client";

import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Globe, Instagram, Twitter } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const FRAME_COUNT = 162;
const frameSrc = (i: number): string =>
  `/hero_frames/frame_${String(i + 1).padStart(4, "0")}.webp`;

export function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const pendingFrameRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const [firstReady, setFirstReady] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const images = imagesRef.current;
    const clamped = Math.max(0, Math.min(images.length - 1, index));
    let img = images[clamped];
    // If the exact frame isn't loaded yet, walk backward to the nearest loaded one.
    if (!img || !img.complete || img.naturalWidth === 0) {
      for (let i = clamped - 1; i >= 0; i--) {
        const candidate = images[i];
        if (candidate && candidate.complete && candidate.naturalWidth > 0) {
          img = candidate;
          break;
        }
      }
    }
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const bufW = Math.max(1, Math.round(rect.width * dpr));
    const bufH = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== bufW || canvas.height !== bufH) {
      canvas.width = bufW;
      canvas.height = bufH;
    }

    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.min(canvas.width / iw, canvas.height / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (canvas.width - dw) / 2;
    const dy = (canvas.height - dh) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, dx, dy, dw, dh);
  }, []);

  // Preload every frame. Parallel fetch — browser throttles to ~6 per origin anyway.
  useEffect(() => {
    const imgs: HTMLImageElement[] = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = frameSrc(i);
      if (i === 0) {
        img.onload = () => {
          setFirstReady(true);
          drawFrame(0);
        };
      }
      imgs.push(img);
    }
    imagesRef.current = imgs;
    return () => {
      for (const img of imgs) img.onload = null;
    };
  }, [drawFrame]);

  // rAF-throttled scroll → frame binding.
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const t = Math.max(0, Math.min(1, p));
    pendingFrameRef.current = Math.round(t * (FRAME_COUNT - 1));
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        drawFrame(pendingFrameRef.current);
      });
    }
  });

  // Redraw on resize so the canvas buffer tracks DPR + layout.
  useEffect(() => {
    const onResize = () => drawFrame(pendingFrameRef.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [drawFrame]);

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: "260vh" }}
    >
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col bg-black">
        <motion.canvas
          ref={canvasRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: firstReady ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 w-full h-full"
          style={{
            // Feather the frame edges into the page's black so the studio
            // backdrop doesn't read as a visible rectangle.
            maskImage:
              "radial-gradient(ellipse 55% 75% at 50% 50%, #000 45%, rgba(0,0,0,0.85) 65%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 55% 75% at 50% 50%, #000 45%, rgba(0,0,0,0.85) 65%, transparent 100%)",
          }}
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.9) 100%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-20 scanlines"
          aria-hidden
        />

        <nav className="relative z-20 px-6 py-5">
          <div className="liquid-glass rounded-full mx-auto flex items-center justify-between max-w-5xl px-6 py-3">
            <div className="flex items-center gap-3">
              <Globe size={20} className="text-white" />
              <span className="text-white font-semibold text-lg tracking-tight">
                fitz
              </span>
              <div className="hidden md:flex items-center gap-6 ml-6 text-sm text-white/70">
                <Link href="#how" className="hover:text-white">How</Link>
                <Link href="#demo" className="hover:text-white">Demo</Link>
                <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/signup" className="text-sm text-white/80 hover:text-white">
                Sign up
              </Link>
              <Link href="/login" className="pill-btn-ghost !py-2">
                Log in
              </Link>
            </div>
          </div>
        </nav>

        <div className="relative z-10 flex-1 flex flex-col items-center px-6 text-center">
          <div className="pt-4 md:pt-6">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="neon-pink text-xs md:text-sm tracking-[0.4em] uppercase mb-3"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Y2K Virtual Try-On
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="chrome-text text-6xl md:text-8xl font-black leading-[0.95] tracking-tighter"
              style={{ fontFamily: "var(--font-retro)" }}
            >
              fitz
            </motion.h1>
          </div>

          <div className="flex-1" />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex gap-3 mb-5"
          >
            <Link href="/dashboard" className="pill-btn">
              Try the demo
            </Link>
            <Link href="#how" className="pill-btn-ghost">
              How it works
            </Link>
          </motion.div>

          <div className="flex justify-center gap-3 pb-8">
            {[Instagram, Twitter, Globe].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="liquid-glass rounded-full p-3 text-white/70 hover:text-white hover:bg-white/5 transition-all"
                aria-label="social"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
