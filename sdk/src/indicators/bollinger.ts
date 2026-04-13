/**
 * Bollinger Bands — pure function.
 */

import type { BollingerResult } from "../types.js";
import { round4 } from "./utils.js";

/**
 * Calculate Bollinger Bands from an array of prices.
 *
 * @param prices - Array of prices in chronological order (oldest first).
 * @param period - SMA period. Default: 20.
 * @param stdDevMultiplier - Standard deviation multiplier. Default: 2.
 * @returns Bollinger result, or null if not enough data.
 */
export function bollinger(
  prices: number[],
  period = 20,
  stdDevMultiplier = 2,
): BollingerResult | null {
  if (prices.length < period || period <= 0) return null;

  // Use the last `period` prices
  const slice = prices.slice(-period);
  const currentPrice = slice[slice.length - 1]!;

  // SMA
  const sum = slice.reduce((a, b) => a + b, 0);
  const middle = sum / period;

  // Standard deviation
  const squaredDiffs = slice.map((p) => (p - middle) ** 2);
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(variance);

  const upper = middle + stdDevMultiplier * stdDev;
  const lower = middle - stdDevMultiplier * stdDev;
  const bandwidth = middle > 0 ? (upper - lower) / middle : 0;

  let position: BollingerResult["position"];
  if (currentPrice < lower) position = "below_lower";
  else if (currentPrice < middle) position = "lower_half";
  else if (currentPrice < upper) position = "upper_half";
  else position = "above_upper";

  return {
    upper: round4(upper),
    middle: round4(middle),
    lower: round4(lower),
    position,
    bandwidth: round4(bandwidth),
    periods: period,
  };
}
