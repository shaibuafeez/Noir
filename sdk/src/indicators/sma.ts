/**
 * Simple Moving Average — pure function.
 */

import type { SMAResult } from "../types.js";
import { round4 } from "./utils.js";

/**
 * Calculate Simple Moving Average over the given prices.
 *
 * @param prices - Array of prices (chronological order, oldest first).
 * @param period - Number of periods. Defaults to all prices.
 * @returns SMA result, or null if not enough data.
 */
export function sma(prices: number[], period?: number): SMAResult | null {
  const p = period ?? prices.length;
  if (prices.length < p || p <= 0) return null;

  // Use the last `p` prices
  const slice = prices.slice(-p);
  const sum = slice.reduce((a, b) => a + b, 0);

  return {
    value: round4(sum / p),
    periods: p,
  };
}
