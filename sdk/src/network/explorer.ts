/**
 * Provable explorer API — read on-chain mappings.
 */

import { PROGRAMS } from "../constants.js";
import { NetworkError } from "../errors.js";
import type { AleoNetwork, NetworkConfig, OnChainLaunchState } from "../types.js";
import { resolveNetworkConfig } from "./config.js";

export class ExplorerClient {
  private readonly config: NetworkConfig;

  constructor(network: AleoNetwork = "testnet", priorityFee?: number) {
    this.config = resolveNetworkConfig(network, priorityFee);
  }

  /** Base URL for the explorer API. */
  private get baseUrl(): string {
    return this.config.explorerUrl;
  }

  /**
   * Read a value from an on-chain mapping.
   *
   * @param program - Program ID (e.g. "ghost_trade_v2.aleo").
   * @param mapping - Mapping name (e.g. "supply_sold").
   * @param key - Mapping key (e.g. "123field").
   * @returns The raw string value, or null if not found.
   */
  async getMappingValue(
    program: string,
    mapping: string,
    key: string,
  ): Promise<string | null> {
    const url = `${this.baseUrl}/program/${program}/mapping/${mapping}/${key}`;
    try {
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const raw = await resp.text();
      return raw.replace(/"/g, "").trim() || null;
    } catch (err) {
      throw new NetworkError(
        `Failed to read mapping ${program}/${mapping}/${key}`,
        err,
      );
    }
  }

  /**
   * Fetch on-chain state for a launchpad token.
   *
   * Reads supply_sold, graduated, and launch_creators mappings
   * from ghost_launchpad_v1.aleo.
   *
   * @param launchId - The launch ID (without "field" suffix — it's appended automatically).
   */
  async getLaunchState(launchId: string): Promise<OnChainLaunchState> {
    const program = PROGRAMS.LAUNCHPAD;
    const key = launchId.endsWith("field") ? launchId : `${launchId}field`;
    const base = `${this.baseUrl}/program/${program}/mapping`;

    const [supplyResp, gradResp, creatorResp] = await Promise.allSettled([
      fetch(`${base}/supply_sold/${key}`),
      fetch(`${base}/graduated/${key}`),
      fetch(`${base}/launch_creators/${key}`),
    ]);

    let supplySold = 0;
    if (supplyResp.status === "fulfilled" && supplyResp.value.ok) {
      const raw = await supplyResp.value.text();
      supplySold = parseInt(raw.replace(/"/g, "").trim(), 10) || 0;
    }

    let graduated = false;
    if (gradResp.status === "fulfilled" && gradResp.value.ok) {
      const raw = await gradResp.value.text();
      graduated = raw.replace(/"/g, "").trim() === "true";
    }

    let creator: string | null = null;
    if (creatorResp.status === "fulfilled" && creatorResp.value.ok) {
      const raw = await creatorResp.value.text();
      creator = raw.replace(/"/g, "").trim() || null;
    }

    return { supplySold, graduated, creator };
  }
}
