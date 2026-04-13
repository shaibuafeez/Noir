/**
 * Lightweight market snapshot builder for WebSocket price broadcasting.
 * Reuses the same price/indicator functions as the REST /api/market endpoint
 * but packaged for the WS broadcast loop.
 */

import { getPriceWithConfidence } from "../market/prices.js";
import {
  calculateRSI,
  calculateBollinger,
  getPriceChange,
} from "../market/indicators.js";
import { getAllTokens } from "../market/tokens.js";

export interface MarketSnapshot {
  symbol: string;
  name: string;
  price: number;
  confidence: number | null;
  priceSource: string;
  change24h: number;
  change1h: number;
  rsi: number | null;
  rsiSignal: string | null;
  bollingerPosition: string | null;
  isStablecoin: boolean;
}

export async function fetchMarketSnapshot(): Promise<MarketSnapshot[]> {
  const tokens = getAllTokens();
  const out: MarketSnapshot[] = [];

  for (const t of tokens) {
    const priceResult = await getPriceWithConfidence(t.symbol);
    const rsi = calculateRSI(t.symbol);
    const bollinger = calculateBollinger(t.symbol);
    const change24h = getPriceChange(t.symbol, 288);
    const change1h = getPriceChange(t.symbol, 12);

    out.push({
      symbol: t.symbol,
      name: t.symbol,
      price: priceResult.price,
      confidence: priceResult.confidence ?? null,
      priceSource: priceResult.source,
      change24h: change24h?.changePercent ?? 0,
      change1h: change1h?.changePercent ?? 0,
      rsi: rsi?.value ?? null,
      rsiSignal: rsi?.signal ?? null,
      bollingerPosition: bollinger?.position ?? null,
      isStablecoin: t.isStablecoin,
    });
  }

  return out;
}
