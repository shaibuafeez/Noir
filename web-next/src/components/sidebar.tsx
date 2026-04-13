"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Zap,
  BarChart3,
  History,
  Eclipse,
  Wifi,
  WifiOff,
  LogOut,
  Copy,
  Check,
  Rocket,
  BookOpen,
  Fingerprint,
} from "lucide-react";
import { cn, shortAddress, formatUsd } from "@/lib/utils";
import { useWs } from "@/lib/ws-context";
import { ConnectWallet } from "./connect-wallet";
import { motion } from "framer-motion";
import { PulseGlow } from "./motion";
import { api, useApi } from "@/lib/api";
import { useWallet } from "@/lib/wallet-provider";
import { Shield } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/launchpad", label: "Launchpad", icon: Rocket },
  { href: "/strategies", label: "Strategies", icon: Zap },
  { href: "/market", label: "Market", icon: BarChart3 },
  { href: "/history", label: "History", icon: History },
  { href: "/privacy", label: "Privacy", icon: Fingerprint },
  { href: "/docs", label: "Docs", icon: BookOpen },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { connected, walletAddress, sessionId, authSession, signOut } = useWs();
  const shield = useWallet();
  const balance = useApi(
    () => api.balance(sessionId!),
    [sessionId],
    Boolean(sessionId),
  );
  const usdcxBalance = useApi(
    () => api.balanceUsdcx(sessionId!),
    [sessionId],
    Boolean(sessionId),
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border/60 bg-card/40 backdrop-blur-xl lg:block">
      <div className="flex h-full flex-col">
        {/* Logo + Connect */}
        <div className="flex h-16 items-center justify-between border-b border-border/40 px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/25">
              <Eclipse className="h-4 w-4 text-primary" />
              <div className="absolute -inset-1 -z-10 rounded-lg bg-primary/5 blur-md" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">Noir</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                aleo · private
              </span>
            </div>
          </div>
          <div className="ml-auto shrink-0">
            {shield.connected ? (
              <button
                onClick={() => shield.disconnect()}
                className="flex items-center gap-1.5 rounded-md border border-border/40 bg-card/40 px-2 py-1.5 text-[10px] font-mono text-primary/80 transition-all hover:border-destructive/30 hover:text-destructive"
                title="Disconnect Shield Wallet"
              >
                <Shield className="h-3 w-3" />
                {shield.address ? shortAddress(shield.address, 4) : "Connected"}
              </button>
            ) : !authSession ? (
              <ConnectWallet compact />
            ) : null}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {/* Active indicator bar */}
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-accent/80 ring-1 ring-primary/10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  {item.label}
                </span>
                {active && (
                  <span className="relative ml-auto">
                    <PulseGlow color="primary" size={5} />
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer — status + wallet */}
        <div className="border-t border-border/40 p-4">
          <div className="flex items-center gap-2 text-xs">
            {connected ? (
              <>
                <PulseGlow color="success" size={5} />
                <span className="font-mono text-[hsl(var(--success))] tracking-wider">
                  CONNECTED
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-destructive" />
                <span className="font-mono text-destructive tracking-wider">
                  OFFLINE
                </span>
              </>
            )}
          </div>

          {authSession ? (
            <div className="mt-3 rounded-lg border border-border/40 bg-background/40 p-3">
              <div className="flex items-center gap-2">
                {authSession.picture && (
                  <img
                    src={authSession.picture}
                    alt=""
                    className="h-6 w-6 rounded-full ring-1 ring-border/40"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">
                    {authSession.name || authSession.email}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    zkLogin wallet
                  </div>
                </div>
              </div>
              {walletAddress && (
                <CopyAddress address={walletAddress} />
              )}
              <BalanceDisplay credits={balance.data?.balanceCredits ?? 0} usdcx={usdcxBalance.data?.balanceUsdcx ?? 0} loading={balance.loading} usdcxLoading={usdcxBalance.loading} />
              <button
                onClick={signOut}
                className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-md border border-border/40 px-2 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground transition-all duration-200 hover:border-destructive/30 hover:text-destructive hover:bg-destructive/5"
              >
                <LogOut className="h-3 w-3" />
                Disconnect
              </button>
            </div>
          ) : walletAddress ? (
            <div className="mt-3 rounded-lg border border-border/40 bg-background/40 p-3">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                wallet
              </div>
              <CopyAddress address={walletAddress} />
              <BalanceDisplay credits={balance.data?.balanceCredits ?? 0} usdcx={usdcxBalance.data?.balanceUsdcx ?? 0} loading={balance.loading} usdcxLoading={usdcxBalance.loading} />
              <div className="mt-2.5">
                <ConnectWallet />
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <ConnectWallet />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function BalanceDisplay({
  credits,
  usdcx,
  loading,
  usdcxLoading,
}: {
  credits: number;
  usdcx?: number;
  loading: boolean;
  usdcxLoading?: boolean;
}) {
  return (
    <div className="mt-2 space-y-1.5">
      <div className="rounded-md border border-border/30 bg-background/30 p-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          ALEO Balance
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
            {loading ? (
              <span className="text-muted-foreground text-sm">...</span>
            ) : (
              credits.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })
            )}
          </span>
          {!loading && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              ALEO
            </span>
          )}
        </div>
      </div>
      <div className="rounded-md border border-border/30 bg-background/30 p-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          USDCx Balance
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
            {usdcxLoading ? (
              <span className="text-muted-foreground text-sm">...</span>
            ) : (
              `$${(usdcx ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )}
          </span>
          {!usdcxLoading && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              USDCx
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = React.useState(false);

  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="mt-2 flex w-full items-center gap-1.5 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-primary/5 group"
    >
      <span className="truncate font-mono text-[11px] text-primary/80">
        {shortAddress(address, 8)}
      </span>
      {copied ? (
        <Check className="h-3 w-3 shrink-0 text-[hsl(var(--success))]" />
      ) : (
        <Copy className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  );
}

export function MobileHeader() {
  const { connected, authSession } = useWs();
  const shield = useWallet();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/40 bg-background/60 px-4 backdrop-blur-xl lg:hidden">
      <div className="flex items-center gap-2.5">
        <div className="relative flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
          <Eclipse className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-sm font-semibold">Noir</span>
      </div>
      <div className="flex items-center gap-3">
        {shield.connected ? (
          <button
            onClick={() => shield.disconnect()}
            className="flex items-center gap-1.5 rounded-md border border-border/40 bg-card/40 px-2 py-1.5 text-[10px] font-mono text-primary/80 transition-all hover:border-destructive/30 hover:text-destructive"
          >
            <Shield className="h-3 w-3" />
            {shield.address ? shortAddress(shield.address, 4) : "Connected"}
          </button>
        ) : !authSession ? (
          <ConnectWallet compact />
        ) : null}
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest">
          {connected ? (
            <>
              <PulseGlow color="success" size={4} />
              <span className="text-[hsl(var(--success))]">online</span>
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
              <span className="text-destructive">offline</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
