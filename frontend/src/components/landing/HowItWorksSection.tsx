"use client";

import { motion } from "framer-motion";
import { Camera, Shirt, RotateCw } from "lucide-react";

const STEPS = [
  {
    icon: Camera,
    tag: "01 — YOU",
    title: "Drop in your photos",
    body: "Upload 3–5 selfies. We build a photoreal avatar in the fitz lookbook style — pitch-black backdrop, centered, full body.",
  },
  {
    icon: Shirt,
    tag: "02 — THE FIT",
    title: "Pick the pieces",
    body: "Browse Grailed & Mercari or drop your own garment images. Shirt, pants, outerwear — stack them like a closet.",
  },
  {
    icon: RotateCw,
    tag: "03 — THE CHECK",
    title: "Rotate before you buy",
    body: "fitz renders five angles of you in the fit — left, 3/4, front, 3/4, right. See the silhouette before your card is charged.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how" className="relative py-24 md:py-36 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="flex items-baseline justify-between mb-12 md:mb-16 flex-wrap gap-4"
        >
          <h2
            className="text-4xl md:text-6xl font-bold tracking-tighter text-white"
            style={{ fontFamily: "var(--font-retro)" }}
          >
            HOW IT <span className="neon-pink">WORKS</span>
          </h2>
          <p
            className="text-white/40 text-sm tracking-[0.35em] uppercase"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            3 steps, no guesswork
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.tag}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: 0.1 + i * 0.12 }}
              className="liquid-glass rounded-2xl p-6 md:p-8 flex flex-col"
            >
              <div className="w-12 h-12 rounded-full bg-[color:var(--color-fc-panel)] border border-[color:var(--color-fc-border)] flex items-center justify-center mb-5 neon-pink">
                <step.icon size={18} />
              </div>
              <p
                className="text-[10px] tracking-[0.35em] text-white/40 uppercase mb-2"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {step.tag}
              </p>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-2">
                {step.title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
