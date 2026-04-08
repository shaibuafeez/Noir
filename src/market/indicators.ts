/**
 * Market indicators — RSI, Bollinger Bands, volume/price analysis.
 * Pulls from price_history table in SQLite.
 */

import { getPriceHistory, recordPrice } from "../storage/db.js";
import { getPrice } from "./prices.js";
import { getTradableTokens } from "./tokens.js";

// ── Price recording ──
let recordTimer: ReturnType<typeof setInterval> | null = null;

/** Start recording prices every 5 minutes. */
export function startPriceRecorder(): void {
  console.log("[indicators] Starting price recorder (5m interval)");

  // Record immediately on start
  void recordAllPrices();

  recordTimer = setInterval(() => {
    void recordAllPrices();
  }, 5 * 60_000);
}

export function stopPriceRecorder(): void {
  if (recordTimer) {
    clearInterval(recordTimer);
    recordTimer = null;
  }
}

async function recordAllPrices(): Promise<void> {
  const trackedTokens = getTradableTokens().map((t) => t.symbol);
  for (const token of trackedTokens) {
    try {
      const price = await getPrice(token);
      if (price > 0) {
        recordPrice(token, price);
      }
    } catch {
      // CoinGecko may rate-limit
    }
  }
}

// ── RSI (Relative Strength Index) ──

export interface RSIResult {
  value: number;
  signal: "oversold" | "neutral" | "overbought";
  periods: number;
}

/**
 * Calculate RSI for a token.
 * Default period: 14 data points.
 * Uses price_history from DB.
 */
export function calculateRSI(token: string, period = 14): RSIResult | null {
  const history = getPriceHistory(token, period + 1);

  if (history.length < period + 1) return null;

  // History is DESC, reverse for chronological order
  const prices = history.reverse().map((h) => h.price);

  let avgGain = 0;
  let avgLoss = 0;

  // First average
  for (let i = 1; i <= period; i++) {
    const change = prices[i]! - prices[i - 1]!;
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }

  avgGain /= period;
  avgLoss /= period;

  if (avgLoss === 0) return { value: 100, signal: "overbought", periods: period };

  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  const signal: RSIResult["signal"] =
    rsi < 30 ? "oversold" : rsi > 70 ? "overbought" : "neutral";

  return { value: Math.round(rsi * 100) / 100, signal, periods: period };
}

// ── Bollinger Bands ──

export interface BollingerResult {
  upper: number;
  middle: number; // SMA
  lower: number;
  currentPrice: number;
  position: "below_lower" | "lower_half" | "upper_half" | "above_upper";
  bandwidth: number; // (upper - lower) / middle — volatility measure
  periods: number;
}

/**
 * Calculate Bollinger Bands.
 * Default: 20-period SMA with 2 standard deviations.
 */
export function calculateBollinger(
  token: string,
  period = 20,
  stdDevMultiplier = 2,
): BollingerResult | null {
  const history = getPriceHistory(token, period);

  if (history.length < period) return null;

  const prices = history.map((h) => h.price);
  const currentPrice = prices[0]!; // Most recent (DESC order)

  // SMA
  const sum = prices.reduce((a, b) => a + b, 0);
  const sma = sum / period;

  // Standard deviation
  const squaredDiffs = prices.map((p) => (p - sma) ** 2);
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(variance);

  const upper = sma + stdDevMultiplier * stdDev;
  const lower = sma - stdDevMultiplier * stdDev;
  const bandwidth = sma > 0 ? (upper - lower) / sma : 0;

  let position: BollingerResult["position"];
  if (currentPrice < lower) position = "below_lower";
  else if (currentPrice < sma) position = "lower_half";
  else if (currentPrice < upper) position = "upper_half";
  else position = "above_upper";

  return {
    upper: round4(upper),
    middle: round4(sma),
    lower: round4(lower),
    currentPrice: round4(currentPrice),
    position,
    bandwidth: round4(bandwidth),
    periods: period,
  };
}

// ── Price change ──

export interface PriceChangeResult {
  current: number;
  previous: number;
  changePercent: number;
  changeAbsolute: number;
  period: string;
}

/** Get price change over a time window. */
export function getPriceChange(
  token: string,
  periodsBack: number,
): PriceChangeResult | null {
  const history = getPriceHistory(token, periodsBack + 1);
  if (history.length < 2) return null;

  const current = history[0]!.price;
  const previous = history[history.length - 1]!.price;

  if (previous === 0) return null;

  const changePercent = ((current - previous) / previous) * 100;
  const changeAbsolute = current - previous;

  return {
    current: round4(current),
    previous: round4(previous),
    changePercent: Math.round(changePercent * 100) / 100,
    changeAbsolute: round4(changeAbsolute),
    period: `${history.length - 1} data points`,
  };
}

// ── Market summary (for agent reasoning context) ──

export interface MarketContext {
  token: string;
  price: number;
  rsi: RSIResult | null;
  bollinger: BollingerResult | null;
  change1h: PriceChangeResult | null;
  change24h: PriceChangeResult | null;
  summary: string; // Human-readable summary for the agent
}

/** Build a market context string for reasoning transparency. */
export async function getMarketContext(token: string): Promise<MarketContext> {
  const price = await getPrice(token);
  const rsi = calculateRSI(token);
  const bollinger = calculateBollinger(token);
  const change1h = getPriceChange(token, 12); // 12 * 5min = 1h
  const change24h = getPriceChange(token, 288); // 288 * 5min = 24h

  const parts: string[] = [`${token} $${price.toFixed(4)}`];

  if (rsi) {
    parts.push(`RSI ${rsi.value} (${rsi.signal})`);
  }

  if (bollinger) {
    parts.push(
      `BB [${bollinger.lower}–${bollinger.upper}] pos=${bollinger.position}`,
    );
  }

  if (change1h) {
    const dir = change1h.changePercent >= 0 ? "+" : "";
    parts.push(`1h: ${dir}${change1h.changePercent}%`);
  }

  if (change24h) {
    const dir = change24h.changePercent >= 0 ? "+" : "";
    parts.push(`24h: ${dir}${change24h.changePercent}%`);
  }

  return {
    token,
    price,
    rsi,
    bollinger,
    change1h,
    change24h,
    summary: parts.join(" | "),
  };
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
