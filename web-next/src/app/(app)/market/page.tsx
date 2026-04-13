"use client";

import * as React from "react";
import { Search, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PortfolioArea } from "@/components/charts/area";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
  PageWrapper,
  Shimmer,
} from "@/components/motion";
import { cn, formatNumber, formatUsd, formatPct } from "@/lib/utils";
import { api, useApi } from "@/lib/api";
import type { MarketToken } from "@/lib/api";
import { useWs, type LiveMarketToken } from "@/lib/ws-context";

type SortKey = "price" | "change24h" | "rsi";

export default function MarketPage() {
  const [query, setQuery] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("change24h");
  const [selectedSymbol, setSelectedSymbol] = React.useState<string | null>(
    null,
  );

  // Live prices via WebSocket (updates every 5s, no HTTP polling)
  const { liveMarket } = useWs();
  const tokens = liveMarket as MarketToken[];
  const marketLoading = tokens.length === 0;

  React.useEffect(() => {
    if (!selectedSymbol && tokens.length > 0) {
      setSelectedSymbol(tokens[0]?.symbol ?? null);
    }
  }, [tokens, selectedSymbol]);

  const selected = React.useMemo(
    () => tokens.find((t) => t.symbol === selectedSymbol) ?? null,
    [tokens, selectedSymbol],
  );

  const history = useApi(
    () => api.marketHistory(selectedSymbol!, 48),
    [selectedSymbol],
    Boolean(selectedSymbol),
  );

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    const rows = q
      ? tokens.filter(
          (t) =>
            t.symbol.toLowerCase().includes(q) ||
            t.name.toLowerCase().includes(q),
        )
      : [...tokens];
    rows.sort((a, b) => {
      if (sortKey === "rsi") {
        return (b.rsi ?? -Infinity) - (a.rsi ?? -Infinity);
      }
      return b[sortKey] - a[sortKey];
    });
    return rows;
  }, [tokens, query, sortKey]);

  const sortedByChange = React.useMemo(
    () => [...tokens].sort((a, b) => b.change24h - a.change24h),
    [tokens],
  );
  const topGainers = sortedByChange.slice(0, 3);
  const topLosers = [...sortedByChange].reverse().slice(0, 3);

  return (
    <PageWrapper className="space-y-6">
      {/* Header */}
      <FadeIn>
        <h1 className="text-2xl font-semibold tracking-tight">Market</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live prices, technicals, and momentum
        </p>
      </FadeIn>

      {/* Top movers */}
      <StaggerContainer className="grid gap-4 md:grid-cols-2">
        <StaggerItem>
          <MoverCard
            label="Top gainers"
            icon={TrendingUp}
            tone="success"
            tokens={topGainers}
            loading={marketLoading}
          />
        </StaggerItem>
        <StaggerItem>
          <MoverCard
            label="Top losers"
            icon={TrendingDown}
            tone="destructive"
            tokens={topLosers}
            loading={marketLoading}
          />
        </StaggerItem>
      </StaggerContainer>

      {/* Main: table + detail */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Token table */}
        <FadeIn delay={0.2} className="lg:col-span-3">
          <Card>
            <CardHeader className="gap-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">Tokens</CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {filtered.length} results
                </Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search token..."
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="px-0">
              <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-b border-border px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>Token</span>
                <SortHeader active={sortKey === "price"} onClick={() => setSortKey("price")}>
                  Price
                </SortHeader>
                <SortHeader active={sortKey === "change24h"} onClick={() => setSortKey("change24h")}>
                  24h
                </SortHeader>
                <SortHeader active={sortKey === "rsi"} onClick={() => setSortKey("rsi")}>
                  RSI
                </SortHeader>
              </div>
              {marketLoading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Shimmer key={i} height="44px" className="w-full" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="dot-grid py-12 text-center text-sm text-muted-foreground">
                  {query ? `No tokens match "${query}"` : "No market data available"}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filtered.map((t) => {
                    const isSelected = selectedSymbol === t.symbol;
                    return (
                      <button
                        key={t.symbol}
                        onClick={() => setSelectedSymbol(t.symbol)}
                        className={cn(
                          "grid w-full grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-4 py-3 text-left transition-all duration-200",
                          isSelected
                            ? "bg-primary/5 border-l-2 border-l-primary"
                            : "hover:bg-accent/20 border-l-2 border-l-transparent",
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-bold transition-colors",
                              isSelected
                                ? "bg-primary/15 text-primary ring-1 ring-primary/20"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {t.symbol.slice(0, 3)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {t.symbol}
                            </div>
                            <div className="truncate text-[11px] text-muted-foreground">
                              {t.isStablecoin ? "Stablecoin" : t.name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-mono text-sm tabular-nums">
                          {formatUsd(t.price, t.price < 1 ? 4 : 2)}
                        </div>
                        <div
                          className={cn(
                            "text-right font-mono text-sm tabular-nums",
                            t.change24h >= 0
                              ? "text-[hsl(var(--success))]"
                              : "text-destructive",
                          )}
                        >
                          {formatPct(t.change24h)}
                        </div>
                        <RsiBadge value={t.rsi} />
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Detail panel */}
        <FadeIn delay={0.3} className="lg:col-span-2">
          <Card className="h-full">
            {!selected ? (
              <CardContent className="flex h-full items-center justify-center p-10 text-center text-sm text-muted-foreground">
                {marketLoading ? (
                  <div className="space-y-3">
                    <Shimmer width="120px" height="24px" className="mx-auto" />
                    <Shimmer width="80px" height="16px" className="mx-auto" />
                  </div>
                ) : (
                  "Select a token for details"
                )}
              </CardContent>
            ) : (
              <>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{selected.symbol}</CardTitle>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {selected.isStablecoin ? "Stablecoin" : selected.name}
                      </p>
                    </div>
                    <Badge variant={selected.change24h >= 0 ? "success" : "destructive"}>
                      {formatPct(selected.change24h)}
                    </Badge>
                  </div>
                  <div className="mt-2 font-mono text-3xl font-semibold tabular-nums">
                    {formatUsd(selected.price, selected.price < 1 ? 4 : 2)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {history.loading ? (
                    <Shimmer height="160px" className="w-full" />
                  ) : history.data && history.data.length > 0 ? (
                    <PortfolioArea
                      data={history.data}
                      height={160}
                      showGrid={false}
                      color={
                        selected.change24h >= 0
                          ? "hsl(var(--success))"
                          : "hsl(var(--destructive))"
                      }
                    />
                  ) : (
                    <div className="dot-grid flex h-40 items-center justify-center text-xs text-muted-foreground">
                      No price history yet
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
                    <Stat label="1h" value={formatPct(selected.change1h)} />
                    <Stat label="24h" value={formatPct(selected.change24h)} />
                    <Stat
                      label="RSI"
                      value={
                        selected.rsi !== null
                          ? `${formatNumber(selected.rsi, 1)}${
                              selected.rsiSignal ? ` (${selected.rsiSignal})` : ""
                            }`
                          : "n/a"
                      }
                    />
                    <Stat
                      label="Bollinger"
                      value={
                        selected.bollingerPosition
                          ? selected.bollingerPosition.replace(/_/g, " ")
                          : "n/a"
                      }
                    />
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </FadeIn>
      </div>
    </PageWrapper>
  );
}

function SortHeader({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-right transition-colors",
        active ? "text-primary" : "hover:text-foreground",
      )}
    >
      {children}
      {active && <span className="ml-1">↓</span>}
    </button>
  );
}

function RsiBadge({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <div className="text-right font-mono text-sm tabular-nums text-muted-foreground">
        —
      </div>
    );
  }
  const tone =
    value >= 70
      ? "text-destructive"
      : value <= 30
        ? "text-[hsl(var(--success))]"
        : "text-muted-foreground";
  return (
    <div className={cn("text-right font-mono text-sm tabular-nums", tone)}>
      {value.toFixed(0)}
    </div>
  );
}

function MoverCard({
  label,
  icon: Icon,
  tone,
  tokens,
  loading,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "success" | "destructive";
  tokens: MarketToken[];
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Icon
            className={cn(
              "h-4 w-4",
              tone === "success"
                ? "text-[hsl(var(--success))]"
                : "text-destructive",
            )}
          />
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {label}
          </span>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Shimmer key={i} height="20px" className="w-full" />
            ))}
          </div>
        ) : tokens.length === 0 ? (
          <div className="py-4 text-xs text-muted-foreground">
            No data available
          </div>
        ) : (
          <div className="space-y-2.5">
            {tokens.map((t) => (
              <div
                key={t.symbol}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[10px] font-bold text-muted-foreground">
                    {t.symbol}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {t.isStablecoin ? "Stable" : t.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs tabular-nums">
                    {formatNumber(t.price, t.price < 10 ? 4 : 2)}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-xs tabular-nums",
                      t.change24h >= 0
                        ? "text-[hsl(var(--success))]"
                        : "text-destructive",
                    )}
                  >
                    {formatPct(t.change24h)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums capitalize">
        {value}
      </div>
    </div>
  );
}
