"use client";

import * as React from "react";
import {
  Zap,
  Target,
  Bell,
  Shield,
  Scale,
  Users,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FadeIn, PageWrapper, GlassCard, Shimmer, AnimatePresence, motion } from "@/components/motion";
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

type ModalType = "dca" | "limit" | "alert" | "protection" | "rebalance" | "copy" | null;

export default function StrategiesPage() {
  const { sessionId } = useWs();
  const strategies = useApi(
    () => api.strategies(sessionId!),
    [sessionId],
    Boolean(sessionId),
  );
  const [activeModal, setActiveModal] = React.useState<ModalType>(null);
  const [activeTab, setActiveTab] = React.useState("dca");

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

  const openModalForTab = () => {
    setActiveModal(activeTab === "limits" ? "limit" : activeTab as ModalType);
  };

  const handleCreated = () => {
    setActiveModal(null);
    strategies.reload();
  };

  return (
    <PageWrapper className="space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Strategies</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Automated trading strategies
            </p>
          </div>
          <Button onClick={openModalForTab} className="gap-2 rounded-full px-5">
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </div>
      </FadeIn>

      {/* Tabs */}
      <FadeIn delay={0.1}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
                label="No DCA strategies yet"
                description="Dollar-cost average into any token on a schedule"
                loading={strategies.loading}
                onCreateClick={() => setActiveModal("dca")}
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
                label="No limit orders yet"
                description="Set buy or sell orders at specific price targets"
                loading={strategies.loading}
                onCreateClick={() => setActiveModal("limit")}
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
                label="No alerts yet"
                description="Get notified when tokens hit price targets"
                loading={strategies.loading}
                onCreateClick={() => setActiveModal("alert")}
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
                label="No stop-loss protection yet"
                description="Automatically sell when portfolio drops below a threshold"
                loading={strategies.loading}
                onCreateClick={() => setActiveModal("protection")}
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
                label="No rebalance plan yet"
                description="Keep your portfolio at target allocations automatically"
                loading={strategies.loading}
                onCreateClick={() => setActiveModal("rebalance")}
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
                label="Not copying any traders yet"
                description="Mirror another trader's moves automatically"
                loading={strategies.loading}
                onCreateClick={() => setActiveModal("copy")}
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

      {/* Modals */}
      <AnimatePresence>
        {activeModal === "dca" && (
          <CreateDcaModal sessionId={sessionId} onClose={() => setActiveModal(null)} onCreated={handleCreated} />
        )}
        {activeModal === "limit" && (
          <CreateLimitModal sessionId={sessionId} onClose={() => setActiveModal(null)} onCreated={handleCreated} />
        )}
        {activeModal === "alert" && (
          <CreateAlertModal sessionId={sessionId} onClose={() => setActiveModal(null)} onCreated={handleCreated} />
        )}
        {activeModal === "protection" && (
          <CreateProtectionModal sessionId={sessionId} onClose={() => setActiveModal(null)} onCreated={handleCreated} />
        )}
        {activeModal === "rebalance" && (
          <CreateRebalanceModal sessionId={sessionId} onClose={() => setActiveModal(null)} onCreated={handleCreated} />
        )}
        {activeModal === "copy" && (
          <CreateCopyModal sessionId={sessionId} onClose={() => setActiveModal(null)} onCreated={handleCreated} />
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}

// ── Strategy cards ──────────────────────────────────────────────────────

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
  description,
  loading,
  onCreateClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  loading?: boolean;
  onCreateClick: () => void;
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
            <p className="font-medium text-sm">{label}</p>
            <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
            <Button
              onClick={onCreateClick}
              variant="outline"
              size="sm"
              className="mt-2 gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Create
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Modal wrapper ───────────────────────────────────────────────────────

function ModalOverlay({
  onClose,
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  onClose: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
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
        className="relative w-full max-w-md rounded-xl border border-border/60 bg-card p-6 shadow-2xl shadow-primary/5 my-8"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {children}
      </motion.div>
    </motion.div>
  );
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
      {children}
    </label>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <FormLabel>{label}</FormLabel>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function FormError({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="text-xs text-red-400">{error}</p>;
}

// ── Create DCA Modal ────────────────────────────────────────────────────

function CreateDcaModal({
  sessionId,
  onClose,
  onCreated,
}: {
  sessionId: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [token, setToken] = React.useState("ALEO");
  const [amount, setAmount] = React.useState("");
  const [interval, setInterval] = React.useState("daily");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !token.trim() || !amount) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError("Enter a valid amount"); return; }
    setSubmitting(true);
    setError(null);
    try {
      await api.createDca(sessionId, token.trim(), amt, interval);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose} icon={Zap} title="Create DCA Strategy" subtitle="Dollar-cost average on a schedule">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Token">
          <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="ALEO" />
        </FormField>
        <FormField label="Amount (USD)">
          <Input type="number" step="any" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50" />
        </FormField>
        <FormField label="Interval">
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </FormField>
        <FormError error={error} />
        <Button type="submit" disabled={submitting || !sessionId} className="w-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create DCA Strategy"}
        </Button>
      </form>
    </ModalOverlay>
  );
}

// ── Create Limit Order Modal ────────────────────────────────────────────

function CreateLimitModal({
  sessionId,
  onClose,
  onCreated,
}: {
  sessionId: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [side, setSide] = React.useState("buy");
  const [token, setToken] = React.useState("ALEO");
  const [amount, setAmount] = React.useState("");
  const [targetPrice, setTargetPrice] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !token.trim() || !amount || !targetPrice) return;
    const amt = parseFloat(amount);
    const price = parseFloat(targetPrice);
    if (isNaN(amt) || amt <= 0) { setError("Enter a valid amount"); return; }
    if (isNaN(price) || price <= 0) { setError("Enter a valid price"); return; }
    setSubmitting(true);
    setError(null);
    try {
      await api.createLimit(sessionId, side, token.trim(), amt, price);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose} icon={Target} title="Create Limit Order" subtitle="Buy or sell at a target price">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Side">
          <div className="flex gap-2">
            {(["buy", "sell"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                className={cn(
                  "flex-1 rounded-lg border py-2 text-sm font-medium transition-all",
                  side === s
                    ? s === "buy"
                      ? "border-green-500/40 bg-green-500/10 text-green-400"
                      : "border-red-500/40 bg-red-500/10 text-red-400"
                    : "border-border/40 bg-card/40 text-muted-foreground hover:bg-accent",
                )}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </FormField>
        <FormField label="Token">
          <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="ALEO" />
        </FormField>
        <FormField label="Amount">
          <Input type="number" step="any" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000" />
        </FormField>
        <FormField label="Target Price ($)">
          <Input type="number" step="any" min="0" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} placeholder="0.50" />
        </FormField>
        <FormError error={error} />
        <Button type="submit" disabled={submitting || !sessionId} className="w-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Create ${side.toUpperCase()} Order`}
        </Button>
      </form>
    </ModalOverlay>
  );
}

// ── Create Alert Modal ──────────────────────────────────────────────────

function CreateAlertModal({
  sessionId,
  onClose,
  onCreated,
}: {
  sessionId: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [token, setToken] = React.useState("ALEO");
  const [condition, setCondition] = React.useState("above");
  const [threshold, setThreshold] = React.useState("");
  const [actionType, setActionType] = React.useState("notify");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !token.trim() || !threshold) return;
    const th = parseFloat(threshold);
    if (isNaN(th) || th <= 0) { setError("Enter a valid threshold"); return; }
    setSubmitting(true);
    setError(null);
    try {
      await api.createAlert(sessionId, token.trim(), condition, th, actionType);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose} icon={Bell} title="Create Alert" subtitle="Get notified at price targets">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Token">
          <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="ALEO" />
        </FormField>
        <FormField label="Condition">
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="above">Price above</option>
            <option value="below">Price below</option>
            <option value="drops_pct">Drops by %</option>
            <option value="rises_pct">Rises by %</option>
          </select>
        </FormField>
        <FormField label={condition.includes("pct") ? "Threshold (%)" : "Threshold ($)"}>
          <Input type="number" step="any" min="0" value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder={condition.includes("pct") ? "10" : "0.50"} />
        </FormField>
        <FormField label="Action">
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="notify">Notify</option>
            <option value="sell">Auto-sell</option>
            <option value="buy">Auto-buy</option>
          </select>
        </FormField>
        <FormError error={error} />
        <Button type="submit" disabled={submitting || !sessionId} className="w-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Alert"}
        </Button>
      </form>
    </ModalOverlay>
  );
}

// ── Create Protection Modal ─────────────────────────────────────────────

function CreateProtectionModal({
  sessionId,
  onClose,
  onCreated,
}: {
  sessionId: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [threshold, setThreshold] = React.useState("10");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !threshold) return;
    const th = parseFloat(threshold);
    if (isNaN(th) || th <= 0 || th > 100) { setError("Enter a threshold between 1-100"); return; }
    setSubmitting(true);
    setError(null);
    try {
      await api.createProtection(sessionId, th);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose} icon={Shield} title="Create Stop-Loss" subtitle="Auto-sell when portfolio drops">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Threshold (%)">
          <Input type="number" step="1" min="1" max="100" value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="10" />
        </FormField>
        <p className="text-xs text-muted-foreground">
          Portfolio will be liquidated if it drops more than {threshold || "..."}% from its high water mark.
        </p>
        <FormError error={error} />
        <Button type="submit" disabled={submitting || !sessionId} className="w-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enable Protection"}
        </Button>
      </form>
    </ModalOverlay>
  );
}

// ── Create Rebalance Modal ──────────────────────────────────────────────

function CreateRebalanceModal({
  sessionId,
  onClose,
  onCreated,
}: {
  sessionId: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [rows, setRows] = React.useState([
    { token: "ALEO", pct: "60" },
    { token: "USDC", pct: "40" },
  ]);
  const [driftThreshold, setDriftThreshold] = React.useState("5");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const total = rows.reduce((s, r) => s + (parseFloat(r.pct) || 0), 0);

  const updateRow = (idx: number, field: "token" | "pct", val: string) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, { token: "", pct: "" }]);
  const removeRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) return;
    const filtered = rows.filter((r) => r.token.trim() && parseFloat(r.pct) > 0);
    if (filtered.length === 0) { setError("Add at least one allocation"); return; }
    const sum = filtered.reduce((s, r) => s + parseFloat(r.pct), 0);
    if (Math.abs(sum - 100) > 0.01) { setError(`Allocations must sum to 100% (currently ${sum}%)`); return; }
    const allocations: Record<string, number> = {};
    for (const r of filtered) allocations[r.token.trim().toUpperCase()] = parseFloat(r.pct);
    setSubmitting(true);
    setError(null);
    try {
      await api.createRebalance(sessionId, allocations, parseFloat(driftThreshold) || 5);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose} icon={Scale} title="Create Rebalance Plan" subtitle="Target allocations must sum to 100%">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <FormLabel>Allocations</FormLabel>
          {rows.map((r, i) => (
            <div key={i} className="mt-1.5 flex gap-2 items-center">
              <Input
                value={r.token}
                onChange={(e) => updateRow(i, "token", e.target.value)}
                placeholder="Token"
                className="flex-1"
              />
              <Input
                type="number"
                step="any"
                min="0"
                max="100"
                value={r.pct}
                onChange={(e) => updateRow(i, "pct", e.target.value)}
                placeholder="%"
                className="w-20"
              />
              {rows.length > 1 && (
                <button type="button" onClick={() => removeRow(i)} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium mt-1"
          >
            <Plus className="h-3 w-3" /> Add token
          </button>
          <div className={cn("text-xs font-mono tabular-nums", Math.abs(total - 100) < 0.01 ? "text-green-400" : "text-amber-400")}>
            Total: {total}%
          </div>
        </div>
        <FormField label="Drift Threshold (%)">
          <Input type="number" step="1" min="1" max="50" value={driftThreshold} onChange={(e) => setDriftThreshold(e.target.value)} placeholder="5" />
        </FormField>
        <FormError error={error} />
        <Button type="submit" disabled={submitting || !sessionId} className="w-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Rebalance Plan"}
        </Button>
      </form>
    </ModalOverlay>
  );
}

// ── Create Copy Modal ───────────────────────────────────────────────────

function CreateCopyModal({
  sessionId,
  onClose,
  onCreated,
}: {
  sessionId: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [leader, setLeader] = React.useState("");
  const [mode, setMode] = React.useState("proportional");
  const [fixedAmount, setFixedAmount] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !leader.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const fa = mode === "fixed" ? parseFloat(fixedAmount) || undefined : undefined;
      await api.createCopy(sessionId, leader.trim(), mode, fa);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose} icon={Users} title="Copy a Trader" subtitle="Mirror another trader's moves">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Leader ID">
          <Input value={leader} onChange={(e) => setLeader(e.target.value)} placeholder="trader_address_or_id" />
        </FormField>
        <FormField label="Mode">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="proportional">Proportional</option>
            <option value="fixed">Fixed amount per trade</option>
          </select>
        </FormField>
        {mode === "fixed" && (
          <FormField label="Fixed Amount ($)">
            <Input type="number" step="any" min="0" value={fixedAmount} onChange={(e) => setFixedAmount(e.target.value)} placeholder="50" />
          </FormField>
        )}
        <FormError error={error} />
        <Button type="submit" disabled={submitting || !sessionId} className="w-full">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Copying"}
        </Button>
      </form>
    </ModalOverlay>
  );
}
