import { describe, it, expect } from "vitest";
import {
  getToken,
  getAllTokens,
  getTradableTokens,
  tokenToField,
  fieldToToken,
} from "../src/market/tokens.js";

describe("token registry", () => {
  describe("getToken", () => {
    it("returns ALEO token info", () => {
      const token = getToken("ALEO");
      expect(token).toBeDefined();
      expect(token!.symbol).toBe("ALEO");
      expect(token!.coingeckoId).toBe("aleo");
      expect(token!.isStablecoin).toBe(false);
    });

    it("is case-insensitive", () => {
      expect(getToken("aleo")).toEqual(getToken("ALEO"));
      expect(getToken("Btc")).toEqual(getToken("BTC"));
    });

    it("returns undefined for unknown token", () => {
      expect(getToken("UNKNOWN")).toBeUndefined();
    });

    it("identifies stablecoins", () => {
      expect(getToken("USDT")!.isStablecoin).toBe(true);
      expect(getToken("USDC")!.isStablecoin).toBe(true);
      expect(getToken("BTC")!.isStablecoin).toBe(false);
    });
  });

  describe("getAllTokens", () => {
    it("returns all 7 tokens", () => {
      const tokens = getAllTokens();
      expect(tokens).toHaveLength(7);
    });

    it("includes expected symbols", () => {
      const symbols = getAllTokens().map((t) => t.symbol);
      expect(symbols).toContain("ALEO");
      expect(symbols).toContain("BTC");
      expect(symbols).toContain("ETH");
      expect(symbols).toContain("SOL");
      expect(symbols).toContain("DOGE");
      expect(symbols).toContain("USDT");
      expect(symbols).toContain("USDC");
    });
  });

  describe("getTradableTokens", () => {
    it("excludes stablecoins", () => {
      const tradable = getTradableTokens();
      const symbols = tradable.map((t) => t.symbol);
      expect(symbols).not.toContain("USDT");
      expect(symbols).not.toContain("USDC");
      expect(symbols).toContain("ALEO");
      expect(symbols).toContain("BTC");
    });
  });

  describe("tokenToField / fieldToToken", () => {
    it("converts ALEO to 1field", () => {
      expect(tokenToField("ALEO")).toBe("1field");
    });

    it("converts BTC to 3field", () => {
      expect(tokenToField("BTC")).toBe("3field");
    });

    it("returns 0field for unknown token", () => {
      expect(tokenToField("UNKNOWN")).toBe("0field");
    });

    it("round-trips field to token", () => {
      expect(fieldToToken("1field")).toBe("ALEO");
      expect(fieldToToken("3field")).toBe("BTC");
      expect(fieldToToken("4field")).toBe("ETH");
    });

    it("returns undefined for unknown field", () => {
      expect(fieldToToken("99field")).toBeUndefined();
    });
  });
});
