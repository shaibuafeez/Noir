/**
 * Noir Protocol SDK — Constants.
 */

import type { AleoNetwork, NetworkConfig } from "./types.js";

/** On-chain program IDs. */
export const PROGRAMS = {
  TRADE: "ghost_trade_v2.aleo",
  LAUNCHPAD: "ghost_launchpad_v1.aleo",
  ZKLOGIN: "ghost_zklogin_v1.aleo",
  CREDITS: "credits.aleo",
} as const;

/** Launchpad bonding curve parameters. */
export const LAUNCHPAD = {
  MAX_SUPPLY: 1_000_000,
  GRADUATION_THRESHOLD: 800_000,
  /** Price = 1 + supply / PRICE_DIVISOR */
  PRICE_DIVISOR: 1_000,
  BASE_PRICE: 1,
} as const;

/** Trade parameters. */
export const TRADE = {
  MAX_TRADE_SIZE: 10_000,
  BASIS_POINTS_DIVISOR: 10_000,
} as const;

/** Network configurations. */
export const NETWORKS: Record<AleoNetwork, NetworkConfig> = {
  testnet: {
    network: "testnet",
    apiUrl: "https://api.explorer.provable.com/v1",
    explorerUrl: "https://api.explorer.provable.com/v1/testnet",
    label: "Aleo Testnet",
    defaultPriorityFee: 0.02,
  },
  mainnet: {
    network: "mainnet",
    apiUrl: "https://api.explorer.provable.com/v1",
    explorerUrl: "https://api.explorer.provable.com/v1/mainnet",
    label: "Aleo Mainnet",
    defaultPriorityFee: 0.05,
  },
};
