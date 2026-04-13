import { describe, it, expect } from "vitest";
import { bollinger } from "../src/indicators/bollinger.js";

describe("bollinger", () => {
  it("returns null with insufficient data", () => {
    expect(bollinger([1, 2, 3], 20)).toBeNull();
  });

  it("calculates bands for constant prices", () => {
    const prices = Array.from({ length: 20 }, () => 100);
    const result = bollinger(prices, 20, 2);
    expect(result).not.toBeNull();
    expect(result!.middle).toBe(100);
    expect(result!.upper).toBe(100); // stddev = 0
    expect(result!.lower).toBe(100);
    expect(result!.bandwidth).toBe(0);
  });

  it("expands bands with volatile prices", () => {
    // Alternating high/low creates wider bands
    const prices = Array.from({ length: 20 }, (_, i) => (i % 2 === 0 ? 110 : 90));
    const result = bollinger(prices, 20, 2);
    expect(result).not.toBeNull();
    expect(result!.middle).toBe(100);
    expect(result!.upper).toBeGreaterThan(100);
    expect(result!.lower).toBeLessThan(100);
    expect(result!.bandwidth).toBeGreaterThan(0);
  });

  it("determines position correctly", () => {
    // Make last price clearly above upper band
    const prices = Array.from({ length: 19 }, () => 100);
    prices.push(200); // Last price way above
    const result = bollinger(prices, 20, 2);
    expect(result).not.toBeNull();
    expect(result!.position).toBe("above_upper");
  });

  it("uses last n prices from longer array", () => {
    const filler = Array.from({ length: 50 }, () => 50);
    const data = Array.from({ length: 20 }, () => 100);
    const result = bollinger([...filler, ...data], 20, 2);
    expect(result).not.toBeNull();
    expect(result!.middle).toBe(100);
  });

  it("respects stddev multiplier", () => {
    const prices = Array.from({ length: 20 }, (_, i) => (i % 2 === 0 ? 110 : 90));
    const narrow = bollinger(prices, 20, 1);
    const wide = bollinger(prices, 20, 3);
    expect(narrow).not.toBeNull();
    expect(wide).not.toBeNull();
    expect(wide!.bandwidth).toBeGreaterThan(narrow!.bandwidth);
  });
});
