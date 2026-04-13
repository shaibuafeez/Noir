"use client";

import { ConnectWallet } from "@/components/connect-wallet";

export function DocsHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-3 border-b border-border/40 bg-background/70 px-6 backdrop-blur-xl">
      <ConnectWallet />
    </header>
  );
}
