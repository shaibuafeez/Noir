import { describe, it, expect, beforeAll } from "vitest";
import { initDb, recordPrice, getPriceHistory } from "../src/storage/db.js";
import {
  calculateRSI,
  calculateBollinger,
  getPriceChange,
} from "../src/market/indicators.js";

/**
 * These tests use a real in-memory SQLite DB since the indicators read from
 * price_history via getPriceHistory(). We seed the DB with known price
 * sequences so we can predict the RSI/Bollinger outputs.
 */

beforeAll(() => {
  initDb(":memory:");
});

/** Helper: seed `n` prices for a token. */
function seedPrices(token: string, prices: number[]) {
  for (const p of prices) {
    recordPrice(token, p);
  }
}

describe("RSI", () => {
  it("returns null with insufficient data", () => {
    const result = calculateRSI("EMPTY_TOKEN", 14);
    expect(result).toBeNull();
  });

  it("RSI of flat prices is indeterminate (returns 100 when no losses)", () => {
    // 15 identical prices => 14 changes, all 0 => avgLoss = 0 => RSI = 100
    seedPrices("FLAT", Array(15).fill(100));
    const result = calculateRSI("FLAT", 14);
    expect(result).not.toBeNull();
    expect(result!.value).toBe(100);
    expect(result!.signal).toBe("overbought");
  });

  it("RSI of all-up prices approaches 100", () => {
    // Monotonically increasing: 1, 2, 3, ..., 15
    const prices = Array.from({ length: 15 }, (_, i) => i + 1);
    seedPrices("ALLUP", prices);
    const result = calculateRSI("ALLUP", 14);
    expect(result).not.toBeNull();
    expect(result!.value).toBe(100);
    expect(result!.signal).toBe("overbought");
  });

  it("RSI of all-down prices approaches 0", () => {
    // Monotonically decreasing: 15, 14, 13, ..., 1
    const prices = Array.from({ length: 15 }, (_, i) => 15 - i);
    seedPrices("ALLDOWN", prices);
    const result = calculateRSI("ALLDOWN", 14);
    expect(result).not.toBeNull();
    expect(result!.value).toBe(0);
    expect(result!.signal).toBe("oversold");
  });

  it("RSI of equal up/down moves is ~50", () => {
    // Alternating: 100, 110, 100, 110, ... (15 values)
    const prices = Array.from({ length: 15 }, (_, i) => (i % 2 === 0 ? 100 : 110));
    seedPrices("ZIGZAG", prices);
    const result = calculateRSI("ZIGZAG", 14);
    expect(result).not.toBeNull();
    expect(result!.value).toBeGreaterThan(40);
    expect(result!.value).toBeLessThan(60);
    expect(result!.signal).toBe("neutral");
  });

  it("returns correct period count", () => {
    seedPrices("PERIOD_CHECK", Array.from({ length: 15 }, (_, i) => 50 + i));
    const result = calculateRSI("PERIOD_CHECK", 14);
    expect(result).not.toBeNull();
    expect(result!.periods).toBe(14);
  });
});

describe("Bollinger Bands", () => {
  it("returns null with insufficient data", () => {
    const result = calculateBollinger("NO_DATA_BB", 20);
    expect(result).toBeNull();
  });

  it("middle band is SMA of prices", () => {
    // 20 prices: 1..20
    const prices = Array.from({ length: 20 }, (_, i) => i + 1);
    seedPrices("BB_SMA", prices);
    const result = calculateBollinger("BB_SMA", 20);
    expect(result).not.toBeNull();
    // SMA of 1..20 = 10.5
    expect(result!.middle).toBe(10.5);
  });

  it("bands are tight for flat prices", () => {
    seedPrices("BB_FLAT", Array(20).fill(50));
    const result = calculateBollinger("BB_FLAT", 20);
    expect(result).not.toBeNull();
    expect(result!.upper).toBe(50);
    expect(result!.lower).toBe(50);
    expect(result!.bandwidth).toBe(0);
  });

  it("bands widen with volatility", () => {
    const flat = Array(20).fill(100);
    seedPrices("BB_STEADY", flat);
    const resultSteady = calculateBollinger("BB_STEADY", 20);

    // Volatile: alternating 80, 120
    const volatile = Array.from({ length: 20 }, (_, i) => (i % 2 === 0 ? 80 : 120));
    seedPrices("BB_VOLATILE", volatile);
    const resultVolatile = calculateBollinger("BB_VOLATILE", 20);

    expect(resultSteady).not.toBeNull();
    expect(resultVolatile).not.toBeNull();
    expect(resultVolatile!.bandwidth).toBeGreaterThan(resultSteady!.bandwidth);
  });

  it("position is below_lower when price is below lower band", () => {
    // Seed prices where the most recent (first in DESC) is way below the SMA
    // 19 prices at 100, then 1 price at 50 (most recent)
    const prices = [...Array(19).fill(100), 50];
    seedPrices("BB_BELOW", prices);
    const result = calculateBollinger("BB_BELOW", 20);
    expect(result).not.toBeNull();
    expect(result!.position).toBe("below_lower");
  });

  it("returns correct period count", () => {
    seedPrices("BB_PERIODS", Array(20).fill(42));
    const result = calculateBollinger("BB_PERIODS", 20);
    expect(result).not.toBeNull();
    expect(result!.periods).toBe(20);
  });
});

describe("getPriceChange", () => {
  it("returns null with no history", () => {
    const result = getPriceChange("NO_HISTORY", 10);
    expect(result).toBeNull();
  });

  it("returns null with only 1 data point", () => {
    seedPrices("SINGLE_PT", [100]);
    const result = getPriceChange("SINGLE_PT", 1);
    // Need at least 2 points
    expect(result).toBeNull();
  });

  it("calculates positive percentage change", () => {
    seedPrices("POS_CHG", [100, 150]);
    const result = getPriceChange("POS_CHG", 1);
    expect(result).not.toBeNull();
    // Most recent = 150 (desc[0]), oldest = 100 (desc[1])
    // change = (150 - 100) / 100 * 100 = 50%
    expect(result!.changePercent).toBe(50);
    expect(result!.changeAbsolute).toBe(50);
  });

  it("calculates negative percentage change", () => {
    seedPrices("NEG_CHG", [200, 100]);
    const result = getPriceChange("NEG_CHG", 1);
    expect(result).not.toBeNull();
    // Most recent = 100 (desc[0]), oldest = 200 (desc[1])
    // change = (100 - 200) / 200 * 100 = -50%
    expect(result!.changePercent).toBe(-50);
  });

  it("returns zero for no change", () => {
    seedPrices("NO_CHG", [100, 100]);
    const result = getPriceChange("NO_CHG", 1);
    expect(result).not.toBeNull();
    expect(result!.changePercent).toBe(0);
    expect(result!.changeAbsolute).toBe(0);
  });
});
