import { describe, it, expect } from "vitest";
import { computeCommitment, computeCommitmentSync } from "../src/zklogin/commitment.js";

describe("commitment", () => {
  const issuer = "accounts.google.com";
  const subject = "123456789";
  const salt = "ghost_zklogin_v1";

  it("async: returns 62-char hex string", async () => {
    const result = await computeCommitment(issuer, subject, salt);
    expect(result).toHaveLength(62);
    expect(result).toMatch(/^[0-9a-f]{62}$/);
  });

  it("sync: returns 62-char hex string", () => {
    const result = computeCommitmentSync(issuer, subject, salt);
    expect(result).toHaveLength(62);
    expect(result).toMatch(/^[0-9a-f]{62}$/);
  });

  it("async and sync produce the same result", async () => {
    const asyncResult = await computeCommitment(issuer, subject, salt);
    const syncResult = computeCommitmentSync(issuer, subject, salt);
    expect(asyncResult).toBe(syncResult);
  });

  it("deterministic — same inputs produce same output", async () => {
    const a = await computeCommitment(issuer, subject, salt);
    const b = await computeCommitment(issuer, subject, salt);
    expect(a).toBe(b);
  });

  it("different inputs produce different outputs", async () => {
    const a = await computeCommitment(issuer, "user1", salt);
    const b = await computeCommitment(issuer, "user2", salt);
    expect(a).not.toBe(b);
  });

  it("different salts produce different outputs", async () => {
    const a = await computeCommitment(issuer, subject, "salt1");
    const b = await computeCommitment(issuer, subject, "salt2");
    expect(a).not.toBe(b);
  });

  it("uses default salt when omitted", async () => {
    const withDefault = await computeCommitment(issuer, subject);
    const withExplicit = await computeCommitment(issuer, subject, "ghost_zklogin_v1");
    expect(withDefault).toBe(withExplicit);
  });
});
