/**
 * Token registry — single source of truth for supported tokens.
 */

export interface TokenInfo {
  symbol: string;
  fieldId: string;
  coingeckoId: string;
  decimals: number;
  isStablecoin: boolean;
}

const REGISTRY: TokenInfo[] = [
  { symbol: "ALEO", fieldId: "1field", coingeckoId: "aleo", decimals: 6, isStablecoin: false },
  { symbol: "BTC",  fieldId: "3field", coingeckoId: "bitcoin", decimals: 8, isStablecoin: false },
  { symbol: "ETH",  fieldId: "4field", coingeckoId: "ethereum", decimals: 18, isStablecoin: false },
  { symbol: "SOL",  fieldId: "5field", coingeckoId: "solana", decimals: 9, isStablecoin: false },
  { symbol: "DOGE", fieldId: "6field", coingeckoId: "dogecoin", decimals: 8, isStablecoin: false },
  { symbol: "USDT", fieldId: "2field", coingeckoId: "tether", decimals: 6, isStablecoin: true },
  { symbol: "USDC", fieldId: "7field", coingeckoId: "usd-coin", decimals: 6, isStablecoin: true },
];

const bySymbol = new Map<string, TokenInfo>();
const byField = new Map<string, TokenInfo>();

for (const t of REGISTRY) {
  bySymbol.set(t.symbol, t);
  byField.set(t.fieldId, t);
}

export function getToken(symbol: string): TokenInfo | undefined {
  return bySymbol.get(symbol.toUpperCase());
}

export function getAllTokens(): TokenInfo[] {
  return [...REGISTRY];
}

export function getTradableTokens(): TokenInfo[] {
  return REGISTRY.filter((t) => !t.isStablecoin);
}

export function tokenToField(symbol: string): string {
  return bySymbol.get(symbol.toUpperCase())?.fieldId ?? "0field";
}

export function fieldToToken(fieldId: string): string | undefined {
  return byField.get(fieldId)?.symbol;
}
