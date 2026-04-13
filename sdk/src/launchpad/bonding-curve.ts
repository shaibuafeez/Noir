/**
 * Bonding curve math — pure functions, no network/DB dependency.
 *
 * The Noir launchpad uses a linear bonding curve:
 *   price(supply) = BASE_PRICE + supply / PRICE_DIVISOR
 *
 * Tokens graduate (exit bonding curve) when supply reaches GRADUATION_THRESHOLD.
 */

import { LAUNCHPAD } from "../constants.js";
import type { BondingCurveQuote } from "../types.js";

const { MAX_SUPPLY, GRADUATION_THRESHOLD, PRICE_DIVISOR, BASE_PRICE } = LAUNCHPAD;

/** Price per token at a given supply level (in microcredits). */
export function getBondingPrice(supplySold: number): number {
  return BASE_PRICE + supplySold / PRICE_DIVISOR;
}

/** Total cost to buy `amount` tokens starting from `currentSupply`. */
export function getBuyCost(currentSupply: number, amount: number): number {
  const midpoint = currentSupply + amount / 2;
  return amount * (BASE_PRICE + midpoint / PRICE_DIVISOR);
}

/** Refund for selling `amount` tokens starting from `currentSupply`. */
export function getSellRefund(currentSupply: number, amount: number): number {
  const midpoint = currentSupply - amount / 2;
  return amount * (BASE_PRICE + Math.max(0, midpoint) / PRICE_DIVISOR);
}

/** Market cap at a given supply level. */
export function getMarketCap(supplySold: number): number {
  return supplySold * getBondingPrice(supplySold);
}

/** Progress toward graduation (0–100). */
export function getProgress(supplySold: number): number {
  return Math.min(100, (supplySold / MAX_SUPPLY) * 100);
}

/** Whether the supply has reached the graduation threshold. */
export function isGraduated(supplySold: number): boolean {
  return supplySold >= GRADUATION_THRESHOLD;
}

/**
 * Get a full quote for buying tokens.
 *
 * @param currentSupply - Current supply sold.
 * @param amount - Number of tokens to buy.
 * @returns Quote with cost, average price, new supply, and graduation status.
 */
export function quoteBuy(currentSupply: number, amount: number): BondingCurveQuote {
  const totalCost = getBuyCost(currentSupply, amount);
  const newSupply = currentSupply + amount;
  return {
    amount,
    totalCost,
    averagePrice: totalCost / amount,
    newSupply,
    graduated: newSupply >= GRADUATION_THRESHOLD,
  };
}

/**
 * Get a full quote for selling tokens.
 *
 * @param currentSupply - Current supply sold.
 * @param amount - Number of tokens to sell.
 * @returns Quote with refund, average price, new supply, and graduation status.
 */
export function quoteSell(currentSupply: number, amount: number): BondingCurveQuote {
  const totalCost = getSellRefund(currentSupply, amount);
  const newSupply = currentSupply - amount;
  return {
    amount,
    totalCost,
    averagePrice: totalCost / amount,
    newSupply: Math.max(0, newSupply),
    graduated: newSupply >= GRADUATION_THRESHOLD,
  };
}
