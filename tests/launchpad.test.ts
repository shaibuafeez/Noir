import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getBondingPrice,
  getBuyCost,
  getSellRefund,
  fetchOnChainState,
} from "../src/launchpad/engine.js";

describe("bonding curve math", () => {
  describe("getBondingPrice", () => {
    it("price at 0 supply is 1", () => {
      expect(getBondingPrice(0)).toBe(1);
    });

    it("price at 1000 supply is 2", () => {
      expect(getBondingPrice(1000)).toBe(2);
    });

    it("price at 500_000 supply is 501", () => {
      expect(getBondingPrice(500_000)).toBe(501);
    });

    it("price at 800_000 supply (graduation) is 801", () => {
      expect(getBondingPrice(800_000)).toBe(801);
    });

    it("price at 1_000_000 supply (max) is 1001", () => {
      expect(getBondingPrice(1_000_000)).toBe(1001);
    });

    it("price increases linearly with supply", () => {
      const p1 = getBondingPrice(100);
      const p2 = getBondingPrice(200);
      const p3 = getBondingPrice(300);
      expect(p2 - p1).toBeCloseTo(p3 - p2, 10);
    });
  });

  describe("getBuyCost", () => {
    it("buying 0 tokens costs 0", () => {
      expect(getBuyCost(0, 0)).toBe(0);
    });

    it("buying from 0 supply uses midpoint pricing", () => {
      // midpoint = 0 + 1000/2 = 500, price = 1 + 500/1000 = 1.5
      // cost = 1000 * 1.5 = 1500
      expect(getBuyCost(0, 1000)).toBe(1500);
    });

    it("buying 1 token from 0 supply costs ~1", () => {
      // midpoint = 0.5, price = 1 + 0.5/1000 = 1.0005
      // cost = 1 * 1.0005 = 1.0005
      expect(getBuyCost(0, 1)).toBeCloseTo(1.0005, 4);
    });

    it("cost increases with higher supply", () => {
      const costLow = getBuyCost(0, 100);
      const costHigh = getBuyCost(500_000, 100);
      expect(costHigh).toBeGreaterThan(costLow);
    });

    it("cost scales with amount", () => {
      const cost1 = getBuyCost(0, 100);
      const cost2 = getBuyCost(0, 200);
      // Not exactly 2x because of the curve, but close for small amounts
      expect(cost2).toBeGreaterThan(cost1);
    });

    it("buying all 1M tokens from 0 supply", () => {
      // midpoint = 500_000, price = 1 + 500 = 501
      // cost = 1_000_000 * 501 = 501_000_000
      expect(getBuyCost(0, 1_000_000)).toBe(501_000_000);
    });
  });

  describe("getSellRefund", () => {
    it("selling 0 tokens refunds 0", () => {
      expect(getSellRefund(1000, 0)).toBe(0);
    });

    it("sell refund uses midpoint pricing", () => {
      // currentSupply=1000, amount=1000, midpoint = 1000 - 500 = 500
      // price = 1 + 500/1000 = 1.5, refund = 1000 * 1.5 = 1500
      expect(getSellRefund(1000, 1000)).toBe(1500);
    });

    it("sell refund mirrors buy cost at same range", () => {
      // Buy 1000 from 0 => midpoint 500, cost = 1000 * 1.5 = 1500
      // Sell 1000 from 1000 => midpoint 500, refund = 1000 * 1.5 = 1500
      const buyCost = getBuyCost(0, 1000);
      const sellRefund = getSellRefund(1000, 1000);
      expect(sellRefund).toBeCloseTo(buyCost, 10);
    });

    it("sell refund floors midpoint at 0 for large sells", () => {
      // currentSupply=100, amount=500 => midpoint = 100-250 = -150 => max(0,-150) = 0
      // price = 1 + 0/1000 = 1, refund = 500 * 1 = 500
      expect(getSellRefund(100, 500)).toBe(500);
    });

    it("refund decreases with lower supply", () => {
      const refundHigh = getSellRefund(500_000, 100);
      const refundLow = getSellRefund(1000, 100);
      expect(refundHigh).toBeGreaterThan(refundLow);
    });

    it("sell at high supply gives high refund", () => {
      // currentSupply=800_000, sell 1000, midpoint = 799_500
      // price = 1 + 799.5 = 800.5, refund = 1000 * 800.5 = 800_500
      expect(getSellRefund(800_000, 1000)).toBe(800_500);
    });
  });

  describe("graduation threshold", () => {
    it("graduation at 800K of 1M max", () => {
      // Verify the bonding curve constants are as expected
      const priceAtGraduation = getBondingPrice(800_000);
      expect(priceAtGraduation).toBe(801);
    });

    it("buy cost to reach graduation from 0", () => {
      const cost = getBuyCost(0, 800_000);
      // midpoint = 400_000, price = 1 + 400 = 401
      // cost = 800_000 * 401 = 320_800_000
      expect(cost).toBe(320_800_000);
    });
  });
});

describe("fetchOnChainState", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns defaults when all fetches fail", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    const state = await fetchOnChainState("abc123");
    expect(state.supplySold).toBe(0);
    expect(state.graduated).toBe(false);
    expect(state.creator).toBeNull();

    vi.unstubAllGlobals();
  });

  it("parses supply_sold from explorer response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('"50000u64"'),
      }),
    );

    const state = await fetchOnChainState("abc123");
    expect(state.supplySold).toBe(50000);

    vi.unstubAllGlobals();
  });

  it("parses graduated=true from explorer response", async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("graduated")) {
        return Promise.resolve({ ok: true, text: () => Promise.resolve('"true"') });
      }
      return Promise.resolve({ ok: true, text: () => Promise.resolve('"0u64"') });
    });
    vi.stubGlobal("fetch", mockFetch);

    const state = await fetchOnChainState("abc123");
    expect(state.graduated).toBe(true);

    vi.unstubAllGlobals();
  });

  it("handles 404 responses gracefully", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );

    const state = await fetchOnChainState("nonexistent");
    expect(state.supplySold).toBe(0);
    expect(state.graduated).toBe(false);
    expect(state.creator).toBeNull();

    vi.unstubAllGlobals();
  });
});
