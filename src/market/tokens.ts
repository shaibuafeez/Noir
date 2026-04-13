/**
 * Token registry — single source of truth for supported tokens.
 */

export interface TokenInfo {
  symbol: string;
  fieldId: string;
  coingeckoId: string;
  decimals: number;
  isStablecoin: boolean;
  programId?: string;
  pythFeedId?: string;
}

const REGISTRY: TokenInfo[] = [
  { symbol: "ALEO", fieldId: "1field", coingeckoId: "aleo", decimals: 6, isStablecoin: false },
  { symbol: "BTC",  fieldId: "3field", coingeckoId: "bitcoin", decimals: 8, isStablecoin: false,
    pythFeedId: "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43" },
  { symbol: "ETH",  fieldId: "4field", coingeckoId: "ethereum", decimals: 18, isStablecoin: false,
    pythFeedId: "ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace" },
  { symbol: "SOL",  fieldId: "5field", coingeckoId: "solana", decimals: 9, isStablecoin: false,
    pythFeedId: "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d" },
  { symbol: "DOGE", fieldId: "6field", coingeckoId: "dogecoin", decimals: 8, isStablecoin: false,
    pythFeedId: "dcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c" },
  { symbol: "USDT", fieldId: "2field", coingeckoId: "tether", decimals: 6, isStablecoin: true },
  { symbol: "USDC", fieldId: "7field", coingeckoId: "usd-coin", decimals: 6, isStablecoin: true, programId: "test_usdcx_stablecoin.aleo" },
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
