import { describe, it, expect, beforeAll } from "vitest";
import {
  initDb,
  upsertUser,
  getUser,
  recordTrade,
  getTradeHistory,
  createPendingOrder,
  getPendingOrders,
  createDcaStrategy,
  getUserDcaStrategies,
  createAlert,
  getUserAlerts,
  logDecision,
  getDecisionHistory,
  recordPrice,
  getPriceHistory,
} from "../src/storage/db.js";

describe("database", () => {
  beforeAll(() => {
    // Use in-memory database for tests
    initDb(":memory:");
  });

  describe("users", () => {
    it("creates and retrieves a user", () => {
      upsertUser("test_user_1", "aleo1abc", "privatekey123");
      const user = getUser("test_user_1");
      expect(user).toBeDefined();
      expect(user!.aleo_address).toBe("aleo1abc");
    });

    it("upserts existing user", () => {
      upsertUser("test_user_1", "aleo1new", "newkey");
      const user = getUser("test_user_1");
      expect(user!.aleo_address).toBe("aleo1new");
    });

    it("returns undefined for non-existent user", () => {
      expect(getUser("nobody")).toBeUndefined();
    });
  });

  describe("trade history", () => {
    it("records and retrieves trades", () => {
      recordTrade("test_user_1", "buy", "ALEO", 100, 0.5, "tx_hash_1");
      recordTrade("test_user_1", "sell", "ALEO", 50, 0.6, "tx_hash_2");
      const history = getTradeHistory("test_user_1");
      expect(history.length).toBe(2);
      const actions = history.map((t) => t.action).sort();
      expect(actions).toEqual(["buy", "sell"]);
    });
  });

  describe("pending orders", () => {
    it("creates a limit order", () => {
      const id = createPendingOrder("test_user_1", "buy", "ALEO", 100, 0.45);
      expect(id).toBeGreaterThan(0);
      const orders = getPendingOrders();
      expect(orders.length).toBeGreaterThan(0);
      expect(orders.some((o) => o.id === id)).toBe(true);
    });
  });

  describe("DCA strategies", () => {
    it("creates and retrieves DCA strategy", () => {
      const id = createDcaStrategy("test_user_1", "ALEO", 50, "daily");
      expect(id).toBeGreaterThan(0);
      const strategies = getUserDcaStrategies("test_user_1");
      expect(strategies.length).toBeGreaterThan(0);
      expect(strategies.some((s) => s.token === "ALEO")).toBe(true);
    });
  });

  describe("alerts", () => {
    it("creates and retrieves alert", () => {
      const id = createAlert("test_user_1", "ALEO", "drops_pct", 15, "sell_pct", { percent: 50 });
      expect(id).toBeGreaterThan(0);
      const alerts = getUserAlerts("test_user_1");
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  describe("agent decisions", () => {
    it("logs and retrieves decisions", () => {
      logDecision(
        "test_user_1",
        "buy 100 ALEO",
        "buy",
        "ALEO $0.50 RSI 45",
        "User requested buy at fair RSI level",
        "executed",
        "tx_abc",
      );
      const decisions = getDecisionHistory("test_user_1", 5);
      expect(decisions.length).toBeGreaterThan(0);
      expect(decisions[0]!.parsed_action).toBe("buy");
    });
  });

  describe("price history", () => {
    it("records and retrieves prices", () => {
      recordPrice("ALEO", 0.5);
      recordPrice("ALEO", 0.51);
      recordPrice("ALEO", 0.52);
      const history = getPriceHistory("ALEO", 10);
      expect(history.length).toBe(3);
      expect(history[0]!.price).toBe(0.52); // DESC order
    });
  });
});
