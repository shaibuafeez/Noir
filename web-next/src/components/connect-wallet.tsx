"use client";

import * as React from "react";
import { Shield, X, Wallet } from "lucide-react";
import { getGoogleSignInUrl } from "@/lib/auth";
import { useWallet } from "@/lib/wallet-provider";
import { AnimatePresence, motion } from "@/components/motion";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function ConnectWallet({ compact }: { compact?: boolean } = {}) {
  const [open, setOpen] = React.useState(false);
  const wallet = useWallet();

  const handleShieldConnect = () => {
    setOpen(false);
    wallet.selectWallet("Shield Wallet" as any);
    setTimeout(() => wallet.connect("testnet" as any), 100);
  };

  if (compact) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-md border border-border/40 bg-card/40 px-2.5 py-1.5 text-xs font-medium backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/5"
        >
          <Wallet className="h-3.5 w-3.5" />
          <span>Connect</span>
        </button>
        <AnimatePresence>
          {open && <ConnectModal onClose={() => setOpen(false)} onShieldConnect={handleShieldConnect} />}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex w-full items-center justify-center gap-2.5 rounded-lg border border-border/40 bg-card/40 px-4 py-2.5 text-sm font-medium backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/5"
      >
        <Wallet className="h-4 w-4" />
        <span>Connect Wallet</span>
      </button>
      <AnimatePresence>
        {open && <ConnectModal onClose={() => setOpen(false)} onShieldConnect={handleShieldConnect} />}
      </AnimatePresence>
    </>
  );
}

function ConnectModal({
  onClose,
  onShieldConnect,
}: {
  onClose: () => void;
  onShieldConnect: () => void;
}) {
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
        className="relative w-full max-w-sm rounded-xl border border-border/60 bg-card p-6 shadow-2xl shadow-primary/5"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-base font-semibold">Connect Wallet</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose how to connect to Noir
          </p>
        </div>

        <div className="space-y-3">
          {/* Shield Wallet */}
          <button
            onClick={onShieldConnect}
            className="group flex w-full items-center gap-3 rounded-lg border border-border/40 bg-background/40 p-4 text-left transition-all duration-200 hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
              <Shield className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">Shield Wallet</div>
              <div className="text-[11px] text-muted-foreground">
                Browser extension wallet for Aleo
              </div>
            </div>
            <svg className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border/40" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          {/* Google OAuth */}
          <a
            href={getGoogleSignInUrl()}
            className="group flex w-full items-center gap-3 rounded-lg border border-border/40 bg-background/40 p-4 text-left transition-all duration-200 hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-border/30">
              <GoogleIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">Continue with Google</div>
              <div className="text-[11px] text-muted-foreground">
                zkLogin — no extension needed
              </div>
            </div>
            <svg className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
