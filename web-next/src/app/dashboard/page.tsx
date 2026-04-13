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
} from "lucide-react";
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
} from "@/components/motion";
import { cn, formatNumber, formatUsd, formatPct, timeAgo } from "@/lib/utils";
import { api, useApi } from "@/lib/api";
import { useWs } from "@/lib/ws-context";

export default function DashboardPage() {
  const { sessionId } = useWs();
  const [privacyMode, setPrivacyMode] = React.useState(false);

  const portfolio = useApi(
    () => api.portfolio(sessionId!),
    [sessionId],
    Boolean(sessionId),
  );
  const strategies = useApi(
    () => api.strategies(sessionId!),
    [sessionId],
    Boolean(sessionId),
  );
  const trades = useApi(
    () => api.trades(sessionId!),
    [sessionId],
    Boolean(sessionId),
  );

  const mask = (v: string) => (privacyMode ? "•••••" : v);

  const totalValue = portfolio.data?.totalValue ?? 0;
  const change24h = portfolio.data?.change24h ?? 0;
  const holdings = portfolio.data?.holdings ?? [];
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
      <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <EmptyBlock
                  label={
                    portfolio.loading
                      ? "Loading portfolio..."
                      : "No trade history yet — start trading in chat"
                  }
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
              <StrategyRow icon={Zap} label="DCA" count={strategies.data?.dca.length ?? 0} />
              <StrategyRow icon={Target} label="Limits" count={strategies.data?.limits.length ?? 0} />
              <StrategyRow icon={Bell} label="Alerts" count={strategies.data?.alerts.length ?? 0} />
              <StrategyRow icon={Shield} label="Protection" count={strategies.data?.protection.length ?? 0} />
              <StrategyRow icon={Scale} label="Rebalance" count={strategies.data?.rebalance.length ?? 0} />
              <StrategyRow icon={Users} label="Copy Trading" count={strategies.data?.copy.length ?? 0} />
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
                <EmptyBlock
                  label={
                    portfolio.loading
                      ? "Loading holdings..."
                      : "No holdings yet — your balances show up here after your first trade"
                  }
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
                <EmptyBlock
                  label={trades.loading ? "Loading trades..." : "No trades yet"}
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
    </PageWrapper>
  );
}

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

function StrategyRow({
  icon: Icon,
  label,
  count,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/30 px-3 py-2.5 transition-colors hover:bg-accent/30 hover:border-border/60">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-primary/70" />
        <span className="text-sm">{label}</span>
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

function EmptyBlock({ label, loading }: { label: string; loading?: boolean }) {
  return (
    <div className="dot-grid px-6 py-12 text-center">
      {loading ? (
        <div className="mx-auto flex flex-col items-center gap-3">
          <Shimmer width="160px" height="12px" />
          <Shimmer width="120px" height="12px" />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{label}</p>
      )}
    </div>
  );
}
