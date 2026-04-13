/**
 * zkLogin commitment computation — browser + Node.js compatible.
 *
 * Computes SHA-256 commitment from issuer + subject + salt.
 * Truncated to 31 bytes (248 bits) to fit in an Aleo field element (< 2^253).
 */

/**
 * Compute a zkLogin commitment (async, uses Web Crypto API when available).
 *
 * @param issuer - OAuth issuer (e.g. "accounts.google.com").
 * @param subject - OAuth subject (user ID).
 * @param salt - Domain separation salt. Default: "ghost_zklogin_v1".
 * @returns Hex-encoded commitment string (62 chars = 31 bytes).
 */
export async function computeCommitment(
  issuer: string,
  subject: string,
  salt = "ghost_zklogin_v1",
): Promise<string> {
  const input = `${salt}:${issuer}:${subject}`;
  const encoded = new TextEncoder().encode(input);

  // Prefer Web Crypto API (works in browsers and modern Node.js)
  if (typeof globalThis.crypto?.subtle !== "undefined") {
    const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", encoded);
    const hashArray = new Uint8Array(hashBuffer);
    const hex = Array.from(hashArray)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hex.slice(0, 62);
  }

  // Fallback to Node.js crypto
  const { createHash } = await import("node:crypto");
  const hash = createHash("sha256").update(input).digest("hex");
  return hash.slice(0, 62);
}

/**
 * Compute a zkLogin commitment synchronously (Node.js only).
 *
 * @param issuer - OAuth issuer.
 * @param subject - OAuth subject.
 * @param salt - Domain separation salt. Default: "ghost_zklogin_v1".
 * @returns Hex-encoded commitment string (62 chars = 31 bytes).
 */
export function computeCommitmentSync(
  issuer: string,
  subject: string,
  salt = "ghost_zklogin_v1",
): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createHash } = require("node:crypto") as typeof import("node:crypto");
  const hash = createHash("sha256")
    .update(`${salt}:${issuer}:${subject}`)
    .digest("hex");
  return hash.slice(0, 62);
}
