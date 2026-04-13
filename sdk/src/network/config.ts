/**
 * Network configuration resolver — no process.env dependency.
 */

import { NETWORKS } from "../constants.js";
import type { AleoNetwork, NetworkConfig } from "../types.js";

/**
 * Resolve network config for the given network name.
 *
 * @param network - "testnet" or "mainnet". Default: "testnet".
 * @param priorityFeeOverride - Optional priority fee override.
 */
export function resolveNetworkConfig(
  network: AleoNetwork = "testnet",
  priorityFeeOverride?: number,
): NetworkConfig {
  const base = NETWORKS[network];
  if (!base) {
    throw new Error(`Unknown network: "${network}". Must be "testnet" or "mainnet".`);
  }

  const config = { ...base };
  if (priorityFeeOverride !== undefined && priorityFeeOverride >= 0) {
    config.defaultPriorityFee = priorityFeeOverride;
  }

  return config;
}
