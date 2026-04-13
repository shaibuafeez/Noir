"use client";

import * as React from "react";
import Link from "next/link";
import {
  Eclipse,
  ArrowRight,
  Cpu,
  Menu,
  X,
  LayoutDashboard,
  Mic,
  MessageSquare as MessageSquareIcon,
  Terminal,
} from "lucide-react";
import {
  useScroll,
  useMotionValueEvent,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
  PulseGlow,
  AnimatedNumber,
  DecryptText,
  SplitText,
  TiltCard,
  motion,
} from "@/components/motion";

import { getGoogleSignInUrl } from "@/lib/auth";

/* ─── useIsMobile ─── */
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

/* ─── Minimalist NavLink ─── */
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="group relative text-muted-foreground transition-all duration-300 hover:opacity-100 hover:text-foreground">
      {children}
    </a>
  );
}

/* ─── Floating header ─── */
function FloatingHeader() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  useMotionValueEvent(scrollY, "change", (v) => {
    setScrolled(v > 40);
  });

  return (
    <>
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center w-full px-4 pointer-events-none">
        <motion.header
          className="pointer-events-auto w-full max-w-5xl rounded-full transition-all duration-500 border border-transparent overflow-hidden"
          animate={{
            backgroundColor: scrolled ? "hsla(0, 0%, 100%, 0.75)" : "transparent",
            backdropFilter: scrolled ? "blur(20px)" : "blur(0px)",
            borderColor: scrolled ? "hsla(0, 0%, 0%, 0.08)" : "hsla(0, 0%, 0%, 0.03)",
            boxShadow: scrolled ? "0 10px 30px -10px rgba(0,0,0,0.06)" : "none",
            y: scrolled ? 0 : 8,
          }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between px-6 py-3 transition-all duration-300">
            <div className="flex items-center gap-3">
              <motion.div
                className="relative flex h-8 w-8 items-center justify-center text-foreground"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Eclipse className="h-5 w-5" />
              </motion.div>
              <span className="text-base font-medium tracking-wide">Noir</span>
            </div>
            
            <nav className="hidden items-center gap-8 text-sm font-medium tracking-wide md:flex">
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#platforms">Platforms</NavLink>
              <a
                href="https://aleo.org"
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground transition-all duration-300 hover:opacity-100 hover:text-foreground"
              >
                Aleo
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <Button asChild size="sm" variant="outline" className="hidden md:inline-flex rounded-full border-border px-5 text-xs font-medium uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors duration-300">
                <Link href="/dashboard">Launch</Link>
              </Button>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground md:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile menu - embedded inside the pill */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="border-t border-white/5 bg-transparent md:hidden"
              >
                <div className="flex flex-col gap-4 px-6 py-6 pb-8">
                  <a href="#features" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(false)}>Features</a>
                  <a href="#platforms" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(false)}>Platforms</a>

                  <a href="https://aleo.org" target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground">Aleo</a>
                  <Button asChild size="sm" variant="outline" className="w-full rounded-full border-border hover:bg-foreground hover:text-background mt-2">
                    <Link href="/dashboard">Launch Dashboard</Link>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>
      </div>

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}

/* ─── Mouse spotlight (desktop only) ─── */
function MouseSpotlight() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: useMotionValue("transparent"),
      }}
    >
      <motion.div
        className="h-full w-full"
        style={{
          x: springX,
          y: springY,
          background: "radial-gradient(600px circle, hsla(240, 100%, 74%, 0.04), transparent 60%)",
          position: "fixed",
          width: 1,
          height: 1,
          left: 0,
          top: 0,
        }}
      />
    </motion.div>
  );
}

/* ─── Floating orbs ─── */
function FloatingOrbs() {
  const orbs = [
    { size: 300, x: "10%", y: "15%", delay: 0, duration: 20, mobile: true },
    { size: 200, x: "80%", y: "25%", delay: 2, duration: 18, mobile: true },
    { size: 250, x: "50%", y: "60%", delay: 4, duration: 22, mobile: true },
    { size: 180, x: "20%", y: "70%", delay: 1, duration: 25, mobile: false },
    { size: 220, x: "70%", y: "80%", delay: 3, duration: 19, mobile: false },
  ];
  return (
    <>
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className={`pointer-events-none absolute rounded-full bg-primary/[0.08] blur-[80px] ${
            !orb.mobile ? "hidden md:block" : ""
          }`}
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
          }}
          animate={{
            y: [0, -20, 0, 15, 0],
            x: [0, 10, 0, -10, 0],
            scale: [1, 1.1, 1, 0.95, 1],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}

/* ─── Stats ticker ─── */
function StatsTicker() {
  const ref = React.useRef<HTMLDivElement>(null);
  const [inView, setInView] = React.useState(false);
  const [stats, setStats] = React.useState({ trades: 0, volume: 0, privacyPct: 100 });

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  React.useEffect(() => {
    const base =
      typeof window !== "undefined" && window.location.port === "3002"
        ? `${window.location.protocol}//${window.location.hostname}:3000`
        : typeof window !== "undefined" && window.location.port === "3000"
          ? ""
          : process.env.NEXT_PUBLIC_API_URL || "https://noir-backend-production-d2b0.up.railway.app";
    fetch(`${base}/api/stats`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok !== false && d.data) setStats({ trades: d.data.trades, volume: d.data.volume, privacyPct: d.data.privacyPct });
        else if (d.ok !== false) setStats({ trades: d.trades ?? 0, volume: d.volume ?? 0, privacyPct: d.privacyPct ?? 100 });
      })
      .catch(() => {});
  }, []);

  /** Format volume as e.g. "$1.2M" or "$45K" or "$123" */
  function fmtVolume(v: number): string {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return Math.round(v).toLocaleString();
  }

  return (
    <div ref={ref} className="mt-24 flex flex-wrap items-center justify-center gap-x-16 gap-y-6 font-mono text-sm tracking-widest text-muted-foreground uppercase">
      <div className="flex flex-col items-center gap-1">
        <AnimatedNumber
          value={inView ? stats.trades : 0}
          format={(n) => Math.round(n).toLocaleString()}
          className="text-xl font-medium text-foreground tabular-nums tracking-tight"
        />
        <span className="text-[10px]">Trades Executed</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center">
          <span className="text-xl font-medium text-foreground tracking-tight">$</span>
          <AnimatedNumber
            value={inView ? stats.volume : 0}
            format={(n) => fmtVolume(n)}
            className="text-xl font-medium text-foreground tabular-nums tracking-tight"
          />
        </div>
        <span className="text-[10px]">Volume</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <AnimatedNumber
          value={inView ? stats.privacyPct : 0}
          format={(n) => `${Math.round(n)}%`}
          className="text-xl font-medium text-foreground tabular-nums tracking-tight"
        />
        <span className="text-[10px]">Private</span>
      </div>
    </div>
  );
}

/* ─── Magnetic button wrapper ─── */
function MagneticButton({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        x.set((e.clientX - rect.left - rect.width / 2) * 0.15);
        y.set((e.clientY - rect.top - rect.height / 2) * 0.15);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Main landing page ─── */
export default function Landing() {
  const isMobile = useIsMobile();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />
      <FloatingOrbs />

      {/* Mouse spotlight — desktop only */}
      {!isMobile && <MouseSpotlight />}

      {/* Floating Header */}
      <FloatingHeader />

      {/* ─── HERO ─── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-40 pt-32 text-center md:pb-56 md:pt-48">
        <FadeIn delay={0.2}>
          <h1 className="mx-auto max-w-5xl text-balance text-6xl font-medium tracking-tighter md:text-8xl lg:text-[7.5rem] leading-[1.1]">
            Trade private.<br />
            <span className="text-muted-foreground italic font-serif">Talk natural.</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.4}>
          <p className="mx-auto mt-12 max-w-2xl text-lg md:text-xl leading-relaxed text-muted-foreground font-light">
            An AI trading agent on Aleo&apos;s private zkVM. Trade by text or voice,
            launch tokens, copy traders, automate strategies &mdash; all shielded
            by zero-knowledge proofs.
          </p>
          <p className="mx-auto mt-4 text-sm font-medium text-primary tracking-wide">
            Web, Voice, Telegram, Discord, CLI &amp; SDK
          </p>
        </FadeIn>

        <FadeIn delay={0.6}>
          <div className="mt-16 flex flex-col items-center justify-center gap-5 sm:flex-row">
            <Button asChild size="lg" className="rounded-full px-8 font-medium">
              <Link href="/dashboard">Launch Dashboard</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full border-border px-8 hover:bg-foreground hover:text-background transition-colors duration-300">
              <Link href="/chat">Try the agent</Link>
            </Button>
          </div>
        </FadeIn>

        <StatsTicker />
      </section>

      {/* ─── FEATURES — Bento Grid ─── */}
      <section id="features" className="relative z-10 border-t border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-card/30 to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-6 py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
              <SplitText>Everything a trader needs.</SplitText>
              <br />
              <SplitText delay={0.3} className="text-muted-foreground">Nothing anyone can see.</SplitText>
            </h2>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-3 md:grid-cols-6">
            {/* Row 1: 4 + 2 */}
            <FadeIn delay={0.1} className="md:col-span-4">
              <BentoCard
                label="Privacy"
                title="Private Holdings"
                desc="Every buy creates a ZK record. Balances live in the shielded pool — invisible to chain analysts, exchanges, MEV bots."
                large
              />
            </FadeIn>
            <FadeIn delay={0.15} className="md:col-span-2">
              <BentoCard
                label="AI"
                title="Natural Language"
                desc={'"buy 100 ALEO", "if ALEO drops 15%, sell half", "stack $50/week". An AI agent that speaks your language.'}
              />
            </FadeIn>

            {/* Row 2: 2 + 2 + 2 */}
            <FadeIn delay={0.2} className="md:col-span-2">
              <BentoCard
                label="Social"
                title="Copy Trading"
                desc="Mirror any Noir user privately. Leaders never know who follows them. Followers never leak positions."
              />
            </FadeIn>
            <FadeIn delay={0.25} className="md:col-span-2">
              <BentoCard
                label="Automation"
                title="DCA & Rebalance"
                desc="Automated dollar-cost averaging. Portfolio drift rebalancing. Runs on a private schedule."
              />
            </FadeIn>
            <FadeIn delay={0.3} className="md:col-span-2">
              <BentoCard
                label="Signals"
                title="Smart Alerts"
                desc="Conditional automation. RSI, Bollinger bands, price triggers. Agent reasons, you stay in control."
              />
            </FadeIn>

            {/* Row 3: 3 + 3 */}
            <FadeIn delay={0.35} className="md:col-span-3">
              <BentoCard
                label="Stealth"
                title="Noir Mode"
                desc={'One command: "go dark". All public balances move to private records. Your wallet vanishes from explorers.'}
              />
            </FadeIn>
            <FadeIn delay={0.4} className="md:col-span-3">
              <BentoCard
                label="Build"
                title="Developer SDK"
                desc="npm install @noir-protocol/sdk — trade, launch tokens, ZK proofs, technical indicators. Build on Noir."
              />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── TRY NOIR EVERYWHERE ─── */}
      <section id="platforms" className="relative z-10 border-t border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-6 py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
              <SplitText>6 interfaces. One agent.</SplitText>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Trade from wherever you are — every interface connects to the same private engine.
            </p>
          </div>

          <StaggerContainer className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" delay={0.2}>
            {[
              {
                icon: LayoutDashboard,
                title: "Web Dashboard",
                desc: "Full portfolio view, charts, strategies, and launchpad. Sign in with Google for a persistent zkLogin wallet.",
                cta: "Launch Dashboard",
                href: "/dashboard",
                external: false,
              },
              {
                icon: Mic,
                title: "Voice Agent",
                desc: "Speak naturally to trade. Powered by Gemini Live API with real-time audio. Just click the mic in Chat.",
                cta: "Try Voice",
                href: "/chat",
                external: false,
              },
              {
                icon: MessageSquareIcon,
                title: "Telegram Bot",
                desc: "Trade from any Telegram chat. DM the bot with commands like \"buy 100 ALEO\" or \"go dark\".",
                cta: "Open in Telegram",
                href: "https://t.me/noir_aleobot",
                external: true,
              },
              {
                icon: MessageSquareIcon,
                title: "Discord Bot",
                desc: "Add Noir to your server. Use slash commands to trade, check portfolio, and set alerts with your community.",
                cta: "Add to Discord",
                href: "https://discord.com/oauth2/authorize?client_id=1490862109452537956&permissions=274877910016&scope=bot%20applications.commands",
                external: true,
              },
              {
                icon: Terminal,
                title: "CLI & MCP Server",
                desc: "Pipe commands from your terminal or connect via Model Context Protocol for AI-to-AI trading workflows.",
                cta: "View Docs",
                href: "/docs",
                external: false,
              },
              {
                icon: Cpu,
                title: "Developer SDK",
                desc: "npm install @noir-protocol/sdk — trade, launch tokens, compute ZK proofs, and run technical indicators.",
                cta: "SDK Reference",
                href: "/docs/sdk",
                external: false,
              },
            ].map((p) => (
              <StaggerItem key={p.title}>
                <TiltCard className="group flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30 transition-colors group-hover:bg-primary/20">
                      <p.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold">{p.title}</h3>
                      <span className="flex items-center gap-1 rounded-full bg-[hsl(var(--success))]/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest text-[hsl(var(--success))]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />
                        Live
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {p.desc}
                  </p>
                  {p.external ? (
                    <a
                      href={p.href}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary"
                    >
                      {p.cta} <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <Link
                      href={p.href}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary"
                    >
                      {p.cta} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>


      {/* ─── CTA ─── */}
      <section className="relative z-10 border-t border-border">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/[0.03] to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-3xl px-6 py-28 text-center">
          <CTASection isMobile={isMobile} />
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10">
        <div className="gradient-separator" />

        {/* Marquee */}
        <div className="overflow-hidden py-6">
          <div className="marquee-track">
            {[...Array(2)].map((_, setIdx) => (
              <React.Fragment key={setIdx}>
                {["Aleo", "Zero Knowledge", "Private", "Shielded", "ZK Proofs", "Noir Protocol", "On-Chain", "Verifiable"].map(
                  (word, i) => (
                    <span key={`${setIdx}-${i}`} className="flex items-center gap-4 px-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      {word}
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                    </span>
                  )
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="gradient-separator" />
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-xs text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2 font-mono uppercase tracking-widest">
            <Eclipse className="h-3 w-3 text-primary" /> noir · private · aleo
          </div>
          <div className="flex items-center gap-6">
            <a href="#platforms" className="font-mono uppercase tracking-widest hover:text-foreground transition-colors">Platforms</a>
            <a href="https://github.com/0N1M0/noir-protocol" target="_blank" rel="noreferrer" className="font-mono uppercase tracking-widest hover:text-foreground transition-colors">GitHub</a>
            <span className="font-mono tracking-wider">ghost_trade_v3.aleo</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── CTA Section with perspective tilt ─── */
function CTASection({ isMobile }: { isMobile: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(
    useMotionValue(0),
    { stiffness: 80, damping: 20 }
  );
  const rotateY = useSpring(
    useMotionValue(0),
    { stiffness: 80, damping: 20 }
  );

  function handleMouseMove(e: React.MouseEvent) {
    if (isMobile) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    rotateX.set(ny * -4);
    rotateY.set(nx * 4);
  }

  function handleMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 800,
      }}
      className="rounded-2xl border border-border bg-card p-10 shadow-lg md:p-14"
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.h2
        className="text-3xl font-semibold tracking-tight md:text-5xl"
        initial={{ clipPath: "inset(0 100% 0 0)" }}
        whileInView={{ clipPath: "inset(0 0% 0 0)" }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        Ready to disappear?
      </motion.h2>
      <p className="mt-4 text-lg text-muted-foreground">
        No KYC. Sign in with Google for a persistent zkLogin wallet, or go fully anonymous.
      </p>
      {isMobile ? (
        <Button asChild size="lg" className="mt-10 group">
          <Link href="/dashboard">
            Launch Noir <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      ) : (
        <MagneticButton>
          <Button asChild size="lg" className="mt-10 group">
            <Link href="/dashboard">
              Launch Noir <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </MagneticButton>
      )}
    </motion.div>
  );
}

/* ─── Bento card ─── */
function BentoCard({
  label,
  title,
  desc,
  large,
}: {
  label: string;
  title: string;
  desc: string;
  large?: boolean;
}) {
  return (
    <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-500 hover:border-primary/40 hover:shadow-lg md:p-8">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/[0.06] blur-3xl transition-all duration-700 group-hover:bg-primary/15 group-hover:scale-150" />
      <span className="relative inline-block rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-primary">
        {label}
      </span>
      <div className="relative mt-4">
        <h3 className={`font-semibold tracking-tight text-foreground ${large ? "text-xl md:text-2xl" : "text-lg"}`}>
          {title}
        </h3>
        <p className={`mt-2 leading-relaxed text-muted-foreground ${large ? "text-sm md:text-base max-w-xl" : "text-sm"}`}>
          {desc}
        </p>
      </div>
    </div>
  );
}

function GoogleSignInButton() {
  const url = getGoogleSignInUrl();
  return (
    <Button asChild variant="outline" size="lg">
      <a href={url}>Sign in with Google</a>
    </Button>
  );
}
