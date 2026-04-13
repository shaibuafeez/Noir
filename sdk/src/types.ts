/**
 * Noir Protocol SDK — Type definitions.
 */

// ── Network ──

export type AleoNetwork = "testnet" | "mainnet";

export interface NetworkConfig {
  network: AleoNetwork;
  apiUrl: string;
  explorerUrl: string;
  label: string;
  defaultPriorityFee: number;
}

export interface NoirClientOptions {
  /** Aleo private key string. Required for on-chain transactions. */
  privateKey?: string;
  /** Or pass a pre-built Account instance. */
  account?: any; // Account from @provablehq/sdk
  /** Network to use. Default: "testnet" */
  network?: AleoNetwork;
  /** Override default priority fee (in credits). */
  priorityFee?: number;
}

// ── Trade ──

export interface TokenInfo {
  symbol: string;
  fieldId: string;
  decimals: number;
  isStablecoin: boolean;
}

export interface TransactionResult {
  txHash: string;
  message: string;
}

export interface SwapResult extends TransactionResult {
  action: "buy" | "sell";
  tokenSymbol: string;
  amount: number;
  price: number;
}

// ── Launchpad ──

export interface OnChainLaunchState {
  supplySold: number;
  graduated: boolean;
  creator: string | null;
}

export interface BondingCurveQuote {
  amount: number;
  totalCost: number;
  averagePrice: number;
  newSupply: number;
  graduated: boolean;
}

export interface CreateLaunchResult {
  launchId: string;
  name: string;
  ticker: string;
  txHash?: string;
  message: string;
}

export interface LaunchTradeResult {
  success: boolean;
  txHash?: string;
  message: string;
}

// ── zkLogin ──

export interface ZkLoginCredential {
  commitment: string;
  issuer: string;
  subject: string;
}

// ── Indicators ──

export interface RSIResult {
  value: number;
  signal: "oversold" | "neutral" | "overbought";
  periods: number;
}

export interface BollingerResult {
  upper: number;
  middle: number;
  lower: number;
  position: "below_lower" | "lower_half" | "upper_half" | "above_upper";
  bandwidth: number;
  periods: number;
}

export interface SMAResult {
  value: number;
  periods: number;
}
