"use client";

import * as React from "react";
import {
  Zap,
  Target,
  Bell,
  Shield,
  Scale,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FadeIn, PageWrapper, GlassCard, Shimmer, motion } from "@/components/motion";
import { cn, formatNumber, formatUsd, timeAgo } from "@/lib/utils";
import { api, useApi } from "@/lib/api";
import { useWs } from "@/lib/ws-context";
import type {
  DcaStrategy,
  LimitOrder,
  AlertStrategy,
  ProtectionStrategy,
  RebalanceStrategy,
  CopyStrategy,
} from "@/lib/api";

export default function StrategiesPage() {
  const { sessionId } = useWs();
  const strategies = useApi(
    () => api.strategies(sessionId!),
    [sessionId],
    Boolean(sessionId),
  );

  const dca = strategies.data?.dca ?? [];
  const limits = strategies.data?.limits ?? [];
  const alerts = strategies.data?.alerts ?? [];
  const protection = strategies.data?.protection ?? [];
  const rebalance = strategies.data?.rebalance ?? [];
  const copy = strategies.data?.copy ?? [];

  const tabs = [
    { value: "dca", label: "DCA", icon: Zap, count: dca.length },
    { value: "limits", label: "Limits", icon: Target, count: limits.length },
    { value: "alerts", label: "Alerts", icon: Bell, count: alerts.length },
    {
      value: "protection",
      label: "Protection",
      icon: Shield,
      count: protection.length,
    },
    {
      value: "rebalance",
      label: "Rebalance",
      icon: Scale,
      count: rebalance.length,
    },
    { value: "copy", label: "Copy", icon: Users, count: copy.length },
  ];

  return (
    <PageWrapper className="space-y-6">
      {/* Header */}
      <FadeIn>
        <h1 className="text-2xl font-semibold tracking-tight">Strategies</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Automated trading — create new strategies from chat
        </p>
      </FadeIn>

      {/* Tabs */}
      <FadeIn delay={0.1}>
        <Tabs defaultValue="dca" className="space-y-4">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1.5 bg-transparent p-0">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="group gap-2 rounded-lg border border-border/40 bg-card/40 px-3 py-2.5 text-xs font-medium backdrop-blur-sm transition-all data-[state=active]:border-primary/30 data-[state=active]:bg-primary/8 data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_12px_hsl(var(--primary)/0.06)]"
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
                <span className="ml-0.5 rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] tabular-nums group-data-[state=active]:bg-primary/15">
                  {t.count}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* DCA */}
          <TabsContent value="dca" className="space-y-3">
            {dca.length === 0 ? (
              <EmptyStrategy
                icon={Zap}
                label={
                  strategies.loading
                    ? "Loading DCA strategies..."
                    : "No DCA strategies yet — say 'DCA $50 into ALEO daily' in chat"
                }
                loading={strategies.loading}
              />
            ) : (
              dca.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <DcaCard strategy={s} />
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Limits */}
          <TabsContent value="limits" className="space-y-3">
            {limits.length === 0 ? (
              <EmptyStrategy
                icon={Target}
                label={
                  strategies.loading
                    ? "Loading limit orders..."
                    : "No limit orders yet — say 'buy 500 ALEO at $0.48' in chat"
                }
                loading={strategies.loading}
              />
            ) : (
              limits.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <LimitCard strategy={s} />
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Alerts */}
          <TabsContent value="alerts" className="space-y-3">
            {alerts.length === 0 ? (
              <EmptyStrategy
                icon={Bell}
                label={
                  strategies.loading
                    ? "Loading alerts..."
                    : "No alerts yet — say 'alert me when BTC > 70k' in chat"
                }
                loading={strategies.loading}
              />
            ) : (
              alerts.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <AlertCard strategy={s} />
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Protection */}
          <TabsContent value="protection" className="space-y-3">
            {protection.length === 0 ? (
              <EmptyStrategy
                icon={Shield}
                label={
                  strategies.loading
                    ? "Loading protection..."
                    : "No stop-loss protection yet — say 'protect my BTC at -10%' in chat"
                }
                loading={strategies.loading}
              />
            ) : (
              protection.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <ProtectionCard strategy={s} />
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Rebalance */}
          <TabsContent value="rebalance" className="space-y-3">
            {rebalance.length === 0 ? (
              <EmptyStrategy
                icon={Scale}
                label={
                  strategies.loading
                    ? "Loading rebalance plans..."
                    : "No rebalance plan yet — say 'rebalance 40% ALEO, 60% USDC' in chat"
                }
                loading={strategies.loading}
              />
            ) : (
              rebalance.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <RebalanceCard strategy={s} />
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Copy */}
          <TabsContent value="copy" className="space-y-3">
            {copy.length === 0 ? (
              <EmptyStrategy
                icon={Users}
                label={
                  strategies.loading
                    ? "Loading copy strategies..."
                    : "Not copying any traders yet — say 'copy @trader' in chat"
                }
                loading={strategies.loading}
              />
            ) : (
              copy.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <CopyCard strategy={s} />
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </FadeIn>
    </PageWrapper>
  );
}

function StrategyCard({
  children,
  status,
}: {
  children: React.ReactNode;
  status: string;
}) {
  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:border-border",
        status !== "active" && "opacity-60",
      )}
    >
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}

function IconBubble({
  icon: Icon,
}: {
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/8">
      <Icon className="h-4 w-4 text-primary" />
    </div>
  );
}

function DcaCard({ strategy: s }: { strategy: DcaStrategy }) {
  return (
    <StrategyCard status={s.status}>
      <div className="flex items-center gap-3">
        <IconBubble icon={Zap} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-medium">
              {formatUsd(s.amount)} → {s.token}
            </span>
            <Badge variant="outline" className="text-[10px]">
              {s.interval}
            </Badge>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {s.last_executed
              ? `last run ${timeAgo(s.last_executed)}`
              : "not yet executed"}{" "}
            · created {timeAgo(s.created_at)}
          </div>
        </div>
        <Badge variant={s.status === "active" ? "success" : "secondary"}>
          {s.status}
        </Badge>
      </div>
    </StrategyCard>
  );
}

function LimitCard({ strategy: s }: { strategy: LimitOrder }) {
  return (
    <StrategyCard status={s.status}>
      <div className="flex items-center gap-3">
        <IconBubble icon={Target} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-medium uppercase">
              {s.side} {formatNumber(s.amount)} {s.token}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              @ ${formatNumber(s.target_price, 4)}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            type {s.type} · created {timeAgo(s.created_at)}
          </div>
        </div>
        <Badge variant={s.status === "pending" ? "success" : "secondary"}>
          {s.status}
        </Badge>
      </div>
    </StrategyCard>
  );
}

function AlertCard({ strategy: s }: { strategy: AlertStrategy }) {
  return (
    <StrategyCard status={s.status}>
      <div className="flex items-center gap-3">
        <IconBubble icon={Bell} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-medium">{s.token}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {s.condition} ${formatNumber(s.threshold, 4)}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            action: {s.action_type}
            {s.triggered_at
              ? ` · triggered ${timeAgo(s.triggered_at)}`
              : ` · created ${timeAgo(s.created_at)}`}
          </div>
        </div>
        <Badge variant={s.status === "active" ? "success" : "secondary"}>
          {s.status}
        </Badge>
      </div>
    </StrategyCard>
  );
}

function ProtectionCard({ strategy: s }: { strategy: ProtectionStrategy }) {
  return (
    <StrategyCard status={s.status}>
      <div className="flex items-center gap-3">
        <IconBubble icon={Shield} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-medium">Stop-loss</span>
            <span className="font-mono text-xs text-muted-foreground">
              trigger at -{s.threshold}%
            </span>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {s.high_water_mark !== null
              ? `high water mark $${formatNumber(s.high_water_mark, 2)}`
              : "tracking"}{" "}
            · created {timeAgo(s.created_at)}
          </div>
        </div>
        <Badge variant={s.status === "active" ? "success" : "secondary"}>
          {s.status}
        </Badge>
      </div>
    </StrategyCard>
  );
}

function RebalanceCard({ strategy: s }: { strategy: RebalanceStrategy }) {
  const allocations = s.allocations ?? {};
  const entries = Object.entries(allocations);
  return (
    <StrategyCard status={s.status}>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <IconBubble icon={Scale} />
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-medium">Portfolio rebalance</span>
              <Badge variant="outline" className="text-[10px]">
                drift ≥ {s.drift_threshold}%
              </Badge>
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {s.last_rebalanced
                ? `last run ${timeAgo(s.last_rebalanced)}`
                : "not yet rebalanced"}{" "}
              · created {timeAgo(s.created_at)}
            </div>
          </div>
          <Badge variant={s.status === "active" ? "success" : "secondary"}>
            {s.status}
          </Badge>
        </div>
        {entries.length > 0 && (
          <div
            className="grid gap-2 border-t border-border/40 pt-3"
            style={{
              gridTemplateColumns: `repeat(${Math.min(
                entries.length,
                6,
              )}, minmax(0, 1fr))`,
            }}
          >
            {entries.map(([token, weight]) => (
              <div key={token} className="text-center">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {token}
                </div>
                <div className="font-mono text-sm font-semibold tabular-nums">
                  {weight}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StrategyCard>
  );
}

function CopyCard({ strategy: s }: { strategy: CopyStrategy }) {
  return (
    <StrategyCard status={s.status}>
      <div className="flex items-center gap-3">
        <IconBubble icon={Users} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-medium">@{s.leader_id}</span>
            <Badge variant="outline" className="text-[10px]">
              {s.mode}
              {s.fixed_amount ? ` · ${formatUsd(s.fixed_amount)}` : ""}
            </Badge>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {s.total_copied} trades mirrored · created {timeAgo(s.created_at)}
          </div>
        </div>
        <Badge variant={s.status === "active" ? "success" : "secondary"}>
          {s.status}
        </Badge>
      </div>
    </StrategyCard>
  );
}

function EmptyStrategy({
  icon: Icon,
  label,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        {loading ? (
          <div className="space-y-3">
            <Shimmer width="200px" height="12px" />
            <Shimmer width="160px" height="12px" />
          </div>
        ) : (
          <>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/40 bg-muted/20">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">{label}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
