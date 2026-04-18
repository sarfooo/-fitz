import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { DemoSection } from "@/components/landing/DemoSection";
import { FooterCtaSection } from "@/components/landing/FooterCtaSection";

// Preload the first few hero frames so the scroll-scrubbed sequence paints
// immediately — React 19 hoists these <link> tags into <head>.
const HERO_PRELOAD_COUNT = 3;

export default function Home() {
  return (
    <>
      {Array.from({ length: HERO_PRELOAD_COUNT }, (_, i) => {
        const name = `frame_${String(i + 1).padStart(4, "0")}.webp`;
        return (
          <link
            key={name}
            rel="preload"
            as="image"
            href={`/hero_frames/${name}`}
            type="image/webp"
            // first frame is the LCP candidate
            fetchPriority={i === 0 ? "high" : "auto"}
          />
        );
      })}
      <main className="flex flex-col">
        <HeroSection />
        <DemoSection />
        <HowItWorksSection />
        <FooterCtaSection />
      </main>
    </>
  );
}
