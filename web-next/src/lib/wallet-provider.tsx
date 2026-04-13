"use client";

import * as React from "react";
import {
  AleoWalletProvider,
  useWallet,
} from "@provablehq/aleo-wallet-adaptor-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@provablehq/aleo-wallet-adaptor-react-ui";
import { ShieldWalletAdapter } from "@provablehq/aleo-wallet-adaptor-shield";

import "@provablehq/aleo-wallet-adaptor-react-ui/dist/styles.css";

export function AleoWalletWrapper({ children }: { children: React.ReactNode }) {
  const wallets = React.useMemo(
    () => (typeof window !== "undefined" ? [new ShieldWalletAdapter()] : []),
    [],
  );
  return (
    <AleoWalletProvider
      wallets={wallets}
      network={"testnet" as any}
      autoConnect
      decryptPermission={"DECRYPT_UPON_REQUEST" as any}
      programs={[
        "credits.aleo",
        "ghost_launchpad_v2.aleo",
        "ghost_trade_v3.aleo",
        "test_usdcx_stablecoin.aleo",
      ]}
    >
      <WalletModalProvider>
        {children}
      </WalletModalProvider>
    </AleoWalletProvider>
  );
}

export { useWallet, WalletMultiButton };
