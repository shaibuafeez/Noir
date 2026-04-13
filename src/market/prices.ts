/**
 * Dual-source price fetcher: Pyth Network primary (BTC/ETH/SOL/DOGE),
 * CoinGecko fallback + ALEO. Caches prices for 60 seconds (CoinGecko)
 * or 10 seconds (Pyth, handled in pyth.ts).
 */

import { getToken } from "./tokens.js";
import { getPythPrice } from "./pyth.js";

interface CacheEntry {
  price: number;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;

export interface PriceResult {
  price: number;
  confidence?: number;
  source: "pyth" | "coingecko" | "hardcoded";
}

export async function getPrice(symbol: string): Promise<number> {
  const result = await getPriceWithConfidence(symbol);
  return result.price;
}

export async function getPriceWithConfidence(
  symbol: string,
): Promise<PriceResult> {
  const upper = symbol.toUpperCase();
  const token = getToken(upper);

  // Stablecoins
  if (token?.isStablecoin) return { price: 1.0, source: "hardcoded" };

  // Try Pyth first if feed exists
  if (token?.pythFeedId) {
    const pyth = await getPythPrice(token.pythFeedId);
    if (pyth && pyth.price > 0) {
      cache.set(upper, { price: pyth.price, fetchedAt: Date.now() });
      return { price: pyth.price, confidence: pyth.confidence, source: "pyth" };
    }
  }

  // Check CoinGecko cache
  const cached = cache.get(upper);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { price: cached.price, source: "coingecko" };
  }

  const cgId = token?.coingeckoId;
  if (!cgId) return { price: 0, source: "coingecko" };

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`,
    );

    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);

    const data = (await res.json()) as Record<string, { usd: number }>;
    const price = data[cgId]?.usd ?? 0;

    cache.set(upper, { price, fetchedAt: Date.now() });
    return { price, source: "coingecko" };
  } catch {
    // Return cached value if available, even if stale
    if (cached) return { price: cached.price, source: "coingecko" };
    return { price: 0, source: "coingecko" };
  }
}
