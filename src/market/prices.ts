/**
 * Simple price fetcher using CoinGecko free API.
 * Caches prices for 60 seconds.
 */

import { getToken } from "./tokens.js";

interface CacheEntry {
  price: number;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;

export async function getPrice(symbol: string): Promise<number> {
  const upper = symbol.toUpperCase();

  const token = getToken(upper);

  // Stablecoins
  if (token?.isStablecoin) return 1.0;

  // Check cache
  const cached = cache.get(upper);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.price;
  }

  const cgId = token?.coingeckoId;
  if (!cgId) {
    // Unknown token — return 0
    return 0;
  }

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`,
    );

    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);

    const data = (await res.json()) as Record<string, { usd: number }>;
    const price = data[cgId]?.usd ?? 0;

    cache.set(upper, { price, fetchedAt: Date.now() });
    return price;
  } catch {
    // Return cached value if available, even if stale
    if (cached) return cached.price;
    return 0;
  }
}
