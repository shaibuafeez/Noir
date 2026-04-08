import { describe, it, expect } from "vitest";
import { parseWithRegex } from "../src/agent/parser.js";

describe("parseWithRegex", () => {
  // ── Buy / Sell ──
  describe("buy/sell", () => {
    it("parses 'buy 100 ALEO'", () => {
      expect(parseWithRegex("buy 100 ALEO")).toEqual({
        action: "buy",
        amount: 100,
        token: "ALEO",
      });
    });

    it("parses 'sell 50.5 BTC'", () => {
      expect(parseWithRegex("sell 50.5 BTC")).toEqual({
        action: "sell",
        amount: 50.5,
        token: "BTC",
      });
    });

    it("parses 'get 200 ETH' as buy", () => {
      const result = parseWithRegex("get 200 ETH");
      expect(result).not.toBeNull();
      expect(result!.action).toBe("buy");
    });

    it("parses 'dump 10 SOL' as sell", () => {
      const result = parseWithRegex("dump 10 SOL");
      expect(result).not.toBeNull();
      expect(result!.action).toBe("sell");
    });
  });

  // ── Limit orders ──
  describe("limit orders", () => {
    it("parses 'limit buy 100 ALEO at 0.50'", () => {
      expect(parseWithRegex("limit buy 100 ALEO at 0.50")).toEqual({
        action: "limit",
        side: "buy",
        amount: 100,
        token: "ALEO",
        targetPrice: 0.5,
      });
    });

    it("parses 'limit sell 50 BTC at $65000'", () => {
      const result = parseWithRegex("limit sell 50 BTC at $65000");
      expect(result).not.toBeNull();
      expect(result!.action).toBe("limit");
    });
  });

  // ── Portfolio ──
  describe("portfolio", () => {
    it("parses 'portfolio'", () => {
      expect(parseWithRegex("portfolio")).toEqual({ action: "portfolio" });
    });

    it("parses 'balance'", () => {
      expect(parseWithRegex("balance")).toEqual({ action: "portfolio" });
    });

    it("parses 'holdings'", () => {
      expect(parseWithRegex("holdings")).toEqual({ action: "portfolio" });
    });
  });

  // ── Send ──
  describe("send", () => {
    it("parses 'send 10 ALEO to aleo1...'", () => {
      const addr = "aleo1" + "a".repeat(58);
      const result = parseWithRegex(`send 10 ALEO to ${addr}`);
      expect(result).not.toBeNull();
      expect(result!.action).toBe("send");
    });
  });

  // ── DCA / Stack ──
  describe("stack/dca", () => {
    it("parses 'stack ALEO $50 day'", () => {
      const result = parseWithRegex("stack ALEO $50 day");
      expect(result).not.toBeNull();
      expect(result!.action).toBe("stack");
      if (result!.action === "stack") {
        expect(result!.token).toBe("ALEO");
        expect(result!.amount).toBe(50);
        expect(result!.interval).toBe("daily");
      }
    });

    it("parses 'dca ALEO 100 weekly'", () => {
      const result = parseWithRegex("dca ALEO 100 weekly");
      expect(result).not.toBeNull();
      if (result!.action === "stack") {
        expect(result!.interval).toBe("weekly");
      }
    });
  });

  // ── Protection ──
  describe("protection", () => {
    it("parses 'protect at 20%'", () => {
      expect(parseWithRegex("protect at 20%")).toEqual({
        action: "protect",
        threshold: 20,
      });
    });

    it("parses 'stop loss 15%'", () => {
      const result = parseWithRegex("stop-loss 15%");
      expect(result).not.toBeNull();
      expect(result!.action).toBe("protect");
    });
  });

  // ── Rebalance ──
  describe("rebalance", () => {
    it("parses 'rebalance 60 ALEO 40 USDC'", () => {
      const result = parseWithRegex("rebalance 60 ALEO 40 USDC");
      expect(result).not.toBeNull();
      expect(result!.action).toBe("rebalance");
      if (result!.action === "rebalance") {
        expect(result!.allocations).toEqual({ ALEO: 60, USDC: 40 });
      }
    });
  });

  // ── Ghost mode ──
  describe("ghost mode", () => {
    it("parses 'go dark'", () => {
      expect(parseWithRegex("go dark")).toEqual({ action: "godark" });
    });

    it("parses 'ghost mode'", () => {
      expect(parseWithRegex("ghost mode")).toEqual({ action: "godark" });
    });

    it("parses 'go public'", () => {
      expect(parseWithRegex("go public")).toEqual({ action: "gopublic" });
    });
  });

  // ── Alerts ──
  describe("alerts", () => {
    it("parses 'if ALEO drops 15%, sell half'", () => {
      const result = parseWithRegex("if ALEO drops 15%, sell half");
      expect(result).not.toBeNull();
      expect(result!.action).toBe("alert");
      if (result!.action === "alert") {
        expect(result!.token).toBe("ALEO");
        expect(result!.condition).toBe("drops_pct");
        expect(result!.threshold).toBe(15);
        expect(result!.tradeAction).toBe("sell_pct");
        expect(result!.tradeValue).toBe(50);
      }
    });

    it("parses 'alert when ALEO rises 20%'", () => {
      const result = parseWithRegex("alert when ALEO rises 20%");
      expect(result).not.toBeNull();
      if (result!.action === "alert") {
        expect(result!.condition).toBe("rises_pct");
      }
    });

    it("parses 'notify me when ALEO hits $1'", () => {
      const result = parseWithRegex("notify me when ALEO hits $1");
      expect(result).not.toBeNull();
      if (result!.action === "alert") {
        expect(result!.condition).toBe("above");
        expect(result!.threshold).toBe(1);
      }
    });
  });

  // ── Tokens ──
  describe("tokens", () => {
    it("parses 'tokens'", () => {
      expect(parseWithRegex("tokens")).toEqual({ action: "tokens" });
    });

    it("parses 'what can I trade'", () => {
      expect(parseWithRegex("what can I trade")).toEqual({ action: "tokens" });
    });
  });

  // ── Other intents ──
  describe("other intents", () => {
    it("parses 'why'", () => {
      expect(parseWithRegex("why")).toEqual({ action: "why" });
    });

    it("parses 'export'", () => {
      expect(parseWithRegex("export")).toEqual({ action: "export" });
    });

    it("parses 'market ALEO'", () => {
      expect(parseWithRegex("market ALEO")).toEqual({ action: "market", token: "ALEO" });
    });

    it("parses 'status'", () => {
      expect(parseWithRegex("status")).toEqual({ action: "status" });
    });
  });

  // ── Fallback ──
  describe("unknown", () => {
    it("returns null for unrecognized input", () => {
      expect(parseWithRegex("hello world")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(parseWithRegex("")).toBeNull();
    });
  });
});
