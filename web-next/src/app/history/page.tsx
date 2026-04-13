"use client";

import * as React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Filter,
  Lock,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
  PageWrapper,
  Shimmer,
  motion,
} from "@/components/motion";
import { cn, formatNumber, formatUsd, timeAgo } from "@/lib/utils";
import { api, useApi } from "@/lib/api";
import { useWs } from "@/lib/ws-context";
import type { TradeRow, DecisionRow } from "@/lib/api";

type ActionFilter = "all" | "buy" | "sell";

export default function HistoryPage() {
  const { sessionId } = useWs();
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<ActionFilter>("all");

  const trades = useApi(
    () => api.trades(sessionId!),
    [sessionId],
    Boolean(sessionId),
  );
  const decisions = useApi(
    () => api.decisions(sessionId!),
    [sessionId],
    Boolean(sessionId),
  );

  const allTrades = trades.data ?? [];
  const allDecisions = decisions.data ?? [];

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    return allTrades.filter((t) => {
      const matchQuery =
        !q ||
        t.token.toLowerCase().includes(q) ||
        (t.tx_hash?.toLowerCase().includes(q) ?? false);
      const matchFilter = filter === "all" || filter === t.action;
      return matchQuery && matchFilter;
    });
  }, [allTrades, query, filter]);

  const totalVolume = allTrades.reduce(
    (s, t) => s + t.amount * (t.price ?? 0),
    0,
  );
  const buys = allTrades.filter((t) => t.action === "buy").length;
  const sells = allTrades.filter((t) => t.action === "sell").length;

  const exportCsv = () => {
    const header = "time,action,token,amount,price,value,tx\n";
    const rows = filtered
      .map(
        (t) =>
          `${t.timestamp},${t.action},${t.token},${t.amount},${t.price ?? ""},${(
            t.amount * (t.price ?? 0)
          ).toFixed(2)},${t.tx_hash ?? ""}`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `noir-trades-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageWrapper className="space-y-6">
      {/* Header */}
      <FadeIn className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Trade log and agent decisions — privately stored on Aleo
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportCsv}
          disabled={filtered.length === 0}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </FadeIn>

      {/* Stats strip */}
      <StaggerContainer className="grid gap-4 md:grid-cols-3">
        <StaggerItem>
          <StatCard
            label="Total volume"
            value={formatUsd(totalVolume)}
            subtext={`${allTrades.length} trades`}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Buys / Sells"
            value={`${buys} / ${sells}`}
            subtext="ratio"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Private"
            value="100%"
            subtext="ZK records on Aleo"
            icon={<Lock className="h-3.5 w-3.5 text-primary" />}
          />
        </StaggerItem>
      </StaggerContainer>

      {/* Tabs */}
      <FadeIn delay={0.2}>
        <Tabs defaultValue="trades" className="space-y-4">
          <TabsList>
            <TabsTrigger value="trades">Trades</TabsTrigger>
            <TabsTrigger value="decisions">Decisions</TabsTrigger>
          </TabsList>

          {/* Trades */}
          <TabsContent value="trades" className="space-y-4">
            <Card>
              <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by token or tx hash..."
                  className="flex-1"
                />
                <div className="flex items-center gap-1 overflow-x-auto">
                  <Filter className="mr-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {(["all", "buy", "sell"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-[11px] font-mono uppercase tracking-widest transition-all duration-200",
                        filter === f
                          ? "border-primary/40 bg-primary/10 text-primary shadow-[0_0_8px_hsl(var(--primary)/0.08)]"
                          : "border-border/40 bg-transparent text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="px-0">
                {trades.loading ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Shimmer key={i} height="48px" className="w-full" />
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="dot-grid py-12 text-center text-sm text-muted-foreground">
                    {allTrades.length === 0
                      ? "No trades yet — execute your first trade in chat"
                      : "No trades match your filters"}
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {filtered.map((t) => (
                      <TradeItem key={t.id} trade={t} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Decisions */}
          <TabsContent value="decisions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Agent decision log</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Every trade decision with market context and reasoning
                </p>
              </CardHeader>
              <CardContent className="px-0">
                {decisions.loading ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3].map((i) => (
                      <Shimmer key={i} height="60px" className="w-full" />
                    ))}
                  </div>
                ) : allDecisions.length === 0 ? (
                  <div className="dot-grid py-12 text-center text-sm text-muted-foreground">
                    No decisions logged yet
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {allDecisions.map((d) => (
                      <DecisionItem key={d.id} decision={d} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </FadeIn>
    </PageWrapper>
  );
}

function TradeItem({ trade }: { trade: TradeRow }) {
  const isBuy = trade.action === "buy";
  const value = trade.amount * (trade.price ?? 0);
  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/20 md:gap-4 md:px-6">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
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
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-mono text-sm font-semibold uppercase">
            {trade.action}
          </span>
          <span className="font-mono text-sm tabular-nums">
            {formatNumber(trade.amount, trade.amount < 1 ? 4 : 0)}
          </span>
          <span className="text-sm text-muted-foreground">{trade.token}</span>
          {trade.price !== null && (
            <span className="text-xs text-muted-foreground">
              @ ${formatNumber(trade.price, trade.price < 10 ? 4 : 2)}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{timeAgo(trade.timestamp)}</span>
          {trade.tx_hash && (
            <>
              <span className="text-border">·</span>
              <code className="font-mono">
                {trade.tx_hash.slice(0, 8)}…{trade.tx_hash.slice(-4)}
              </code>
              <a
                href={`https://aleo.tools/transaction/${trade.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-primary"
                aria-label="view transaction"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        {value > 0 && (
          <div className="font-mono text-sm tabular-nums">
            {formatUsd(value)}
          </div>
        )}
        <div className="mt-0.5 flex items-center justify-end gap-1">
          <CheckCircle2 className="h-3 w-3 text-[hsl(var(--success))]" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            on-chain
          </span>
        </div>
      </div>
    </div>
  );
}

function DecisionItem({ decision }: { decision: DecisionRow }) {
  const executed = decision.decision.toLowerCase().includes("execut");
  return (
    <div className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/20 md:px-6">
      <div
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          executed
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground",
        )}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium">{decision.parsed_action}</span>
          <Badge variant="outline" className="text-[9px]">
            {decision.decision}
          </Badge>
        </div>
        {decision.user_message && (
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            user: {decision.user_message}
          </div>
        )}
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          {decision.reasoning}
        </div>
      </div>
      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
        {timeAgo(decision.timestamp)}
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  icon,
}: {
  label: string;
  value: string;
  subtext: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="card-shine relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {label}
          </span>
          {icon}
        </div>
        <div className="mt-2 font-mono text-xl font-semibold tabular-nums">
          {value}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">{subtext}</div>
      </CardContent>
    </Card>
  );
}
