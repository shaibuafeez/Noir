/**
 * @noir-protocol/sdk — TypeScript SDK for Noir Protocol on Aleo.
 *
 * Private trading, launchpad bonding curves, zkLogin, and technical indicators.
 */

// ── Main client ──
export { NoirClient } from "./client.js";

// ── Types ──
export type {
  AleoNetwork,
  NetworkConfig,
  NoirClientOptions,
  TokenInfo,
  TransactionResult,
  SwapResult,
  OnChainLaunchState,
  BondingCurveQuote,
  CreateLaunchResult,
  LaunchTradeResult,
  ZkLoginCredential,
  RSIResult,
  BollingerResult,
  SMAResult,
} from "./types.js";

// ── Constants ──
export { PROGRAMS, LAUNCHPAD, TRADE, NETWORKS } from "./constants.js";

// ── Errors ──
export {
  NoirError,
  NetworkError,
  TransactionError,
  ValidationError,
  InsufficientFundsError,
  LaunchpadError,
} from "./errors.js";

// ── Network ──
export { resolveNetworkConfig } from "./network/index.js";
export { ExplorerClient } from "./network/index.js";

// ── Trade ──
export { TradeClient } from "./trade/index.js";
export {
  getToken,
  getAllTokens,
  getTradableTokens,
  tokenToField,
  fieldToToken,
  registerToken,
} from "./trade/index.js";

// ── Launchpad ──
export { LaunchpadClient } from "./launchpad/index.js";
export {
  getBondingPrice,
  getBuyCost,
  getSellRefund,
  getMarketCap,
  getProgress,
  isGraduated,
  quoteBuy,
  quoteSell,
} from "./launchpad/index.js";

// ── zkLogin ──
export { ZkLoginClient } from "./zklogin/index.js";
export { computeCommitment, computeCommitmentSync } from "./zklogin/index.js";

// ── Indicators ──
export { rsi } from "./indicators/index.js";
export { bollinger } from "./indicators/index.js";
export { sma } from "./indicators/index.js";
export { round4, percentChange } from "./indicators/index.js";
