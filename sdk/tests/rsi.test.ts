import { describe, it, expect } from "vitest";
import { rsi } from "../src/indicators/rsi.js";

describe("rsi", () => {
  it("returns null with insufficient data", () => {
    expect(rsi([1, 2, 3], 14)).toBeNull();
  });

  it("returns null with exactly period prices (need period+1)", () => {
    const prices = Array.from({ length: 14 }, (_, i) => 100 + i);
    expect(rsi(prices, 14)).toBeNull();
  });

  it("calculates RSI for a rising market", () => {
    // Steadily rising prices → RSI should be high
    const prices = Array.from({ length: 15 }, (_, i) => 100 + i * 2);
    const result = rsi(prices, 14);
    expect(result).not.toBeNull();
    expect(result!.value).toBe(100); // All gains, no losses
    expect(result!.signal).toBe("overbought");
    expect(result!.periods).toBe(14);
  });

  it("calculates RSI for a falling market", () => {
    // Steadily falling prices → RSI should be low
    const prices = Array.from({ length: 15 }, (_, i) => 200 - i * 2);
    const result = rsi(prices, 14);
    expect(result).not.toBeNull();
    expect(result!.value).toBe(0); // All losses, no gains
    expect(result!.signal).toBe("oversold");
  });

  it("calculates neutral RSI for mixed market", () => {
    // Alternating up/down with same magnitude → RSI ≈ 50
    const prices = [100, 102, 100, 102, 100, 102, 100, 102, 100, 102, 100, 102, 100, 102, 100];
    const result = rsi(prices, 14);
    expect(result).not.toBeNull();
    expect(result!.value).toBeCloseTo(50, 0);
    expect(result!.signal).toBe("neutral");
  });

  it("uses last period+1 prices from a longer array", () => {
    const filler = Array.from({ length: 50 }, () => 50);
    const rising = Array.from({ length: 15 }, (_, i) => 100 + i);
    const result = rsi([...filler, ...rising], 14);
    expect(result).not.toBeNull();
    expect(result!.value).toBe(100);
  });
});
