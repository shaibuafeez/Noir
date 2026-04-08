import { Account } from "@provablehq/sdk";
import { upsertUser, getUser } from "../storage/db.js";

/**
 * Create a new Aleo account and persist it for a Telegram user.
 * Returns the Account object and the public address.
 */
export function createWallet(telegramId: string): {
  account: Account;
  address: string;
} {
  const account = new Account();
  const address = account.address().to_string();
  const privateKey = account.privateKey().to_string();

  // Store the private key directly — in production this would be encrypted.
  upsertUser(telegramId, address, privateKey);

  return { account, address };
}

/**
 * Load a user's Aleo account from the database.
 */
export function loadWallet(telegramId: string): Account | null {
  const row = getUser(telegramId);
  if (!row) return null;
  return new Account({ privateKey: row.encrypted_private_key });
}

/**
 * Get the Aleo address for a Telegram user.
 */
export function getAddress(telegramId: string): string | null {
  const row = getUser(telegramId);
  return row?.aleo_address ?? null;
}
