import { createHash } from "node:crypto";
import { Account } from "@provablehq/sdk";
import {
  upsertUser,
  getUser,
  getUserByOAuth,
  updateUserOAuth,
} from "../storage/db.js";

/**
 * Derive a deterministic session ID from an OAuth provider and subject.
 * This is used as the `telegram_id` primary key so all existing FK references work.
 */
export function deriveOAuthSessionId(provider: string, sub: string): string {
  return `oauth_${provider}_${sub}`;
}

/**
 * Compute a Poseidon-compatible commitment from issuer + subject.
 * Returns a hex string truncated to fit in an Aleo field (< 2^253).
 * Uses SHA-256 with an optional salt for domain separation.
 */
export function computeCommitment(iss: string, sub: string): string {
  const salt = process.env.GOOGLE_ZKLOGIN_SALT ?? "ghost_zklogin_v2";
  const hash = createHash("sha256")
    .update(`${salt}:${iss}:${sub}`)
    .digest("hex");
  // Truncate to 31 bytes (248 bits) to safely fit in an Aleo field element (< 2^253)
  return hash.slice(0, 62);
}

/**
 * Get or create a wallet for an OAuth-authenticated user.
 * If the user already has a wallet (looked up by oauth_provider+sub), return it.
 * Otherwise create a new Aleo Account, persist it, and return the address.
 */
export function getOrCreateOAuthWallet(
  provider: string,
  sub: string,
  iss: string,
): { address: string; sessionId: string; isNew: boolean } {
  const sessionId = deriveOAuthSessionId(provider, sub);

  // Check if user exists by OAuth lookup
  const existing = getUserByOAuth(provider, sub);
  if (existing) {
    return { address: existing.aleo_address, sessionId, isNew: false };
  }

  // Check if user exists by session ID (e.g. created before OAuth columns)
  const bySession = getUser(sessionId);
  if (bySession) {
    // Backfill OAuth metadata
    updateUserOAuth(sessionId, provider, sub);
    return { address: bySession.aleo_address, sessionId, isNew: false };
  }

  // Create new wallet
  const account = new Account();
  const address = account.address().to_string();
  const privateKey = account.privateKey().to_string();

  upsertUser(sessionId, address, privateKey);
  updateUserOAuth(sessionId, provider, sub);

  return { address, sessionId, isNew: true };
}
