import { describe, it, expect, beforeAll } from "vitest";
import {
  initDb,
  getUser,
  getUserByOAuth,
  updateUserOAuth,
  upsertUser,
} from "../src/storage/db.js";
import {
  deriveOAuthSessionId,
  computeCommitment,
} from "../src/aleo/zklogin.js";

describe("zklogin", () => {
  beforeAll(() => {
    initDb(":memory:");
  });

  // ── DB: OAuth columns ──

  describe("database oauth columns", () => {
    it("new users have null oauth fields", () => {
      upsertUser("zk_test_1", "aleo1abc", "pk1");
      const user = getUser("zk_test_1");
      expect(user).toBeDefined();
      expect(user!.oauth_provider).toBeNull();
      expect(user!.oauth_sub).toBeNull();
    });

    it("updateUserOAuth sets oauth fields", () => {
      updateUserOAuth("zk_test_1", "google", "sub_123");
      const user = getUser("zk_test_1");
      expect(user!.oauth_provider).toBe("google");
      expect(user!.oauth_sub).toBe("sub_123");
    });

    it("getUserByOAuth finds user by provider+sub", () => {
      const user = getUserByOAuth("google", "sub_123");
      expect(user).toBeDefined();
      expect(user!.telegram_id).toBe("zk_test_1");
    });

    it("getUserByOAuth returns undefined for unknown", () => {
      expect(getUserByOAuth("google", "nonexistent")).toBeUndefined();
    });
  });

  // ── Session ID derivation ──

  describe("deriveOAuthSessionId", () => {
    it("produces consistent session IDs", () => {
      const a = deriveOAuthSessionId("google", "12345");
      const b = deriveOAuthSessionId("google", "12345");
      expect(a).toBe(b);
      expect(a).toBe("oauth_google_12345");
    });

    it("different subs produce different IDs", () => {
      const a = deriveOAuthSessionId("google", "111");
      const b = deriveOAuthSessionId("google", "222");
      expect(a).not.toBe(b);
    });

    it("different providers produce different IDs", () => {
      const a = deriveOAuthSessionId("google", "111");
      const b = deriveOAuthSessionId("github", "111");
      expect(a).not.toBe(b);
    });
  });

  // ── Commitment computation ──

  describe("computeCommitment", () => {
    it("is deterministic", () => {
      const a = computeCommitment("https://accounts.google.com", "sub_abc");
      const b = computeCommitment("https://accounts.google.com", "sub_abc");
      expect(a).toBe(b);
    });

    it("returns a hex string of 62 chars (31 bytes)", () => {
      const c = computeCommitment("https://accounts.google.com", "test");
      expect(c).toMatch(/^[0-9a-f]{62}$/);
    });

    it("different inputs produce different commitments", () => {
      const a = computeCommitment("https://accounts.google.com", "sub_1");
      const b = computeCommitment("https://accounts.google.com", "sub_2");
      expect(a).not.toBe(b);
    });
  });
});
