"use client";

import {
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Target,
  Bell,
  Shield,
  Scale,
  Users,
  DollarSign,
  Wallet,
  Globe,
  Mic,
  MessageSquare,
  Terminal,
  Cpu,
  ExternalLink,
  Package,
  Rocket,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PortfolioArea } from "@/components/charts/area";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
  AnimatedNumber,
  PageWrapper,
  Shimmer,
  DecryptText,
  SplitText,
} from "@/components/motion";
import { cn, formatNumber, formatUsd, formatPct, timeAgo } from "@/lib/utils";
import { api, useApi } from "@/lib/api";
import { useWs } from "@/lib/ws-context";
import { ConnectWallet } from "@/components/connect-wallet";

/** Overlay live WS prices onto holdings fetched via REST */
function useLiveHoldings(
  holdings: { token: string; amount: number; price: number; value: number; change24h: number }[],
  liveMarket: { symbol: string; price: number; change24h: number }[],
) {
  return React.useMemo(() => {
    if (liveMarket.length === 0) return holdings;
    const priceMap = new Map(liveMarket.map((t) => [t.symbol, t]));
    return holdings.map((h) => {
      const live = priceMap.get(h.token);
      if (!live) return h;
      return { ...h, price: live.price, value: h.amount * live.price, change24h: live.change24h };
    });
  }, [holdings, liveMarket]);
}

export default function DashboardPage() {
  const { sessionId, authSession, liveMarket } = useWs();
  const [privacyMode, setPrivacyMode] = React.useState(false);

  const isAuthed = Boolean(authSession);
  const portfolio = useApi(
    () => api.portfolio(sessionId!),
    [sessionId],
    isAuthed && Boolean(sessionId),
    30_000,
  );
  const strategies = useApi(
    () => api.strategies(sessionId!),
    [sessionId],
    isAuthed && Boolean(sessionId),
  );
  const trades = useApi(
    () => api.trades(sessionId!),
    [sessionId],
    isAuthed && Boolean(sessionId),
  );
  const balanceAleo = useApi(
    () => api.balance(sessionId!),
    [sessionId],
    isAuthed && Boolean(sessionId),
  );
  const balanceUsdcx = useApi(
    () => api.balanceUsdcx(sessionId!),
    [sessionId],
    isAuthed && Boolean(sessionId),
  );

  // Compute live holdings (hook must be called unconditionally)
  const rawHoldings = portfolio.data?.holdings ?? [];
  const holdings = useLiveHoldings(rawHoldings, liveMarket);

  // ── Unauthenticated: Welcome + Explore ──
  if (!authSession) {
    return (
      <PageWrapper className="space-y-6">
        {/* Welcome hero */}
        <FadeIn>
          <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.06] via-transparent to-primary/[0.03] p-8 md:p-10">
            <DecryptText
              text="Private AI Trading Agent"
              className="text-2xl md:text-3xl font-bold tracking-tight"
            />
            <div className="mt-3">
              <SplitText delay={0.4} className="text-sm text-muted-foreground leading-relaxed">
                Trade with natural language. ZK-private by default. 6 interfaces. 3 deployed contracts.
              </SplitText>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="sm" className="rounded-full gap-2" asChild>
                <Link href="/chat">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Try the agent
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
              <Button size="sm" variant="outline" className="rounded-full gap-2" asChild>
                <Link href="/market">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Live market
                </Link>
              </Button>
              <Button size="sm" variant="outline" className="rounded-full gap-2" asChild>
                <Link href="/launchpad">
                  <Rocket className="h-3.5 w-3.5" />
                  Token launchpad
                </Link>
              </Button>
            </div>
          </div>
        </FadeIn>

        {/* Quick-start actions */}
        <StaggerContainer className="grid gap-3 md:grid-cols-3">
          <StaggerItem>
            <QuickAction
              icon={MessageSquare}
              title="Chat with your agent"
              description={`Say "buy 100 ALEO" or "DCA $25 daily" — the AI understands natural language and executes on-chain.`}
              cta="Open chat"
              href="/chat"
            />
          </StaggerItem>
          <StaggerItem>
            <QuickAction
              icon={TrendingUp}
              title="View live prices"
              description="Real-time market data from Pyth Network with RSI and Bollinger band indicators."
              cta="View market"
              href="/market"
            />
          </StaggerItem>
          <StaggerItem>
            <QuickAction
              icon={Rocket}
              title="Launch a token"
              description="Deploy a meme coin with a ZK bonding curve. Private by default, graduates at 800K tokens."
              cta="Go to launchpad"
              href="/launchpad"
            />
          </StaggerItem>
        </StaggerContainer>

        {/* How it works */}
        <FadeIn delay={0.3}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How it works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {[
                  { step: "1", title: "Sign in", desc: "Google OAuth creates a persistent zkLogin wallet — or stay anonymous with an ephemeral session." },
                  { step: "2", title: "Talk", desc: `Type or speak: "buy 100 ALEO", "set stop-loss at -15%", "copy trader whale". The AI handles it.` },
                  { step: "3", title: "Execute", desc: "Every trade is a zero-knowledge proof on Aleo. Your balances live in the shielded pool." },
                  { step: "4", title: "Monitor", desc: "Portfolio, strategies, and trade history — all rendered here. Privacy score tracks your ZK coverage." },
                ].map((item) => (
                  <div key={item.step} className="space-y-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 font-mono text-sm font-bold text-primary">
                      {item.step}
                    </div>
                    <h4 className="text-sm font-medium">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Sign in CTA */}
        <FadeIn delay={0.4}>
          <div className="flex items-center justify-between rounded-lg border border-border/40 bg-card/40 px-5 py-4">
            <div>
              <p className="text-sm font-medium">Sign in for a persistent portfolio</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Google OAuth + zkLogin — or explore anonymously via Chat
              </p>
            </div>
            <ConnectWallet />
          </div>
        </FadeIn>

        {/* Platform overview — always visible, this is real deployed infra */}
        <PlatformOverview />
      </PageWrapper>
    );
  }

  // ── Authenticated: Full dashboard ──

  const mask = (v: string) => (privacyMode ? "•••••" : v);

  const totalValue = holdings.reduce((s, h) => s + h.value, 0);
  const change24h =
    totalValue > 0
      ? holdings.reduce((s, h) => s + h.value * (h.change24h / 100), 0) / totalValue * 100
      : portfolio.data?.change24h ?? 0;
  const series = portfolio.data?.portfolioSeries ?? [];
  const recentTrades = (trades.data ?? []).slice(0, 6);

  return (
    <PageWrapper className="space-y-6">
      {/* Header */}
      <FadeIn className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your private portfolio on Aleo
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPrivacyMode((p) => !p)}
          className="gap-2"
        >
          {privacyMode ? (
            <>
              <Eye className="h-3.5 w-3.5" /> Show
            </>
          ) : (
            <>
              <EyeOff className="h-3.5 w-3.5" /> Hide
            </>
          )}
        </Button>
      </FadeIn>

      {/* KPI cards */}
      <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StaggerItem>
          <KpiCard
            label="Portfolio Value"
            value={totalValue}
            masked={privacyMode}
            formatter={(n) => formatUsd(n)}
            change={change24h}
            icon={TrendingUp}
            loading={portfolio.loading}
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            label="ALEO Balance"
            value={balanceAleo.data?.balanceCredits ?? 0}
            masked={privacyMode}
            formatter={(n) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            subtext="on-chain"
            icon={Wallet}
            loading={balanceAleo.loading}
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            label="USDCx Balance"
            value={balanceUsdcx.data?.balanceUsdcx ?? 0}
            masked={privacyMode}
            formatter={(n) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtext="stablecoin"
            icon={DollarSign}
            loading={balanceUsdcx.loading}
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            label="24h Change"
            value={Math.abs((totalValue * change24h) / 100)}
            masked={privacyMode}
            formatter={(n) => `${change24h >= 0 ? "+" : "-"}${formatUsd(n)}`}
            change={change24h}
            icon={change24h >= 0 ? TrendingUp : TrendingDown}
            loading={portfolio.loading}
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            label="Active Strategies"
            value={strategies.data?.totalActive ?? 0}
            formatter={(n) => `${Math.round(n)}`}
            subtext="automated"
            icon={Zap}
            loading={strategies.loading}
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            label="Total Trades"
            value={trades.data?.length ?? 0}
            formatter={(n) => `${Math.round(n)}`}
            subtext="all-time"
            icon={ArrowUpRight}
            loading={trades.loading}
          />
        </StaggerItem>
      </StaggerContainer>

      {/* Chart + Strategies */}
      <div className="grid gap-4 lg:grid-cols-3">
        <FadeIn delay={0.2} className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Portfolio Value</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Over time · from trade log
                </p>
              </div>
              {series.length > 0 && (
                <Badge variant={change24h >= 0 ? "success" : "destructive"}>
                  {formatPct(change24h)}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {series.length > 0 ? (
                <PortfolioArea data={series} />
              ) : (
                <EmptyAction
                  icon={MessageSquare}
                  label="No trade history yet"
                  hint={`Go to Chat and say "buy 100 ALEO" to execute your first trade`}
                  cta="Open chat"
                  href="/chat"
                  loading={portfolio.loading}
                />
              )}
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.3}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Strategies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <StrategyRow icon={Zap} label="DCA" count={strategies.data?.dca.length ?? 0} hint="dca $25 into ALEO daily" />
              <StrategyRow icon={Target} label="Limits" count={strategies.data?.limits.length ?? 0} hint="buy 500 ALEO at $0.45" />
              <StrategyRow icon={Bell} label="Alerts" count={strategies.data?.alerts.length ?? 0} hint="alert me when ALEO > $1" />
              <StrategyRow icon={Shield} label="Protection" count={strategies.data?.protection.length ?? 0} hint="protect at -15%" />
              <StrategyRow icon={Scale} label="Rebalance" count={strategies.data?.rebalance.length ?? 0} hint="rebalance 50/30/20" />
              <StrategyRow icon={Users} label="Copy Trading" count={strategies.data?.copy.length ?? 0} hint="copy trader whale" />
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Holdings + Recent trades */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Holdings */}
        <FadeIn delay={0.3} className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Holdings</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {holdings.length === 0 ? (
                <EmptyAction
                  icon={Wallet}
                  label="No holdings yet"
                  hint="Your token balances appear here after your first trade"
                  cta="Start trading"
                  href="/chat"
                  loading={portfolio.loading}
                />
              ) : (
                <div className="divide-y divide-border/40">
                  {holdings.map((h, i) => (
                    <FadeIn key={h.token} delay={i * 0.05} direction="none" className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-accent/30">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 font-mono text-[10px] font-bold text-primary ring-1 ring-primary/15">
                        {h.token.slice(0, 4)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{h.token}</span>
                          <span className="font-mono tabular-nums text-sm">
                            {mask(formatUsd(h.value))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span className="font-mono tabular-nums">
                            {mask(formatNumber(h.amount, 4))} @ $
                            {formatNumber(h.price, 4)}
                          </span>
                          <span
                            className={cn(
                              "font-mono tabular-nums",
                              h.change24h >= 0
                                ? "text-[hsl(var(--success))]"
                                : "text-destructive",
                            )}
                          >
                            {formatPct(h.change24h)}
                          </span>
                        </div>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Recent trades */}
        <FadeIn delay={0.4} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Recent Trades</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {recentTrades.length === 0 ? (
                <EmptyAction
                  icon={ArrowUpRight}
                  label="No trades yet"
                  hint={`Say "buy 100 ALEO" in chat to get started`}
                  cta="Open chat"
                  href="/chat"
                  loading={trades.loading}
                />
              ) : (
                <div className="divide-y divide-border/40">
                  {recentTrades.map((t, i) => {
                    const isBuy = t.action === "buy";
                    return (
                      <FadeIn
                        key={t.id}
                        delay={i * 0.05}
                        direction="none"
                        className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-accent/30"
                      >
                        <div
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-lg",
                            isBuy
                              ? "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]"
                              : "bg-destructive/10 text-destructive",
                          )}
                        >
                          {isBuy ? (
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-sm">
                            <span className="font-mono font-semibold uppercase">
                              {t.action}
                            </span>
                            <span className="font-mono tabular-nums">
                              {formatNumber(t.amount)}
                            </span>
                            <span className="text-muted-foreground">
                              {t.token}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {t.price !== null
                              ? `@ $${formatNumber(t.price, 4)} · `
                              : ""}
                            {timeAgo(t.timestamp)}
                          </div>
                        </div>
                      </FadeIn>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Platform overview */}
      <PlatformOverview />
    </PageWrapper>
  );
}

/* ── Quick Action Card (unauthenticated welcome) ── */

function QuickAction({
  icon: Icon,
  title,
  description,
  cta,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  cta: string;
  href: string;
}) {
  return (
    <Card className="group h-full transition-all duration-200 hover:border-primary/20">
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 ring-1 ring-primary/15 transition-colors group-hover:bg-primary/12 group-hover:ring-primary/25">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h3 className="mt-4 text-sm font-semibold">{title}</h3>
        <p className="mt-1.5 flex-1 text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
        <Button size="sm" variant="ghost" className="mt-4 w-fit gap-1.5 px-0 text-xs text-primary hover:text-primary" asChild>
          <Link href={href}>
            {cta}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/* ── Empty state with CTA (authenticated, no data) ── */

function EmptyAction({
  icon: Icon,
  label,
  hint,
  cta,
  href,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  cta: string;
  href: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-12">
        <Shimmer width="160px" height="12px" />
        <Shimmer width="120px" height="12px" />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/40 bg-muted/20">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground/70">{hint}</p>
      </div>
      <Button size="sm" variant="outline" className="mt-1 rounded-full gap-1.5 text-xs" asChild>
        <Link href={href}>
          {cta}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </Button>
    </div>
  );
}

/* ── Platform Overview (real deployed infra — not mock data) ── */

function PlatformOverview() {
  return (
    <FadeIn delay={0.5}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Multi-interface AI trading agent on Aleo
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Interfaces */}
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
              Interfaces
            </h4>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
              {[
                { icon: Globe, label: "Web" },
                { icon: Mic, label: "Voice (Gemini)" },
                { icon: MessageSquare, label: "Telegram", href: "https://t.me/noir_aleobot" },
                { icon: MessageSquare, label: "Discord", href: "https://discord.com/oauth2/authorize?client_id=1490862109452537956&permissions=274877910016&scope=bot%20applications.commands" },
                { icon: Terminal, label: "CLI / MCP" },
                { icon: Package, label: "SDK" },
              ].map((item) => {
                const Tag = (item as any).href ? "a" : "div";
                const linkProps = (item as any).href ? { href: (item as any).href, target: "_blank", rel: "noreferrer" } : {};
                return (
                  <Tag
                    key={item.label}
                    {...linkProps}
                    className={`flex items-center gap-2 rounded-lg border border-border/40 bg-background/30 px-3 py-2.5 text-sm${(item as any).href ? " hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer" : ""}`}
                  >
                    <item.icon className="h-3.5 w-3.5 text-primary/70" />
                    <span className="text-xs truncate">{item.label}</span>
                    <Badge variant="success" className="ml-auto text-[8px] px-1 py-0">
                      Live
                    </Badge>
                  </Tag>
                );
              })}
            </div>
          </div>

          {/* Smart Contracts */}
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
              Smart Contracts (Aleo Testnet)
            </h4>
            <div className="grid gap-2 md:grid-cols-3">
              {[
                { name: "ghost_trade_v3.aleo", desc: "Private trades & balances" },
                { name: "ghost_launchpad_v2.aleo", desc: "Bonding curve token launches" },
                { name: "ghost_zklogin_v2.aleo", desc: "ZK identity commitments" },
              ].map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-background/30 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-medium truncate">{c.name}</span>
                      <Badge variant="success" className="text-[8px] px-1 py-0">
                        Deployed
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{c.desc}</div>
                  </div>
                  <a
                    href={`https://explorer.provable.com/program/${c.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* SDK */}
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
              Developer SDK
            </h4>
            <div className="rounded-lg border border-border/40 bg-background/30 px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="h-4 w-4 text-primary/70" />
                <code className="text-xs font-mono text-muted-foreground">
                  npm install @noir-protocol/sdk
                </code>
                <Badge variant="outline" className="text-[8px] ml-auto">
                  TypeScript
                </Badge>
              </div>
              <pre className="text-[11px] font-mono text-muted-foreground/70 leading-relaxed overflow-x-auto">{`import { NoirClient } from "@noir-protocol/sdk";
const noir = new NoirClient({ network: "testnet" });
await noir.trade.buy("ALEO", 100);`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </FadeIn>
  );
}

/* ── KPI Card ── */

function KpiCard({
  label,
  value,
  masked,
  formatter,
  change,
  subtext,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number;
  masked?: boolean;
  formatter: (n: number) => string;
  change?: number;
  subtext?: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}) {
  return (
    <Card className="card-shine relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {label}
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/8 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 font-mono text-2xl font-semibold tabular-nums">
          {loading ? (
            <Shimmer width="120px" height="28px" />
          ) : masked ? (
            "•••••"
          ) : (
            <AnimatedNumber value={value} format={formatter} />
          )}
        </div>
        {change !== undefined && !loading && (
          <div
            className={cn(
              "mt-1.5 flex items-center gap-1 text-xs font-mono tabular-nums",
              change >= 0 ? "text-[hsl(var(--success))]" : "text-destructive",
            )}
          >
            {change >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {formatPct(change)}
          </div>
        )}
        {subtext && (
          <div className="mt-1.5 text-xs text-muted-foreground">{subtext}</div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Strategy Row (with hint for empty) ── */

function StrategyRow({
  icon: Icon,
  label,
  count,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  hint: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/30 px-3 py-2.5 transition-colors hover:bg-accent/30 hover:border-border/60">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-primary/70" />
        <div>
          <span className="text-sm">{label}</span>
          {count === 0 && (
            <p className="text-[10px] text-muted-foreground/60 font-mono truncate max-w-[180px]">
              &quot;{hint}&quot;
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono tabular-nums text-sm font-semibold">
          {count}
        </span>
        <span className="text-[10px] text-muted-foreground">active</span>
      </div>
    </div>
  );
}
