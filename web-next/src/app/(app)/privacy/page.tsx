"use client";

import * as React from "react";
import {
  Fingerprint,
  Shield,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Cpu,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
  AnimatedNumber,
  PageWrapper,
  Shimmer,
  GlassCard,
} from "@/components/motion";
import { cn } from "@/lib/utils";
import { api, useApi } from "@/lib/api";
import { useWs } from "@/lib/ws-context";
import { useWallet } from "@/lib/wallet-provider";
import type { PrivacySummary, ProofCapability } from "@/lib/api";

/* ─── Score Ring ─── */
function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color =
    score > 70
      ? "hsl(var(--success))"
      : score > 40
        ? "hsl(45 100% 60%)"
        : "hsl(var(--destructive))";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--border)/0.2)"
          strokeWidth={6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber
          value={score}
          format={(n) => Math.round(n).toString()}
          className="text-3xl font-bold tabular-nums"
        />
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          / 100
        </span>
      </div>
    </div>
  );
}

/* ─── Checklist Item ─── */
function CheckItem({
  label,
  active,
  description,
}: {
  label: string;
  active: boolean;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      {active ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--success))]" />
      ) : (
        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
      )}
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-sm font-medium",
            active ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {label}
        </div>
        <div className="text-xs text-muted-foreground/70">{description}</div>
      </div>
    </div>
  );
}

/* ─── Contract Row ─── */
function ContractRow({
  name,
  status,
  functions,
}: {
  name: string;
  status: string;
  functions: number;
}) {
  const network = "testnet";
  const explorerUrl = `https://explorer.provable.com/${network}/program/${name}`;
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/30 bg-background/30 p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5 text-primary/60" />
          <span className="font-mono text-xs text-foreground">{name}</span>
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">
          {functions} transitions
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className="border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5 text-[hsl(var(--success))] text-[10px]"
        >
          {status.toUpperCase()}
        </Badge>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground transition-colors hover:text-primary"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

/* ─── Proof Capability Row ─── */
function ProofRow({ cap }: { cap: ProofCapability }) {
  const programShort = cap.program.replace(".aleo", "");
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/20 bg-background/20 p-3 transition-colors hover:border-primary/20 hover:bg-primary/[0.02]">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <Lock className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {cap.name}
          </span>
          <Badge variant="outline" className="text-[9px] font-mono px-1.5">
            {programShort}
          </Badge>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {cap.description}
        </div>
        <div className="mt-1 font-mono text-[10px] text-primary/50">
          fn {cap.fn}()
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function PrivacyPage() {
  const { sessionId } = useWs();
  const shield = useWallet();
  const privacy = useApi(
    () => api.privacySummary(sessionId!),
    [sessionId],
    Boolean(sessionId),
  );

  const data = privacy.data;
  const loading = privacy.loading;

  return (
    <PageWrapper className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Fingerprint className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Privacy</h1>
            <p className="text-xs text-muted-foreground">
              Zero-Knowledge Protected on Aleo
            </p>
          </div>
        </div>
      </FadeIn>

      {/* KPI Row */}
      <StaggerContainer className="grid gap-4 sm:grid-cols-3">
        {/* Privacy Score */}
        <StaggerItem>
          <Card className="card-shine border-border/40 bg-card/60">
            <CardContent className="flex flex-col items-center p-6">
              {loading ? (
                <Shimmer width="140px" height="140px" className="rounded-full" />
              ) : (
                <ScoreRing score={data?.privacyScore ?? 0} />
              )}
              <div className="mt-3 text-xs font-medium text-muted-foreground">
                Privacy Score
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        {/* ZK Trades */}
        <StaggerItem>
          <Card className="card-shine border-border/40 bg-card/60">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <EyeOff className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">
                  ZK Trades
                </span>
              </div>
              {loading ? (
                <Shimmer width="80px" height="36px" className="mt-3" />
              ) : (
                <>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <AnimatedNumber
                      value={data?.breakdown.zkTradesCount ?? 0}
                      format={(n) => Math.round(n).toString()}
                      className="text-2xl font-bold tabular-nums"
                    />
                    <span className="text-sm text-muted-foreground">
                      / {data?.breakdown.totalTrades ?? 0}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {data && data.breakdown.totalTrades > 0
                      ? `${Math.round((data.breakdown.zkTradesCount / data.breakdown.totalTrades) * 100)}% on-chain verified`
                      : "No trades yet"}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Protections Active */}
        <StaggerItem>
          <Card className="card-shine border-border/40 bg-card/60">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">
                  Protections
                </span>
              </div>
              {loading ? (
                <Shimmer width="80px" height="36px" className="mt-3" />
              ) : (
                <>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <AnimatedNumber
                      value={data?.breakdown.activeStrategies ?? 0}
                      format={(n) => Math.round(n).toString()}
                      className="text-2xl font-bold tabular-nums"
                    />
                    <span className="text-sm text-muted-foreground">
                      active
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Automated strategies + wallet guard
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Two-column grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Privacy Breakdown */}
        <FadeIn delay={0.1}>
          <Card className="border-border/40 bg-card/60">
            <CardContent className="p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Eye className="h-4 w-4 text-primary" />
                Privacy Breakdown
              </h2>
              {loading ? (
                <div className="mt-4 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Shimmer key={i} height="40px" />
                  ))}
                </div>
              ) : (
                <div className="mt-3 divide-y divide-border/20">
                  <CheckItem
                    label="zkLogin Authentication"
                    active={data?.breakdown.zkLoginActive ?? false}
                    description="OAuth identity linked via BHP256 commitment — no email/password exposed on-chain"
                  />
                  <CheckItem
                    label="Shield Wallet Connected"
                    active={
                      (data?.breakdown.shieldWallet ?? false) ||
                      shield.connected
                    }
                    description="Hardware-grade key management with private transaction signing"
                  />
                  <CheckItem
                    label="On-chain ZK Trades"
                    active={(data?.breakdown.zkTradesCount ?? 0) > 0}
                    description="Trades executed as zero-knowledge proofs — amounts and tokens hidden"
                  />
                  <CheckItem
                    label="Private Mode (Go Dark)"
                    active={(data?.breakdown.godarks ?? 0) > 0}
                    description="Assets moved from public to private records via transfer_public_to_private"
                  />
                  <CheckItem
                    label="Automated Strategies"
                    active={(data?.breakdown.activeStrategies ?? 0) > 0}
                    description="DCA, limits, alerts, and rebalancing running autonomously"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Deployed Contracts */}
        <FadeIn delay={0.15}>
          <Card className="border-border/40 bg-card/60">
            <CardContent className="p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Cpu className="h-4 w-4 text-primary" />
                Deployed Smart Contracts
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Leo programs verified on Aleo testnet
              </p>
              {loading ? (
                <div className="mt-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Shimmer key={i} height="56px" />
                  ))}
                </div>
              ) : (
                <div className="mt-4 space-y-2.5">
                  {data?.contracts.map((c) => (
                    <ContractRow
                      key={c.name}
                      name={c.name}
                      status={c.status}
                      functions={c.functions}
                    />
                  ))}
                </div>
              )}

              {/* Contract Highlights */}
              <div className="mt-4 rounded-lg border border-primary/10 bg-primary/[0.03] p-3">
                <div className="text-[10px] font-mono uppercase tracking-widest text-primary/60">
                  Security Features
                </div>
                <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-primary/50" />
                    Access-controlled minting with admin authorization
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-primary/50" />
                    Overflow guards on all arithmetic operations
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-primary/50" />
                    BHP256 commitment proofs for identity verification
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-primary/50" />
                    Treasury accounting with slippage protection
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* ZK Proof Capabilities */}
      <FadeIn delay={0.2}>
        <Card className="border-border/40 bg-card/60">
          <CardContent className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Zap className="h-4 w-4 text-primary" />
              ZK Proof Capabilities
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Available zero-knowledge proofs across all deployed programs
            </p>
            {loading ? (
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Shimmer key={i} height="80px" />
                ))}
              </div>
            ) : (
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {data?.proofCapabilities.map((cap) => (
                  <ProofRow key={cap.fn} cap={cap} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </PageWrapper>
  );
}
