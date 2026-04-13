/**
 * Indicator utility functions.
 */

/** Round to 4 decimal places. */
export function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/** Percentage change between two values. */
export function percentChange(from: number, to: number): number {
  if (from === 0) return 0;
  return Math.round(((to - from) / from) * 10000) / 100;
}
