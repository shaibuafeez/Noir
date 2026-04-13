"use client";

import * as React from "react";
import {
  Rocket,
  TrendingUp,
  Trophy,
  Activity,
  Layers,
  Signal,
  GraduationCap,
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
  Globe,
  ImagePlus,
  ChevronDown,
  Copy,
  Check,
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
  Shimmer,
  PulseGlow,
  motion,
  AnimatePresence,
} from "@/components/motion";
import { cn, timeAgo } from "@/lib/utils";
import { api, useApi } from "@/lib/api";
import type { LaunchItem, LaunchDetailResponse } from "@/lib/api";
import { useWs } from "@/lib/ws-context";
import { useWallet } from "@/lib/wallet-provider";

const MAX_SUPPLY = 1_000_000;
const GRADUATION_THRESHOLD = 800_000;
const GRADUATING_SOON_PCT = 60;

const PROGRAM_ID = "ghost_launchpad_v2.aleo";

// Social icons
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
    </svg>
  );
}

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

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (l) =>
          l.ticker.toLowerCase().includes(q) ||
          l.name.toLowerCase().includes(q),
      );
    }

    switch (filter) {
      case "new": {
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
      {/* Hero Header & Tools */}
      <FadeIn>
        <div className="flex flex-col gap-5 rounded-2xl border-2 border-primary/15 bg-card p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <span className="gradient-text">Launchpad</span>
                <PulseGlow color="primary" size={8} />
              </h1>
              <p className="mt-1 text-sm text-foreground/60 font-medium">
                Private zero-knowledge bonding curves on Aleo
              </p>
            </div>
            <Button
              onClick={() => setShowCreate(true)}
              size="default"
              className="gap-2 shadow-[0_8px_30px_-4px_hsl(var(--primary)/0.3)] rounded-full px-6 font-semibold"
            >
              <Plus className="h-4 w-4" />
              Deploy Token
            </Button>
          </div>

          <div className="h-px w-full bg-border/40" />

          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
            <div className="flex items-center divide-x-2 divide-border/30 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 scrollbar-none">
              <KpiStat icon={<Layers className="h-4 w-4" />} label="Launches" value={stats?.totalLaunches} color="primary" />
              <KpiStat icon={<Signal className="h-4 w-4" />} label="Active" value={stats?.activeLaunches} color="primary" />
              <KpiStat icon={<GraduationCap className="h-4 w-4" />} label="Graduated" value={stats?.graduatedCount} color="warning" />
              <KpiStat icon={<TrendingUp className="h-4 w-4" />} label="Volume" value={stats?.totalVolume} format={(n) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : Math.round(n).toString()} color="success" />
            </div>

            <div className="flex items-center gap-3 w-full xl:w-auto shrink-0">
              <div className="flex rounded-lg border-2 border-border/40 bg-muted/20 p-1">
                {filterTabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setFilter(t.key)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all",
                      filter === t.key
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                    )}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="relative flex-1 min-w-[180px] max-w-[260px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search ticker..."
                  className="h-9 pl-9 border-2 border-border/40 bg-card font-medium placeholder:text-muted-foreground/60 transition-colors focus-visible:border-primary/50"
                />
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Main layout: card grid + detail */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {launches.loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Shimmer key={i} height="220px" className="w-full rounded-xl" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <FadeIn>
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-card/50 py-24 px-6 text-center shadow-sm">
                {items.length === 0 ? (
                  <>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-5 shadow-inner">
                      <Rocket className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-foreground">No tokens launched yet</h3>
                    <p className="max-w-xs mt-2 mb-8 text-sm text-muted-foreground leading-relaxed">
                      Be the first to deploy a zero-knowledge token on Aleo.
                    </p>
                    <Button onClick={() => setShowCreate(true)} size="lg" className="rounded-full px-8 shadow-[0_8px_30px_-4px_hsl(var(--primary)/0.4)]">
                      Create your first token
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/40 text-muted-foreground mb-5">
                      <Filter className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-foreground">No matches found</h3>
                    <p className="text-sm text-muted-foreground mt-2">Adjust your filters or search query.</p>
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

        {/* Detail panel */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-4">
            <Card className="overflow-hidden border-2 border-border/40 shadow-xl bg-card/60 backdrop-blur-xl">
              {!detail.data ? (
                <CardContent className="flex flex-col items-center justify-center p-10 text-center h-[500px]">
                  {detail.loading ? (
                    <div className="space-y-4 w-full">
                      <Shimmer width="140px" height="28px" className="mx-auto rounded-md" />
                      <Shimmer width="90px" height="16px" className="mx-auto rounded-md" />
                      <Shimmer width="100%" height="160px" className="mt-8 rounded-xl" />
                      <div className="flex gap-3 mt-5">
                        <Shimmer width="50%" height="45px" className="rounded-lg" />
                        <Shimmer width="50%" height="45px" className="rounded-lg" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col items-center">
                      <div className="mb-10 w-full max-w-[240px] opacity-40 select-none space-y-5">
                        <div className="flex flex-col items-center gap-3">
                           <div className="h-12 w-12 rounded-xl border-2 border-dashed border-border/80" />
                           <div className="h-3 w-20 bg-muted/80 rounded-full" />
                           <div className="h-2 w-12 bg-muted/50 rounded-full" />
                        </div>
                        <div className="h-20 w-full border-b-2 border-dashed border-border/50" />
                        <div className="flex gap-2">
                           <div className="h-10 w-1/2 bg-muted/60 rounded-lg" />
                           <div className="h-10 w-1/2 bg-muted/60 rounded-lg" />
                        </div>
                      </div>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4 shadow-[0_0_30px_hsl(var(--primary)/0.15)] ring-1 ring-primary/20">
                        <Activity className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold text-lg text-foreground">Select a token</h3>
                      <p className="text-sm text-muted-foreground mt-2 max-w-[220px] mx-auto">
                        Click on any token to view its bonding curve and trade.
                      </p>
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

// ── KPI Chip ──

function KpiStat({
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
    primary: "text-primary",
    success: "text-[hsl(var(--success))]",
    warning: "text-[hsl(var(--warning))]",
  };

  return (
    <div className="flex items-center gap-3 px-5 shrink-0 first:pl-0">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-muted/40", colorMap[color])}>
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-semibold leading-none">
          {label}
        </div>
        <div className="text-xl font-bold tabular-nums mt-0.5 text-foreground leading-none">
          {value !== undefined ? (
            <AnimatedNumber
              value={value}
              format={format ?? ((n) => Math.round(n).toString())}
            />
          ) : (
            <Shimmer width="32px" height="20px" />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Token avatar ──

function TokenAvatar({
  launch,
  size = "md",
  className,
}: {
  launch: { image_url?: string; ticker: string };
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeMap = {
    sm: "h-10 w-10 text-[11px] rounded-lg",
    md: "h-12 w-12 text-sm rounded-xl",
    lg: "h-16 w-16 text-lg rounded-2xl",
  };

  if (launch.image_url) {
    return (
      <img
        src={launch.image_url}
        alt={launch.ticker}
        className={cn(sizeMap[size], "shrink-0 object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeMap[size],
        "flex shrink-0 items-center justify-center font-mono font-bold uppercase bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/20",
        className,
      )}
    >
      {launch.ticker.slice(0, 3)}
    </div>
  );
}

// ── Social link row ──

function SocialLinks({
  website,
  twitter,
  telegram,
  discord,
  compact = false,
}: {
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  compact?: boolean;
}) {
  const links = [
    { url: website, icon: Globe, label: "Website" },
    { url: twitter, icon: TwitterIcon, label: "Twitter" },
    { url: telegram, icon: TelegramIcon, label: "Telegram" },
    { url: discord, icon: DiscordIcon, label: "Discord" },
  ].filter((l) => l.url);

  if (links.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      {links.map((l) => {
        const Icon = l.icon;
        return (
          <a
            key={l.label}
            href={l.url!}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center justify-center rounded-md border border-border/40 transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
              compact ? "h-6 w-6" : "h-7 w-7",
            )}
            title={l.label}
          >
            <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
          </a>
        );
      })}
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
  const hasSocials = launch.website_url || launch.twitter_url || launch.telegram_url || launch.discord_url;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full rounded-2xl border-2 p-4 text-left transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-1 hover:border-primary/40",
        selected
          ? "border-primary/50 bg-primary/[0.04] shadow-[0_8px_30px_-4px_hsl(var(--primary)/0.15)]"
          : "border-primary/15 bg-card shadow-sm",
        isGraduatingSoon && !selected && "graduating-soon",
      )}
    >
      {/* Top row: avatar + info + age */}
      <div className="flex items-start gap-3">
        <TokenAvatar
          launch={launch}
          size="sm"
          className={cn(
            selected
              ? "ring-primary/30"
              : isGraduatingSoon
                ? "ring-[hsl(var(--warning))]/30"
                : "ring-border/40 group-hover:ring-primary/30",
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold truncate">${launch.ticker}</span>
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
          <div className="text-[11px] text-muted-foreground truncate">{launch.name}</div>
          {launch.description && (
            <div className="text-[10px] text-muted-foreground/70 truncate mt-0.5">{launch.description}</div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            {timeAgo(launch.created_at)}
          </div>
          {hasSocials && (
            <div className="flex items-center gap-0.5">
              {launch.website_url && <Globe className="h-2.5 w-2.5 text-muted-foreground/50" />}
              {launch.twitter_url && <TwitterIcon className="h-2.5 w-2.5 text-muted-foreground/50" />}
              {launch.telegram_url && <TelegramIcon className="h-2.5 w-2.5 text-muted-foreground/50" />}
            </div>
          )}
        </div>
      </div>

      {/* Price + market cap */}
      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="font-mono text-lg font-bold tabular-nums leading-none">
            {launch.currentPrice.toFixed(2)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">per token</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            MCap
          </div>
          <div className="font-mono text-xs font-semibold tabular-nums">
            {formatMarketCap(launch.supply_sold * launch.currentPrice)}
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
          <div
            className="absolute top-0 h-full w-px bg-foreground/20"
            style={{ left: `${(GRADUATION_THRESHOLD / MAX_SUPPLY) * 100}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] font-mono text-muted-foreground">
          <span>{launch.supply_sold.toLocaleString()} sold</span>
          <span className={cn(isGraduatingSoon && "text-[hsl(var(--warning))] font-medium")}>
            {progressPct.toFixed(1)}%
          </span>
        </div>
      </div>
    </button>
  );
}

function formatMarketCap(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toLocaleString();
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
  const [payWithUsdcx, setPayWithUsdcx] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const isGraduated = detail.graduated === 1;
  const progressPct = (detail.supply_sold / MAX_SUPPLY) * 100;
  const isGraduatingSoon = !isGraduated && progressPct >= GRADUATING_SOON_PCT;
  const marketCap = detail.supply_sold * detail.currentPrice;
  const hasSocials = detail.website_url || detail.twitter_url || detail.telegram_url || detail.discord_url;

  const presets = [100, 1_000, 10_000, 100_000];

  const copyLaunchId = () => {
    navigator.clipboard.writeText(detail.launch_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTrade = async () => {
    if (!amount) return;
    const num = parseInt(amount, 10);
    if (num <= 0) return;
    setTrading(true);
    setTradeMsg(null);
    try {
      if (wallet.connected && wallet.executeTransaction) {
        if (side === "buy" && payWithUsdcx) {
          const midpoint = detail.supply_sold + Math.floor(num / 2);
          const cost = num * (1 + Math.floor(midpoint / 1000));
          const usdcxAmount = BigInt(cost) * 1_000_000n;
          const treasuryAddress = wallet.address ?? "";
          const result = await wallet.executeTransaction({
            program: "test_usdcx_stablecoin.aleo",
            function: "transfer_public",
            inputs: [treasuryAddress, `${usdcxAmount}u128`],
            fee: 0.1,
          });
          setTradeMsg(`USDCx buy submitted via Shield Wallet!\nTx: ${result?.transactionId ?? "pending"}`);
        } else if (side === "buy") {
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
      {/* Token header with image */}
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <TokenAvatar launch={detail} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-xl font-bold">${detail.ticker}</CardTitle>
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
            <p className="text-xs text-muted-foreground mt-0.5">{detail.name}</p>

            {hasSocials && (
              <div className="mt-2">
                <SocialLinks
                  website={detail.website_url}
                  twitter={detail.twitter_url}
                  telegram={detail.telegram_url}
                  discord={detail.discord_url}
                />
              </div>
            )}
          </div>
        </div>

        {detail.description && (
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-3">
            {detail.description}
          </p>
        )}

        {/* Launch ID (copyable) */}
        <button
          onClick={copyLaunchId}
          className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          <span className="truncate max-w-[180px]">ID: {detail.launch_id}</span>
          {copied ? <Check className="h-2.5 w-2.5 text-[hsl(var(--success))]" /> : <Copy className="h-2.5 w-2.5" />}
        </button>

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
          <StatBox label="Market Cap" value={formatMarketCap(marketCap)} />
          <StatBox label="Supply" value={detail.supply_sold.toLocaleString()} />
          <StatBox label="Remaining" value={(MAX_SUPPLY - detail.supply_sold).toLocaleString()} />
        </div>

        {/* Buy/Sell form */}
        {!isGraduated && (
          <div className="rounded-lg border border-border/40 bg-card/60 p-3 space-y-3">
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

            {side === "buy" && wallet.connected && (
              <button
                onClick={() => setPayWithUsdcx((v) => !v)}
                className={cn(
                  "flex w-full items-center justify-center gap-1.5 rounded-md border py-1.5 text-[10px] font-mono uppercase tracking-widest transition-all",
                  payWithUsdcx
                    ? "border-[hsl(var(--success))]/40 bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
                    : "border-border/40 text-muted-foreground hover:border-primary/30",
                )}
              >
                {payWithUsdcx ? "Paying with USDCx" : "Pay with ALEO"}
              </button>
            )}

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

            <Input
              type="number"
              placeholder="Custom amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono text-sm h-9"
            />

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

// ── Create launch modal (pump.fun style) ──

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
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = React.useState("");
  const [twitterUrl, setTwitterUrl] = React.useState("");
  const [telegramUrl, setTelegramUrl] = React.useState("");
  const [discordUrl, setDiscordUrl] = React.useState("");
  const [showMore, setShowMore] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

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
          {
            launch_id: launchId,
            txId,
            image_url: imagePreview ?? undefined,
            website_url: websiteUrl.trim() || undefined,
            twitter_url: twitterUrl.trim() || undefined,
            telegram_url: telegramUrl.trim() || undefined,
            discord_url: discordUrl.trim() || undefined,
          },
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg rounded-xl border border-border/60 bg-card p-6 shadow-2xl shadow-primary/5 my-8"
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
              Deploy a bonding curve on Aleo — immutable after creation
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image upload */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Token Image
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={handleImage}
              className="hidden"
            />
            <div className="mt-1.5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "relative flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed transition-all overflow-hidden",
                  imagePreview
                    ? "border-primary/40"
                    : "border-border/60 hover:border-primary/30 hover:bg-primary/5",
                )}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-6 w-6 text-muted-foreground/60" />
                )}
              </button>
              <div className="text-[10px] text-muted-foreground space-y-0.5">
                <p>PNG, JPG, GIF, WebP</p>
                <p>Max 2MB, square recommended</p>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="text-destructive hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Name + Ticker row */}
          <div className="grid grid-cols-2 gap-3">
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
                Ticker (max 6)
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
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="The spookiest meme token on Aleo..."
              rows={2}
              className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Show more options toggle */}
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showMore && "rotate-180")} />
            {showMore ? "Hide" : "Show"} social links
          </button>

          {/* Social links (collapsible) */}
          <AnimatePresence>
            {showMore && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden space-y-3"
              >
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Globe className="h-3 w-3" /> Website
                  </label>
                  <Input
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://mytoken.xyz"
                    className="mt-1"
                    type="url"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <TwitterIcon className="h-2.5 w-2.5" /> Twitter
                    </label>
                    <Input
                      value={twitterUrl}
                      onChange={(e) => setTwitterUrl(e.target.value)}
                      placeholder="https://x.com/..."
                      className="mt-1 text-xs"
                      type="url"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <TelegramIcon className="h-2.5 w-2.5" /> Telegram
                    </label>
                    <Input
                      value={telegramUrl}
                      onChange={(e) => setTelegramUrl(e.target.value)}
                      placeholder="https://t.me/..."
                      className="mt-1 text-xs"
                      type="url"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <DiscordIcon className="h-2.5 w-2.5" /> Discord
                    </label>
                    <Input
                      value={discordUrl}
                      onChange={(e) => setDiscordUrl(e.target.value)}
                      placeholder="https://discord.gg/..."
                      className="mt-1 text-xs"
                      type="url"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info banner */}
          <div className="rounded-lg border border-border/30 bg-muted/10 p-3 text-[10px] text-muted-foreground space-y-1">
            <p className="font-medium text-foreground/80">Token parameters (fixed):</p>
            <div className="flex justify-between">
              <span>Max supply</span>
              <span className="font-mono">1,000,000</span>
            </div>
            <div className="flex justify-between">
              <span>Graduation</span>
              <span className="font-mono">800,000 tokens sold</span>
            </div>
            <div className="flex justify-between">
              <span>Starting price</span>
              <span className="font-mono">1 microcredit</span>
            </div>
            <div className="flex justify-between">
              <span>Curve</span>
              <span className="font-mono">price = 1 + supply/1000</span>
            </div>
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
            className="w-full shadow-[0_0_20px_hsl(var(--primary)/0.15)] font-semibold"
            size="lg"
          >
            {creating ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
