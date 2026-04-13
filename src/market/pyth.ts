/**
 * Pyth Network Hermes API price fetcher.
 * Batch-fetches prices with confidence intervals, 10-second TTL cache.
 */

const HERMES_URL = "https://hermes.pyth.network/v2/updates/price/latest";
const CACHE_TTL_MS = 10_000;

export interface PythPrice {
  price: number;
  confidence: number;
  timestamp: number;
}

let cache: { prices: Map<string, PythPrice>; fetchedAt: number } | null = null;

export async function getPythPrices(
  feedIds: string[],
): Promise<Map<string, PythPrice>> {
  // Only use cache if fresh AND it contains all requested feeds
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    const allCached = feedIds.every((id) => cache!.prices.has(id));
    if (allCached) return cache.prices;
  }

  const params = feedIds.map((id) => `ids[]=${id}`).join("&");
  const res = await fetch(`${HERMES_URL}?${params}`);
  if (!res.ok) throw new Error(`Pyth ${res.status}`);

  const data = (await res.json()) as {
    parsed: {
      id: string;
      price: { price: string; conf: string; expo: number; publish_time: number };
    }[];
  };

  // Merge into existing cache rather than replacing
  const map = cache ? new Map(cache.prices) : new Map<string, PythPrice>();

  for (const item of data.parsed) {
    const p = item.price;
    const price = Number(p.price) * Math.pow(10, p.expo);
    const conf = Number(p.conf) * Math.pow(10, p.expo);
    map.set(item.id, { price, confidence: conf, timestamp: p.publish_time });
  }

  cache = { prices: map, fetchedAt: Date.now() };
  return map;
}

export async function getPythPrice(
  feedId: string,
): Promise<PythPrice | null> {
  try {
    const prices = await getPythPrices([feedId]);
    return prices.get(feedId) ?? null;
  } catch {
    return null;
  }
}
