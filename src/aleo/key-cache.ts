/**
 * Proving key cache — prewarms the AleoKeyProvider in-memory cache
 * on startup so the first trade doesn't wait ~150s for HTTP fetch.
 *
 * The SDK's AleoKeyProvider caches keys in memory once fetched.
 * This module triggers that fetch early, in the background.
 */

import { AleoKeyProvider } from "@provablehq/sdk";

let cachedKeyProvider: AleoKeyProvider | null = null;

export function getCachedKeyProvider(): AleoKeyProvider {
  if (!cachedKeyProvider) {
    cachedKeyProvider = new AleoKeyProvider();
    cachedKeyProvider.useCache(true);
  }
  return cachedKeyProvider;
}

/**
 * Pre-fetch commonly used proving keys in the background.
 * Warms the in-memory cache so subsequent program executions
 * skip the HTTP fetch entirely.
 */
export async function prewarmKeys(): Promise<void> {
  const kp = getCachedKeyProvider();

  const warmups = [
    { name: "transfer_public", fn: () => kp.transferPublicKeys() },
    { name: "fee_public", fn: () => kp.feePublicKeys() },
  ];

  for (const { name, fn } of warmups) {
    try {
      console.log(`[key-cache] Prewarming ${name}...`);
      await fn();
      console.log(`[key-cache] ${name} cached`);
    } catch (err) {
      console.warn(`[key-cache] Failed to prewarm ${name}:`, err instanceof Error ? err.message : err);
    }
  }
}
