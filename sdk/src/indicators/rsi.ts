/**
 * Relative Strength Index — pure function.
 */

import type { RSIResult } from "../types.js";

/**
 * Calculate RSI from an array of prices.
 *
 * @param prices - Array of prices in chronological order (oldest first).
 * @param period - RSI period. Default: 14.
 * @returns RSI result, or null if not enough data (need period + 1 prices).
 */
export function rsi(prices: number[], period = 14): RSIResult | null {
  if (prices.length < period + 1) return null;

  // Use the last (period + 1) prices
  const slice = prices.slice(-(period + 1));

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = slice[i]! - slice[i - 1]!;
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }

  avgGain /= period;
  avgLoss /= period;

  if (avgLoss === 0) return { value: 100, signal: "overbought", periods: period };

  const rs = avgGain / avgLoss;
  const value = Math.round((100 - 100 / (1 + rs)) * 100) / 100;

  const signal: RSIResult["signal"] =
    value < 30 ? "oversold" : value > 70 ? "overbought" : "neutral";

  return { value, signal, periods: period };
}
