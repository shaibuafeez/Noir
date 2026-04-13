"use client";

import * as React from "react";
import { Zap, ArrowDownLeft, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useWs } from "@/lib/ws-context";
import { useWallet } from "@/lib/wallet-provider";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Status = "idle" | "creating" | "funding" | "active" | "reclaiming";

export function SessionWalletBanner() {
  const { sessionId } = useWs();
  const { connected: shieldConnected, address: shieldAddress, executeTransaction } =
    useWallet();
  const [status, setStatus] = React.useState<Status>("idle");
  const [sessionAddress, setSessionAddress] = React.useState<string | null>(null);
  const [fundedAmount, setFundedAmount] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  // Check for existing session wallet on mount
  React.useEffect(() => {
    if (!sessionId) return;
    api
      .getSessionWallet(sessionId)
      .then((info) => {
        if (info.active && info.sessionAddress) {
          setSessionAddress(info.sessionAddress);
          setFundedAmount(info.fundedAmount ?? 0);
          setStatus("active");
        }
      })
      .catch(() => {});
  }, [sessionId]);

  // Don't show if Shield Wallet is not connected or no session
  if (!shieldConnected || !shieldAddress || !sessionId) return null;

  if (status === "reclaiming") {
    return (
      <BannerShell>
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm">Reclaiming funds...</span>
      </BannerShell>
    );
  }

  if (status === "active") {
    return (
      <ActiveBanner
        sessionAddress={sessionAddress!}
        fundedAmount={fundedAmount}
        onReclaim={async () => {
          setStatus("reclaiming");
          setError(null);
          try {
            await api.reclaimSessionWallet(sessionId);
            setStatus("idle");
            setSessionAddress(null);
            setFundedAmount(0);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Reclaim failed");
            setStatus("active");
          }
        }}
      />
    );
  }

  const handleEnable = async () => {
    setStatus("creating");
    setError(null);
    try {
      // 1. Create session wallet
      const { sessionAddress: addr } = await api.createSessionWallet(
        sessionId,
        shieldAddress,
      );
      setSessionAddress(addr);
      setStatus("funding");

      // 2. Prompt user to fund via Shield Wallet (1 ALEO = 1_000_000 microcredits)
      const fundAmount = 1_000_000; // 1 ALEO default
      await executeTransaction({
        program: "credits.aleo",
        function: "transfer_public",
        inputs: [addr, `${fundAmount}u64`],
        fee: 0.5,
      });

      setFundedAmount(fundAmount);
      setStatus("active");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to enable AI trading");
      setStatus("idle");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 backdrop-blur-sm">
          <Zap className="h-4 w-4 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">Enable AI Trading</p>
            <p className="text-xs text-muted-foreground">
              Fund a session wallet so your agent can trade autonomously
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleEnable}
            disabled={status !== "idle"}
            className="h-8 gap-1.5"
          >
            {status === "creating" || status === "funding" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {status === "creating" ? "Creating..." : "Funding..."}
              </>
            ) : (
              <>
                <Wallet className="h-3.5 w-3.5" />
                Fund 1 ALEO
              </>
            )}
          </Button>
        </div>
        {error && (
          <p className="mb-2 px-1 text-xs text-destructive">{error}</p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function ActiveBanner({
  sessionAddress,
  fundedAmount,
  onReclaim,
}: {
  sessionAddress: string;
  fundedAmount: number;
  onReclaim: () => void;
}) {
  const credits = (fundedAmount / 1_000_000).toFixed(2);
  return (
    <div className="mb-3 flex items-center gap-3 rounded-xl border border-[hsl(var(--success))]/20 bg-[hsl(var(--success))]/5 px-4 py-3 backdrop-blur-sm">
      <Zap className="h-4 w-4 shrink-0 text-[hsl(var(--success))]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">AI Trading Active</p>
          <Badge variant="outline" className="h-5 text-[10px]">
            {credits} ALEO
          </Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground font-mono">
          {sessionAddress.slice(0, 12)}...{sessionAddress.slice(-6)}
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onReclaim}
        className="h-8 gap-1.5"
      >
        <ArrowDownLeft className="h-3.5 w-3.5" />
        Reclaim
      </Button>
    </div>
  );
}

function BannerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3 rounded-xl border border-border/40 bg-muted/10 px-4 py-3 backdrop-blur-sm">
      {children}
    </div>
  );
}
