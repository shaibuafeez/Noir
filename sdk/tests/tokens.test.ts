import { describe, it, expect } from "vitest";
import {
  getToken,
  getAllTokens,
  getTradableTokens,
  tokenToField,
  fieldToToken,
  registerToken,
} from "../src/trade/tokens.js";

describe("tokens", () => {
  it("getToken returns known tokens", () => {
    const aleo = getToken("ALEO");
    expect(aleo).toBeDefined();
    expect(aleo!.symbol).toBe("ALEO");
    expect(aleo!.fieldId).toBe("1field");
    expect(aleo!.decimals).toBe(6);
  });

  it("getToken is case-insensitive", () => {
    expect(getToken("aleo")).toEqual(getToken("ALEO"));
    expect(getToken("Btc")).toEqual(getToken("BTC"));
  });

  it("getToken returns undefined for unknown", () => {
    expect(getToken("FAKE")).toBeUndefined();
  });

  it("getAllTokens returns all registered", () => {
    const tokens = getAllTokens();
    expect(tokens.length).toBeGreaterThanOrEqual(7);
    expect(tokens.map((t) => t.symbol)).toContain("ALEO");
    expect(tokens.map((t) => t.symbol)).toContain("USDT");
  });

  it("getTradableTokens excludes stablecoins", () => {
    const tradable = getTradableTokens();
    expect(tradable.every((t) => !t.isStablecoin)).toBe(true);
    expect(tradable.map((t) => t.symbol)).not.toContain("USDT");
    expect(tradable.map((t) => t.symbol)).not.toContain("USDC");
  });

  it("tokenToField maps correctly", () => {
    expect(tokenToField("ALEO")).toBe("1field");
    expect(tokenToField("BTC")).toBe("3field");
    expect(tokenToField("UNKNOWN")).toBe("0field");
  });

  it("fieldToToken maps correctly", () => {
    expect(fieldToToken("1field")).toBe("ALEO");
    expect(fieldToToken("3field")).toBe("BTC");
    expect(fieldToToken("99field")).toBeUndefined();
  });

  it("registerToken adds a custom token", () => {
    registerToken({
      symbol: "TEST",
      fieldId: "99field",
      decimals: 18,
      isStablecoin: false,
    });

    const token = getToken("TEST");
    expect(token).toBeDefined();
    expect(token!.fieldId).toBe("99field");
    expect(tokenToField("TEST")).toBe("99field");
    expect(fieldToToken("99field")).toBe("TEST");
  });

  it("registerToken overwrites existing", () => {
    registerToken({
      symbol: "TEST",
      fieldId: "100field",
      decimals: 8,
      isStablecoin: true,
    });

    const token = getToken("TEST");
    expect(token!.fieldId).toBe("100field");
    expect(token!.decimals).toBe(8);
  });
});
