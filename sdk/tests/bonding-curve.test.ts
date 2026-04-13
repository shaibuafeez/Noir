import { describe, it, expect } from "vitest";
import {
  getBondingPrice,
  getBuyCost,
  getSellRefund,
  getMarketCap,
  getProgress,
  isGraduated,
  quoteBuy,
  quoteSell,
} from "../src/launchpad/bonding-curve.js";

describe("bonding curve", () => {
  describe("getBondingPrice", () => {
    it("returns base price at zero supply", () => {
      expect(getBondingPrice(0)).toBe(1);
    });

    it("increases linearly with supply", () => {
      expect(getBondingPrice(1000)).toBe(2);
      expect(getBondingPrice(5000)).toBe(6);
      expect(getBondingPrice(10000)).toBe(11);
    });
  });

  describe("getBuyCost", () => {
    it("calculates cost from zero supply", () => {
      // 100 tokens starting from 0: midpoint = 50, price = 1.05, cost = 105
      expect(getBuyCost(0, 100)).toBe(105);
    });

    it("calculates cost at higher supply", () => {
      // 100 tokens from supply 1000: midpoint = 1050, price = 2.05, cost = 205
      expect(getBuyCost(1000, 100)).toBeCloseTo(205, 10);
    });

    it("returns 0 for zero amount", () => {
      expect(getBuyCost(0, 0)).toBe(0);
    });
  });

  describe("getSellRefund", () => {
    it("calculates refund", () => {
      // Sell 100 from supply 1000: midpoint = 950, price = 1.95, refund = 195
      expect(getSellRefund(1000, 100)).toBe(195);
    });

    it("clamps midpoint to zero", () => {
      // Sell 200 from supply 100: midpoint = 0, price = 1, refund = 200
      expect(getSellRefund(100, 200)).toBe(200);
    });
  });

  describe("getMarketCap", () => {
    it("returns 0 at zero supply", () => {
      expect(getMarketCap(0)).toBe(0);
    });

    it("calculates supply * price", () => {
      expect(getMarketCap(1000)).toBe(1000 * 2); // price = 2 at supply 1000
    });
  });

  describe("getProgress", () => {
    it("returns 0 at zero supply", () => {
      expect(getProgress(0)).toBe(0);
    });

    it("returns 50 at half supply", () => {
      expect(getProgress(500_000)).toBe(50);
    });

    it("caps at 100", () => {
      expect(getProgress(2_000_000)).toBe(100);
    });
  });

  describe("isGraduated", () => {
    it("false below threshold", () => {
      expect(isGraduated(799_999)).toBe(false);
    });

    it("true at threshold", () => {
      expect(isGraduated(800_000)).toBe(true);
    });

    it("true above threshold", () => {
      expect(isGraduated(900_000)).toBe(true);
    });
  });

  describe("quoteBuy", () => {
    it("returns a full quote", () => {
      const q = quoteBuy(0, 1000);
      expect(q.amount).toBe(1000);
      expect(q.totalCost).toBeGreaterThan(0);
      expect(q.averagePrice).toBe(q.totalCost / q.amount);
      expect(q.newSupply).toBe(1000);
      expect(q.graduated).toBe(false);
    });

    it("detects graduation", () => {
      const q = quoteBuy(700_000, 200_000);
      expect(q.graduated).toBe(true);
    });
  });

  describe("quoteSell", () => {
    it("returns a full quote", () => {
      const q = quoteSell(1000, 500);
      expect(q.amount).toBe(500);
      expect(q.totalCost).toBeGreaterThan(0);
      expect(q.newSupply).toBe(500);
      expect(q.graduated).toBe(false);
    });

    it("clamps newSupply to zero", () => {
      const q = quoteSell(100, 200);
      expect(q.newSupply).toBe(0);
    });
  });
});
