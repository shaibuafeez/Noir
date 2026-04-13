"use client";

import * as React from "react";
import {
  Rocket,
  TrendingUp,
  Trophy,
  Activity,
  Flame,
  Plus,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Zap,
  Crown,
  Filter,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PortfolioArea } from "@/components/charts/area";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
  AnimatedNumber,
  PageWrapper,
  GlassCard,
  Shimmer,
  PulseGlow,
  motion,
  AnimatePresence,
} from "@/components/motion";
import { cn, formatNumber, timeAgo } from "@/lib/utils";
import { api, useApi } from "@/lib/api";
import type { LaunchItem, LaunchDetailResponse } from "@/lib/api";
import { useWs } from "@/lib/ws-context";
import { useWallet } from "@/lib/wallet-provider";

const MAX_SUPPLY = 1_000_000;
const GRADUATION_THRESHOLD = 800_000;
const GRADUATING_SOON_PCT = 60; // Show urgency above 60%

const PROGRAM_ID = "ghost_launchpad_v1.aleo";

type FilterTab = "all" | "new" | "graduating" | "graduated";

export default function LaunchpadPage() {
  const { sessionId } = useWs();
  const wallet = useWallet();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [filter, setFilter] = React.useState<FilterTab>("all");
  const [search, setSearch] = React.useState("");

  const launches = useApi(() => api.launches(), []);
  const items = launches.data?.launches ?? [];
  const stats = launches.data?.stats;

  const detail = useApi(
    () => api.launchDetail(selectedId!),
    [selectedId],
    Boolean(selectedId),
  );

  // Filter + search
  const filteredItems = React.useMemo(() => {
    let list = items;

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (l) =>
          l.ticker.toLowerCase().includes(q) ||
          l.name.toLowerCase().includes(q),
      );
    }

    // Filter tabs
    switch (filter) {
      case "new": {
        // Created in last 24h
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        list = list.filter(
          (l) =>
            new Date(l.created_at + (l.created_at.endsWith("Z") ? "" : "Z")).getTime() > cutoff,
        );
        break;
      }
      case "graduating":
        list = list.filter(
          (l) => !l.graduated && l.progressPct >= GRADUATING_SOON_PCT,
        );
        break;
      case "graduated":
        list = list.filter((l) => l.graduated === 1);
        break;
    }

    return list;
  }, [items, filter, search]);

  // Auto-select first launch
  React.useEffect(() => {
    if (!selectedId && items.length > 0) {
      setSelectedId(items[0]!.launch_id);
    }
  }, [items, selectedId]);

  // Build bonding curve data for chart
  const curveData = React.useMemo(() => {
    if (!detail.data) return [];
    const points: { label: string; value: number }[] = [];
    const step = Math.max(1, Math.floor(detail.data.supply_sold / 20));
    for (let s = 0; s <= detail.data.supply_sold; s += step) {
      points.push({
        label: `${(s / 1000).toFixed(0)}K`,
        value: 1 + s / 1000,
      });
    }
    if (
      points.length === 0 ||
      points[points.length - 1]!.label !==
        `${(detail.data.supply_sold / 1000).toFixed(0)}K`
    ) {
      points.push({
        label: `${(detail.data.supply_sold / 1000).toFixed(0)}K`,
        value: detail.data.currentPrice,
      });
    }
    return points;
  }, [detail.data]);

  const filterTabs: { key: FilterTab; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: "All", icon: <Rocket className="h-3 w-3" /> },
    { key: "new", label: "New", icon: <Zap className="h-3 w-3" /> },
    { key: "graduating", label: "Hot", icon: <Flame className="h-3 w-3" /> },
    { key: "graduated", label: "Graduated", icon: <Crown className="h-3 w-3" /> },
  ];

  return (
    <PageWrapper className="space-y-5">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2.5">
              <span className="gradient-text">Launchpad</span>
              <PulseGlow color="primary" size={6} />
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Private bonding curve tokens on Aleo
            </p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            size="sm"
            className="gap-1.5 shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
          >
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </div>
      </FadeIn>

      {/* KPI Strip — compact horizontal row */}
      <FadeIn delay={0.05}>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          <KpiChip icon={<Rocket className="h-3.5 w-3.5" />} label="Launches" value={stats?.totalLaunches} color="primary" />
          <KpiChip icon={<Activity className="h-3.5 w-3.5" />} label="Active" value={stats?.activeLaunches} color="primary" />
          <KpiChip icon={<Trophy className="h-3.5 w-3.5" />} label="Graduated" value={stats?.graduatedCount} color="warning" />
          <KpiChip icon={<TrendingUp className="h-3.5 w-3.5" />} label="Volume" value={stats?.totalVolume} format={(n) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : Math.round(n).toString()} color="success" />
        </div>
      </FadeIn>

      {/* Filter bar + search */}
      <FadeIn delay={0.1}>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg border border-border/60 bg-card/60 p-0.5 backdrop-blur-sm">
            {filterTabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  filter === t.key
                    ? "bg-primary/15 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticker or name..."
              className="h-8 pl-8 text-xs bg-card/60"
            />
          </div>
        </div>
      </FadeIn>

      {/* Main layout: card grid + detail */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Token card grid — pump.fun style */}
        <div className="lg:col-span-3">
          {launches.loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Shimmer key={i} height="180px" className="w-full rounded-xl" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <FadeIn>
              <div className="dot-grid flex flex-col items-center justify-center rounded-xl border border-border/30 py-16 text-sm text-muted-foreground">
                {items.length === 0 ? (
                  <>
                    <Rocket className="h-8 w-8 mb-3 text-muted-foreground/50" />
                    <p>No launches yet</p>
                    <p className="text-xs mt-1">Be the first to create one</p>
                  </>
                ) : (
                  <>
                    <Filter className="h-6 w-6 mb-2 text-muted-foreground/50" />
                    <p>No matches for this filter</p>
                  </>
                )}
              </div>
            </FadeIn>
          ) : (
            <StaggerContainer className="grid gap-3 sm:grid-cols-2">
              {filteredItems.map((l) => (
                <StaggerItem key={l.launch_id}>
                  <LaunchCard
                    launch={l}
                    selected={selectedId === l.launch_id}
                    onClick={() => setSelectedId(l.launch_id)}
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>

        {/* Detail panel — sticky on desktop */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-4">
            <Card className="overflow-hidden">
              {!detail.data ? (
                <CardContent className="flex h-[400px] items-center justify-center text-center text-sm text-muted-foreground">
                  {detail.loading ? (
                    <div className="space-y-3">
                      <Shimmer width="120px" height="24px" className="mx-auto" />
                      <Shimmer width="80px" height="16px" className="mx-auto" />
                      <Shimmer width="100%" height="140px" className="mt-4" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/40">
                        <Rocket className="h-5 w-5 text-muted-foreground/60" />
                      </div>
                      <p>Select a token to trade</p>
                    </div>
                  )}
                </CardContent>
              ) : (
                <LaunchDetail
                  detail={detail.data}
                  curveData={curveData}
                  sessionId={sessionId}
                  wallet={wallet}
                  onTraded={() => {
                    launches.reload();
                    detail.reload();
                  }}
                />
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateLaunchModal
            sessionId={sessionId}
            wallet={wallet}
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              setShowCreate(false);
              launches.reload();
            }}
          />
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}

// ── KPI Chip (compact horizontal stat) ──

function KpiChip({
  icon,
  label,
  value,
  format,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
  format?: (n: number) => string;
  color: "primary" | "success" | "warning";
}) {
  const colorMap = {
    primary: "text-primary bg-primary/8",
    success: "text-[hsl(var(--success))] bg-[hsl(var(--success))]/8",
    warning: "text-[hsl(var(--warning))] bg-[hsl(var(--warning))]/8",
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/60 px-3 py-2 backdrop-blur-sm shrink-0">
      <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", colorMap[color])}>
        {icon}
      </div>
      <div>
        <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground leading-none">
          {label}
        </div>
        <div className="text-sm font-semibold tabular-nums mt-0.5">
          {value !== undefined ? (
            <AnimatedNumber
              value={value}
              format={format ?? ((n) => Math.round(n).toString())}
            />
          ) : (
            <Shimmer width="28px" height="16px" />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Token card (pump.fun inspired) ──

function LaunchCard({
  launch,
  selected,
  onClick,
}: {
  launch: LaunchItem;
  selected: boolean;
  onClick: () => void;
}) {
  const progressPct = launch.progressPct;
  const isGraduated = launch.graduated === 1;
  const isGraduatingSoon = !isGraduated && progressPct >= GRADUATING_SOON_PCT;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full rounded-xl border p-4 text-left transition-all duration-200",
        "hover:border-primary/40 hover:bg-card/80",
        selected
          ? "launch-card-active border-primary/40 ring-1 ring-primary/10"
          : "border-border/40 bg-card/40",
        isGraduatingSoon && !selected && "graduating-soon",
      )}
    >
      {/* Top row: avatar + ticker + age */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {/* Token avatar */}
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-mono text-[11px] font-bold uppercase transition-all",
              selected
                ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                : isGraduatingSoon
                  ? "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] ring-1 ring-[hsl(var(--warning))]/20"
                  : "bg-muted/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
            )}
          >
            {launch.ticker.slice(0, 3)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold truncate">${launch.ticker}</span>
              {isGraduated && (
                <Badge variant="warning" className="text-[8px] px-1 py-0 leading-tight">
                  <Crown className="h-2.5 w-2.5 mr-0.5" />
                  GRAD
                </Badge>
              )}
              {isGraduatingSoon && (
                <Badge variant="destructive" className="text-[8px] px-1 py-0 leading-tight animate-pulse">
                  <Flame className="h-2.5 w-2.5 mr-0.5" />
                  HOT
                </Badge>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {launch.name}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
          <Clock className="h-2.5 w-2.5" />
          {timeAgo(launch.created_at)}
        </div>
      </div>

      {/* Price + market cap */}
      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="font-mono text-lg font-semibold tabular-nums leading-none">
            {launch.currentPrice.toFixed(2)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">per token</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            MCap
          </div>
          <div className="font-mono text-xs font-medium tabular-nums">
            {(launch.supply_sold * launch.currentPrice).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Progress bar with graduation marker */}
      <div className="mt-3">
        <div className="relative h-2 w-full rounded-full bg-muted/30 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              isGraduated
                ? "bg-[hsl(var(--warning))]"
                : isGraduatingSoon
                  ? "bg-gradient-to-r from-primary to-[hsl(var(--warning))] bar-glow"
                  : "bg-primary",
            )}
            style={{ width: `${Math.min(progressPct, 100)}%` }}
          />
          {/* Graduation threshold marker */}
          <div
            className="absolute top-0 h-full w-px bg-foreground/20"
            style={{ left: `${(GRADUATION_THRESHOLD / MAX_SUPPLY) * 100}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] font-mono text-muted-foreground">
          <span>{launch.supply_sold.toLocaleString()} sold</span>
          <span
            className={cn(
              isGraduatingSoon && "text-[hsl(var(--warning))] font-medium",
            )}
          >
            {progressPct.toFixed(1)}%
          </span>
        </div>
      </div>
    </button>
  );
}

// ── Detail panel ──

function LaunchDetail({
  detail,
  curveData,
  sessionId,
  wallet,
  onTraded,
}: {
  detail: LaunchDetailResponse;
  curveData: { label: string; value: number }[];
  sessionId: string | null;
  wallet: ReturnType<typeof useWallet>;
  onTraded: () => void;
}) {
  const [side, setSide] = React.useState<"buy" | "sell">("buy");
  const [amount, setAmount] = React.useState("");
  const [trading, setTrading] = React.useState(false);
  const [tradeMsg, setTradeMsg] = React.useState<string | null>(null);

  const isGraduated = detail.graduated === 1;
  const progressPct = (detail.supply_sold / MAX_SUPPLY) * 100;
  const isGraduatingSoon = !isGraduated && progressPct >= GRADUATING_SOON_PCT;

  const presets = [100, 1_000, 10_000, 100_000];

  const handleTrade = async () => {
    if (!amount) return;
    const num = parseInt(amount, 10);
    if (num <= 0) return;
    setTrading(true);
    setTradeMsg(null);
    try {
      if (wallet.connected && wallet.executeTransaction) {
        if (side === "buy") {
          const midpoint = detail.supply_sold + Math.floor(num / 2);
          const cost = num * (1 + Math.floor(midpoint / 1000));
          const maxPrice = Math.ceil(cost * 1.1);
          const result = await wallet.executeTransaction({
            program: PROGRAM_ID,
            function: "buy_token",
            inputs: [
              `${detail.launch_id}field`,
              `${num}u64`,
              `${maxPrice}u64`,
            ],
            fee: 0.5,
          });
          setTradeMsg(`Buy submitted via Shield Wallet!\nTx: ${result?.transactionId ?? "pending"}`);
        } else {
          const records = await wallet.requestRecords(PROGRAM_ID, true) as any[];
          const holding = records.find(
            (r: any) =>
              r.data?.launch_id === detail.launch_id ||
              r.plaintext?.includes(detail.launch_id),
          );
          if (!holding) {
            setTradeMsg("No holding record found for this token in your wallet.");
            setTrading(false);
            return;
          }
          const result = await wallet.executeTransaction({
            program: PROGRAM_ID,
            function: "sell_token",
            inputs: [holding, `${num}u64`],
            fee: 0.5,
          });
          setTradeMsg(`Sell submitted via Shield Wallet!\nTx: ${result?.transactionId ?? "pending"}`);
        }
        setAmount("");
        if (sessionId) {
          api.tradeLaunch(sessionId, detail.launch_id, side, num).catch(() => {});
        }
      } else if (sessionId) {
        const result = await api.tradeLaunch(sessionId, detail.launch_id, side, num);
        setTradeMsg(result.message);
        setAmount("");
      } else {
        setTradeMsg("Connect Shield Wallet or sign in to trade.");
        setTrading(false);
        return;
      }
      onTraded();
    } catch (e) {
      setTradeMsg(e instanceof Error ? e.message : "Trade failed");
    } finally {
      setTrading(false);
    }
  };

  return (
    <>
      {/* Header with token info */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl font-mono text-sm font-bold uppercase",
                isGraduatingSoon
                  ? "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] ring-1 ring-[hsl(var(--warning))]/30"
                  : "bg-primary/15 text-primary ring-1 ring-primary/20",
              )}
            >
              {detail.ticker.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">${detail.ticker}</CardTitle>
                {isGraduated ? (
                  <Badge variant="warning" className="text-[9px]">
                    <Crown className="h-3 w-3 mr-0.5" />
                    Graduated
                  </Badge>
                ) : isGraduatingSoon ? (
                  <Badge variant="destructive" className="text-[9px] animate-pulse">
                    <Flame className="h-3 w-3 mr-0.5" />
                    {progressPct.toFixed(0)}%
                  </Badge>
                ) : (
                  <Badge variant="default" className="text-[9px]">
                    {progressPct.toFixed(1)}%
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{detail.name}</p>
            </div>
          </div>
        </div>

        {detail.description && (
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {detail.description}
          </p>
        )}

        {/* Price display */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-3xl font-bold tabular-nums tracking-tight">
            {detail.currentPrice.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">/ token</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Bonding curve chart */}
        {curveData.length > 1 ? (
          <div className="rounded-lg border border-border/30 bg-muted/10 p-2">
            <PortfolioArea
              data={curveData}
              height={120}
              showGrid={false}
              color={isGraduatingSoon ? "hsl(var(--warning))" : "hsl(var(--primary))"}
            />
          </div>
        ) : (
          <div className="dot-grid flex h-28 items-center justify-center rounded-lg text-xs text-muted-foreground">
            Bonding curve — no data yet
          </div>
        )}

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1.5">
            <span>{detail.supply_sold.toLocaleString()} / {MAX_SUPPLY.toLocaleString()}</span>
            <span className="flex items-center gap-1">
              <Trophy className="h-2.5 w-2.5" />
              {GRADUATION_THRESHOLD.toLocaleString()}
            </span>
          </div>
          <div className="relative h-2.5 w-full rounded-full bg-muted/30 overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                isGraduated
                  ? "bg-[hsl(var(--warning))]"
                  : isGraduatingSoon
                    ? "bg-gradient-to-r from-primary via-[hsl(280,100%,70%)] to-[hsl(var(--warning))] bar-glow"
                    : "bg-primary",
              )}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressPct, 100)}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            />
            <div
              className="absolute top-0 h-full w-px bg-foreground/25"
              style={{ left: `${(GRADUATION_THRESHOLD / MAX_SUPPLY) * 100}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <StatBox label="Market Cap" value={detail.marketCap.toLocaleString()} />
          <StatBox label="Supply" value={detail.supply_sold.toLocaleString()} />
          <StatBox
            label="Remaining"
            value={(MAX_SUPPLY - detail.supply_sold).toLocaleString()}
          />
        </div>

        {/* Buy/Sell form */}
        {!isGraduated && (
          <div className="rounded-lg border border-border/40 bg-card/60 p-3 space-y-3">
            {/* Buy/Sell toggle */}
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted/30 p-0.5">
              <button
                onClick={() => setSide("buy")}
                className={cn(
                  "rounded-md py-2 text-xs font-semibold transition-all",
                  side === "buy"
                    ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <ArrowUpRight className="inline h-3.5 w-3.5 mr-1" />
                Buy
              </button>
              <button
                onClick={() => setSide("sell")}
                className={cn(
                  "rounded-md py-2 text-xs font-semibold transition-all",
                  side === "sell"
                    ? "bg-destructive/15 text-destructive shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <ArrowDownRight className="inline h-3.5 w-3.5 mr-1" />
                Sell
              </button>
            </div>

            {/* Quick-amount presets */}
            <div className="flex gap-1.5">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount(p.toString())}
                  className={cn(
                    "flex-1 rounded-md border py-1.5 font-mono text-[10px] font-medium transition-all",
                    amount === p.toString()
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                >
                  {p >= 1000 ? `${p / 1000}K` : p}
                </button>
              ))}
            </div>

            {/* Amount input */}
            <Input
              type="number"
              placeholder="Custom amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono text-sm h-9"
            />

            {/* Cost estimate */}
            {amount && parseInt(amount, 10) > 0 && (
              <div className="flex justify-between text-[11px] text-muted-foreground px-1">
                <span>Est. {side === "buy" ? "cost" : "refund"}</span>
                <span className="font-mono tabular-nums">
                  {(() => {
                    const num = parseInt(amount, 10);
                    if (side === "buy") {
                      const mid = detail.supply_sold + num / 2;
                      return (num * (1 + mid / 1000)).toFixed(0);
                    }
                    const mid = detail.supply_sold - num / 2;
                    return (num * (1 + Math.max(0, mid) / 1000)).toFixed(0);
                  })()}{" "}
                  microcredits
                </span>
              </div>
            )}

            {/* Execute button */}
            <Button
              onClick={handleTrade}
              disabled={trading || !amount || parseInt(amount, 10) <= 0 || (!sessionId && !wallet.connected)}
              className={cn(
                "w-full font-semibold transition-all",
                side === "buy"
                  ? "bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-background shadow-[0_0_20px_hsl(var(--success)/0.2)]"
                  : "bg-destructive hover:bg-destructive/90 shadow-[0_0_20px_hsl(var(--destructive)/0.2)]",
              )}
              size="sm"
            >
              {trading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {side === "buy" ? "Buying..." : "Selling..."}
                </span>
              ) : wallet.connected ? (
                `${side === "buy" ? "Buy" : "Sell"} $${detail.ticker} via Shield`
              ) : (
                `${side === "buy" ? "Buy" : "Sell"} $${detail.ticker}`
              )}
            </Button>

            {tradeMsg && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "rounded-md border p-2.5 text-[11px] font-mono whitespace-pre-wrap",
                  tradeMsg.includes("submitted") || tradeMsg.includes("BUY") || tradeMsg.includes("SELL")
                    ? "border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5 text-[hsl(var(--success))]"
                    : "border-border/40 bg-muted/30 text-muted-foreground",
                )}
              >
                {tradeMsg}
              </motion.div>
            )}
          </div>
        )}

        {isGraduated && (
          <div className="rounded-lg border border-[hsl(var(--warning))]/20 bg-[hsl(var(--warning))]/5 p-3 text-center">
            <Crown className="h-5 w-5 text-[hsl(var(--warning))] mx-auto mb-1" />
            <p className="text-xs font-medium text-[hsl(var(--warning))]">
              This token has graduated
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Bonding curve complete — trading on DEX
            </p>
          </div>
        )}

        {/* Recent trades / activity feed */}
        {detail.recentTrades.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
              <Activity className="h-3 w-3" />
              Live Activity
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto rounded-lg border border-border/30 bg-muted/5 p-2">
              {detail.recentTrades.map((t) => (
                <div
                  key={t.id}
                  className="trade-entry flex items-center justify-between text-[11px] py-1 px-1.5 rounded-md hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full",
                        t.side === "buy"
                          ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]"
                          : "bg-destructive/15 text-destructive",
                      )}
                    >
                      {t.side === "buy" ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "font-mono font-medium uppercase",
                        t.side === "buy" ? "text-[hsl(var(--success))]" : "text-destructive",
                      )}
                    >
                      {t.side}
                    </span>
                    <span className="font-mono tabular-nums text-foreground">
                      {t.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-mono tabular-nums">
                      @{t.price_avg.toFixed(2)}
                    </span>
                    <span className="text-[9px]">{timeAgo(t.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/30 bg-muted/10 px-2.5 py-2">
      <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground leading-none">
        {label}
      </div>
      <div className="mt-1 font-mono text-xs font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}

// ── Create launch modal ──

function CreateLaunchModal({
  sessionId,
  wallet,
  onClose,
  onCreated,
}: {
  sessionId: string | null;
  wallet: ReturnType<typeof useWallet>;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = React.useState("");
  const [ticker, setTicker] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ticker.trim()) return;
    if (!sessionId && !wallet.connected) return;
    setCreating(true);
    setError(null);
    try {
      const raw = `${name.trim()}-${ticker.trim()}-${Date.now()}`;
      let hash = 0n;
      for (let i = 0; i < raw.length; i++) {
        hash = (hash * 31n + BigInt(raw.charCodeAt(i))) % (2n ** 128n);
      }
      const launchId = hash.toString();
      const launchIdField = `${launchId}field`;

      let txId: string | undefined;

      if (wallet.connected && wallet.executeTransaction) {
        const result = await wallet.executeTransaction({
          program: PROGRAM_ID,
          function: "create_launch",
          inputs: [launchIdField],
          fee: 0.5,
        });
        txId = result?.transactionId;
      }

      if (sessionId) {
        await api.createLaunch(
          sessionId,
          name.trim(),
          ticker.trim().toUpperCase(),
          description.trim(),
          { launch_id: launchId, txId },
        );
      }

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create launch");
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md rounded-xl border border-border/60 bg-card p-6 shadow-2xl shadow-primary/5"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Rocket className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Launch a Token</h2>
            <p className="text-[11px] text-muted-foreground">
              Deploy a bonding curve on Aleo
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Token Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ghost Dog"
              className="mt-1"
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Ticker (max 6 chars)
            </label>
            <Input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="GDOG"
              className="mt-1 font-mono uppercase"
              maxLength={6}
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Description
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="The spookiest meme token on Aleo"
              className="mt-1"
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive"
            >
              {error}
            </motion.div>
          )}

          <Button
            type="submit"
            disabled={creating || !name.trim() || !ticker.trim() || (!sessionId && !wallet.connected)}
            className="w-full shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
          >
            {creating ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Deploying...
              </span>
            ) : wallet.connected ? (
              <>
                <Rocket className="h-4 w-4 mr-1.5" />
                Launch via Shield Wallet
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4 mr-1.5" />
                Launch Token
              </>
            )}
          </Button>

          {!wallet.connected && (
            <p className="text-[10px] text-center text-muted-foreground">
              Connect Shield Wallet for on-chain deployment
            </p>
          )}
        </form>
      </motion.div>
    </motion.div>
  );
}
