import { describe, it, expect, beforeAll } from "vitest";
import {
  initDb,
  upsertUser,
  createCopyStrategy,
  getFollowersOf,
  getUserCopyStrategies,
  cancelCopyStrategy,
  cancelAllCopyStrategies,
  incrementCopyCount,
} from "../src/storage/db.js";
import { parseWithRegex } from "../src/agent/parser.js";
import { isLeaderInChain, addToChain, removeFromChain } from "../src/market/copy.js";

describe("copy trading", () => {
  beforeAll(() => {
    initDb(":memory:");
    upsertUser("leader1", "aleo1leader", "key1");
    upsertUser("follower1", "aleo1follower", "key2");
    upsertUser("follower2", "aleo1follower2", "key3");
  });

  // ── Database ──
  describe("database", () => {
    it("creates a copy strategy", () => {
      const id = createCopyStrategy("follower1", "leader1");
      expect(id).toBeGreaterThan(0);
    });

    it("retrieves followers of a leader", () => {
      const followers = getFollowersOf("leader1");
      expect(followers.length).toBe(1);
      expect(followers[0]!.follower_id).toBe("follower1");
      expect(followers[0]!.mode).toBe("proportional");
    });

    it("retrieves user copy strategies", () => {
      const strategies = getUserCopyStrategies("follower1");
      expect(strategies.length).toBe(1);
      expect(strategies[0]!.leader_id).toBe("leader1");
    });

    it("upserts on duplicate (reactivates)", () => {
      const id = createCopyStrategy("follower1", "leader1", "fixed", 100);
      expect(id).toBeGreaterThan(0);
      const strategies = getUserCopyStrategies("follower1");
      expect(strategies.length).toBe(1);
      expect(strategies[0]!.mode).toBe("fixed");
      expect(strategies[0]!.fixed_amount).toBe(100);
    });

    it("increments copy count", () => {
      const strategies = getUserCopyStrategies("follower1");
      const id = strategies[0]!.id;
      incrementCopyCount(id);
      incrementCopyCount(id);
      const updated = getUserCopyStrategies("follower1");
      expect(updated[0]!.total_copied).toBe(2);
    });

    it("cancels a specific copy strategy", () => {
      cancelCopyStrategy("follower1", "leader1");
      const strategies = getUserCopyStrategies("follower1");
      expect(strategies.length).toBe(0);
      const followers = getFollowersOf("leader1");
      expect(followers.length).toBe(0);
    });

    it("cancels all copy strategies", () => {
      createCopyStrategy("follower2", "leader1");
      createCopyStrategy("follower2", "follower1");
      expect(getUserCopyStrategies("follower2").length).toBe(2);
      cancelAllCopyStrategies("follower2");
      expect(getUserCopyStrategies("follower2").length).toBe(0);
    });
  });

  // ── Parser ──
  describe("parser", () => {
    it("parses 'copy alice'", () => {
      const result = parseWithRegex("copy alice");
      expect(result).toEqual({ action: "copy", leader: "alice" });
    });

    it("parses 'follow @bob'", () => {
      const result = parseWithRegex("follow @bob");
      expect(result).toEqual({ action: "copy", leader: "bob" });
    });

    it("parses 'mirror trader @charlie'", () => {
      const result = parseWithRegex("mirror trader @charlie");
      expect(result).toEqual({ action: "copy", leader: "charlie" });
    });

    it("parses 'stop copy alice'", () => {
      const result = parseWithRegex("stop copy alice");
      expect(result).not.toBeNull();
      expect(result!.action).toBe("stopcopy");
      if (result!.action === "stopcopy") {
        expect(result!.leader).toBe("alice");
      }
    });

    it("parses 'stop copy' (no leader)", () => {
      const result = parseWithRegex("stop copy");
      expect(result).not.toBeNull();
      expect(result!.action).toBe("stopcopy");
      if (result!.action === "stopcopy") {
        expect(result!.leader).toBeUndefined();
      }
    });

    it("parses 'unfollow alice'", () => {
      const result = parseWithRegex("unfollow alice");
      expect(result).not.toBeNull();
      expect(result!.action).toBe("stopcopy");
      if (result!.action === "stopcopy") {
        expect(result!.leader).toBe("alice");
      }
    });

    it("parses 'copies'", () => {
      expect(parseWithRegex("copies")).toEqual({ action: "copies" });
    });

    it("parses 'copy list'", () => {
      expect(parseWithRegex("copy list")).toEqual({ action: "copies" });
    });

    it("parses 'who am i following'", () => {
      expect(parseWithRegex("who am i following")).toEqual({ action: "copies" });
    });

    it("parses 'following'", () => {
      expect(parseWithRegex("following")).toEqual({ action: "copies" });
    });
  });

  // ── Recursion guard ──
  describe("recursion guard", () => {
    it("detects leader in active chain", () => {
      expect(isLeaderInChain("leader1")).toBe(false);
      addToChain("leader1");
      expect(isLeaderInChain("leader1")).toBe(true);
      removeFromChain("leader1");
      expect(isLeaderInChain("leader1")).toBe(false);
    });

    it("handles multiple leaders independently", () => {
      addToChain("a");
      addToChain("b");
      expect(isLeaderInChain("a")).toBe(true);
      expect(isLeaderInChain("b")).toBe(true);
      expect(isLeaderInChain("c")).toBe(false);
      removeFromChain("a");
      removeFromChain("b");
    });
  });
});
