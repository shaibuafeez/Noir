/**
 * Session wallets — server-managed Aleo accounts that let the AI agent
 * execute transactions autonomously on behalf of Shield Wallet users.
 *
 * Flow: Shield Wallet user funds a session wallet via transfer_public,
 * then the AI can sign trades without per-transaction popups.
 */

import { Account } from "@provablehq/sdk";
import {
  insertSessionWallet,
  getSessionWalletRow,
  deactivateSessionWalletRow,
  updateSessionWalletFunded,
} from "../storage/db.js";

export interface SessionWalletInfo {
  active: boolean;
  sessionAddress: string;
  shieldAddress: string;
  fundedAmount: number;
}

/**
 * Create a new session wallet for a user. Generates a fresh Aleo Account
 * and stores the private key. Returns the session address for the user
 * to fund via their Shield Wallet.
 */
export function createSessionWallet(
  userId: string,
  shieldAddress: string,
): { sessionAddress: string } {
  const account = new Account();
  const sessionAddress = account.address().to_string();
  const privateKey = account.privateKey().to_string();

  insertSessionWallet(userId, shieldAddress, sessionAddress, privateKey);
  console.log(`[session-wallet] Created for ${userId}: ${sessionAddress}`);

  return { sessionAddress };
}

/**
 * Load the active session wallet Account for autonomous signing.
 * Returns null if no active session wallet exists.
 */
export function getSessionWallet(userId: string): Account | null {
  const row = getSessionWalletRow(userId);
  if (!row) return null;
  return new Account({ privateKey: row.session_private_key });
}

/**
 * Get session wallet info (for UI display).
 */
export function getSessionWalletInfo(userId: string): SessionWalletInfo | null {
  const row = getSessionWalletRow(userId);
  if (!row) return null;
  return {
    active: row.active === 1,
    sessionAddress: row.session_address,
    shieldAddress: row.shield_address,
    fundedAmount: row.funded_amount,
  };
}

/**
 * Check if user has an active session wallet.
 */
export function hasSessionWallet(userId: string): boolean {
  return getSessionWalletRow(userId) !== undefined;
}

/**
 * Deactivate session wallet. Returns the shield address for reclaim.
 */
export function deactivateSessionWallet(
  userId: string,
): { shieldAddress: string } | null {
  const row = getSessionWalletRow(userId);
  if (!row) return null;
  deactivateSessionWalletRow(userId);
  console.log(`[session-wallet] Deactivated for ${userId}`);
  return { shieldAddress: row.shield_address };
}

/**
 * Update the funded amount after user sends credits to the session wallet.
 */
export function setSessionWalletFunded(
  userId: string,
  amount: number,
): void {
  updateSessionWalletFunded(userId, amount);
}
