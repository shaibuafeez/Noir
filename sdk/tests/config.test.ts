import { describe, it, expect } from "vitest";
import { resolveNetworkConfig } from "../src/network/config.js";

describe("network config", () => {
  it("defaults to testnet", () => {
    const config = resolveNetworkConfig();
    expect(config.network).toBe("testnet");
    expect(config.label).toBe("Aleo Testnet");
    expect(config.defaultPriorityFee).toBe(0.02);
  });

  it("resolves mainnet", () => {
    const config = resolveNetworkConfig("mainnet");
    expect(config.network).toBe("mainnet");
    expect(config.label).toBe("Aleo Mainnet");
    expect(config.defaultPriorityFee).toBe(0.05);
  });

  it("applies priority fee override", () => {
    const config = resolveNetworkConfig("testnet", 0.1);
    expect(config.defaultPriorityFee).toBe(0.1);
  });

  it("ignores negative priority fee", () => {
    const config = resolveNetworkConfig("testnet", -1);
    expect(config.defaultPriorityFee).toBe(0.02);
  });

  it("allows zero priority fee", () => {
    const config = resolveNetworkConfig("testnet", 0);
    expect(config.defaultPriorityFee).toBe(0);
  });

  it("throws on unknown network", () => {
    expect(() => resolveNetworkConfig("devnet" as any)).toThrow("Unknown network");
  });

  it("does not mutate the original config", () => {
    const a = resolveNetworkConfig("testnet", 0.5);
    const b = resolveNetworkConfig("testnet");
    expect(a.defaultPriorityFee).toBe(0.5);
    expect(b.defaultPriorityFee).toBe(0.02);
  });
});
