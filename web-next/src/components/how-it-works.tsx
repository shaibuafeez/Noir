"use client";

import * as React from "react";
import { Shield, MessageSquare, Copy } from "lucide-react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";
import { FadeIn, GlassCard, AnimatedNumber } from "@/components/motion";

const STEPS = [
  {
    n: "01",
    icon: Shield,
    title: "Sign in or create wallet",
    desc: "Use Google zkLogin for a persistent wallet, or go ephemeral. Noir never sees your keys.",
  },
  {
    n: "02",
    icon: MessageSquare,
    title: "Trade privately",
    desc: "Each swap emits a ZK proof. Balances stay hidden in private records on Aleo's shielded pool.",
  },
  {
    n: "03",
    icon: Copy,
    title: "Copy & automate",
    desc: "Agent runs strategies on your behalf. DCA, copy trading, limit orders — all private, all proven.",
  },
];

function useIsMobile() {
  const [mobile, setMobile] = React.useState(false);
  React.useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

/* ─── Desktop: Scroll-pinned sticky gallery with progress bar ─── */
function DesktopGallery() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const [active, setActive] = React.useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v < 0.33) setActive(0);
    else if (v < 0.66) setActive(1);
    else setActive(2);
  });

  const progressHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div ref={containerRef} className="relative" style={{ height: "300vh" }}>
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <div className="mx-auto flex w-full max-w-3xl items-start gap-8 px-6">
          {/* Vertical progress bar */}
          <div className="relative hidden h-[340px] w-[2px] flex-shrink-0 md:block">
            <div className="absolute inset-0 bg-border rounded-full" />
            <motion.div
              className="absolute top-0 left-0 w-full rounded-full bg-primary"
              style={{ height: progressHeight }}
            />
            {/* Step dots */}
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 -translate-x-1/2"
                style={{ top: `${(i / (STEPS.length - 1)) * 100}%` }}
              >
                <div
                  className={`h-3 w-3 rounded-full border-2 transition-colors duration-300 ${
                    i <= active
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/50 bg-card"
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="flex-1">
            {/* Step counter */}
            <div className="mb-4 flex items-baseline gap-3">
              <span className="text-7xl font-bold text-primary/40 tabular-nums">
                <AnimatedNumber
                  value={active + 1}
                  format={(n) => `0${Math.round(n)}`}
                />
              </span>
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                / 03
              </span>
            </div>

            {/* Cards */}
            <div className="relative" style={{ height: 280 }}>
              {STEPS.map((step, i) => (
                <ScrollCard
                  key={i}
                  step={step}
                  index={i}
                  scrollYProgress={scrollYProgress}
                />
              ))}
            </div>

            {/* Progress dots */}
            <div className="mt-8 flex items-center gap-2">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === active
                      ? "w-6 bg-primary"
                      : "w-1.5 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScrollCard({
  step,
  index,
  scrollYProgress,
}: {
  step: (typeof STEPS)[number];
  index: number;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const Icon = step.icon;
  const segStart = index / 3;
  const segEnd = (index + 1) / 3;
  const mid = (segStart + segEnd) / 2;

  const y = useTransform(
    scrollYProgress,
    [segStart, mid, segEnd],
    [60, 0, -30]
  );
  const scale = useTransform(
    scrollYProgress,
    [segStart, mid, segEnd],
    [0.85, 1, 0.9]
  );
  const opacity = useTransform(
    scrollYProgress,
    [segStart, segStart + 0.05, mid, segEnd - 0.05, segEnd],
    [0, 1, 1, 1, 0]
  );

  return (
    <motion.div className="absolute inset-0" style={{ y, scale, opacity }}>
      <GlassCard className="flex h-full flex-col items-center justify-center p-10 text-center">
        <div className="mb-2 font-mono text-xs tracking-widest text-primary/60">
          {step.n}
        </div>
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 ring-1 ring-primary/15">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">{step.title}</h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          {step.desc}
        </p>
      </GlassCard>
    </motion.div>
  );
}

/* ─── Mobile: Simple stacked cards ─── */
function MobileGallery() {
  return (
    <div className="grid gap-6">
      {STEPS.map((step) => {
        const Icon = step.icon;
        return (
          <FadeIn key={step.n}>
            <GlassCard className="p-6" hoverGlow>
              <div className="font-mono text-xs tracking-widest text-primary/60">
                {step.n}
              </div>
              <div className="mt-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 ring-1 ring-primary/15">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.desc}
              </p>
            </GlassCard>
          </FadeIn>
        );
      })}
    </div>
  );
}

/* ─── Exported component ─── */
export function HowItWorks() {
  const isMobile = useIsMobile();

  return (
    <section id="how" className="relative z-10 border-t border-border/30">
      <div className="mx-auto max-w-5xl px-6 py-28">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
            Private by construction.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Noir runs on Aleo, a zkVM where every transaction is a proof, not
            data. The chain verifies you traded. Nobody sees what.
          </p>
        </FadeIn>
      </div>

      {isMobile ? (
        <div className="mx-auto max-w-5xl px-6 pb-28">
          <MobileGallery />
        </div>
      ) : (
        <DesktopGallery />
      )}
    </section>
  );
}
