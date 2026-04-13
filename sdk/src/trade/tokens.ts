/**
 * Token registry — supported tokens for ghost_trade_v2.aleo.
 */

import type { TokenInfo } from "../types.js";

const REGISTRY: TokenInfo[] = [
  { symbol: "ALEO", fieldId: "1field", decimals: 6, isStablecoin: false },
  { symbol: "BTC", fieldId: "3field", decimals: 8, isStablecoin: false },
  { symbol: "ETH", fieldId: "4field", decimals: 18, isStablecoin: false },
  { symbol: "SOL", fieldId: "5field", decimals: 9, isStablecoin: false },
  { symbol: "DOGE", fieldId: "6field", decimals: 8, isStablecoin: false },
  { symbol: "USDT", fieldId: "2field", decimals: 6, isStablecoin: true },
  { symbol: "USDC", fieldId: "7field", decimals: 6, isStablecoin: true },
];

const bySymbol = new Map<string, TokenInfo>();
const byField = new Map<string, TokenInfo>();

for (const t of REGISTRY) {
  bySymbol.set(t.symbol, t);
  byField.set(t.fieldId, t);
}

/** Get token info by symbol. */
export function getToken(symbol: string): TokenInfo | undefined {
  return bySymbol.get(symbol.toUpperCase());
}

/** Get all registered tokens. */
export function getAllTokens(): TokenInfo[] {
  return [...REGISTRY];
}

/** Get tradable (non-stablecoin) tokens. */
export function getTradableTokens(): TokenInfo[] {
  return REGISTRY.filter((t) => !t.isStablecoin);
}

/** Convert token symbol to its on-chain field ID. Returns "0field" if unknown. */
export function tokenToField(symbol: string): string {
  return bySymbol.get(symbol.toUpperCase())?.fieldId ?? "0field";
}

/** Convert on-chain field ID to token symbol. */
export function fieldToToken(fieldId: string): string | undefined {
  return byField.get(fieldId)?.symbol;
}

/**
 * Register a custom token. Useful for tokens not in the default registry.
 * Overwrites existing entry if symbol already exists.
 */
export function registerToken(token: TokenInfo): void {
  const normalized = { ...token, symbol: token.symbol.toUpperCase() };
  bySymbol.set(normalized.symbol, normalized);
  byField.set(normalized.fieldId, normalized);
  // Add to REGISTRY if not present
  const idx = REGISTRY.findIndex((t) => t.symbol === normalized.symbol);
  if (idx >= 0) REGISTRY[idx] = normalized;
  else REGISTRY.push(normalized);
}
