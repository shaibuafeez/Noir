/**
 * LaunchpadClient — on-chain launchpad interaction via ghost_launchpad_v1.aleo.
 *
 * Extracted from src/launchpad/engine.ts — no DB calls, pure on-chain + validation.
 */

import { PROGRAMS, LAUNCHPAD } from "../constants.js";
import {
  LaunchpadError,
  TransactionError,
  ValidationError,
} from "../errors.js";
import type {
  AleoNetwork,
  NetworkConfig,
  OnChainLaunchState,
  LaunchTradeResult,
  TransactionResult,
} from "../types.js";
import { resolveNetworkConfig } from "../network/config.js";
import { ExplorerClient } from "../network/explorer.js";
import { getBuyCost, getSellRefund } from "./bonding-curve.js";

export class LaunchpadClient {
  private readonly account: any;
  private readonly config: NetworkConfig;
  private readonly explorer: ExplorerClient;
  private readonly network: AleoNetwork;

  constructor(account: any, network: AleoNetwork = "testnet", priorityFee?: number) {
    this.account = account;
    this.network = network;
    this.config = resolveNetworkConfig(network, priorityFee);
    this.explorer = new ExplorerClient(network, priorityFee);
  }

  private createProgramManager(): any {
    let sdk: any;
    try {
      sdk = require("@provablehq/sdk");
    } catch {
      throw new ValidationError(
        "@provablehq/sdk is required for on-chain transactions. Install it as a dependency.",
      );
    }

    const { ProgramManager, AleoNetworkClient, NetworkRecordProvider } = sdk;
    const net = new AleoNetworkClient(this.config.apiUrl);
    const recordProvider = new NetworkRecordProvider(this.account, net);
    const pm = new ProgramManager(this.config.apiUrl, undefined, recordProvider);
    pm.setAccount(this.account);
    return pm;
  }

  /**
   * Get on-chain state for a launch.
   */
  async getLaunchState(launchId: string): Promise<OnChainLaunchState> {
    return this.explorer.getLaunchState(launchId);
  }

  /**
   * Execute create_launch on-chain.
   */
  async createLaunch(launchId: string): Promise<TransactionResult> {
    const pm = this.createProgramManager();
    const idField = launchId.endsWith("field") ? launchId : `${launchId}field`;

    try {
      const txHash = await pm.execute({
        programName: PROGRAMS.LAUNCHPAD,
        functionName: "create_launch",
        inputs: [idField],
        priorityFee: this.config.defaultPriorityFee,
        privateFee: false,
      });

      const hash = typeof txHash === "string" ? txHash : String(txHash);
      return {
        txHash: hash,
        message: `Launch created on-chain. ID: ${launchId}. Tx: ${hash}`,
      };
    } catch (err) {
      throw new TransactionError(
        `Failed to create launch: ${err instanceof Error ? err.message : String(err)}`,
        undefined,
        err,
      );
    }
  }

  /**
   * Buy tokens on the bonding curve.
   *
   * @param launchId - Launch ID.
   * @param amount - Number of tokens to buy.
   * @param maxSlippage - Maximum acceptable slippage (0–1). e.g. 0.05 = 5%.
   */
  async buyToken(
    launchId: string,
    amount: number,
    maxSlippage = 0.05,
  ): Promise<LaunchTradeResult> {
    const intAmount = Math.floor(amount);
    if (intAmount <= 0) throw new ValidationError("Amount must be positive");

    const onChain = await this.getLaunchState(launchId);

    if (onChain.graduated) {
      throw new LaunchpadError("Token has graduated — no more buys on the bonding curve.");
    }

    const newSupply = onChain.supplySold + intAmount;
    if (newSupply > LAUNCHPAD.MAX_SUPPLY) {
      throw new LaunchpadError(
        `Exceeds max supply. Only ${LAUNCHPAD.MAX_SUPPLY - onChain.supplySold} tokens remaining.`,
      );
    }

    const cost = getBuyCost(onChain.supplySold, intAmount);

    // Slippage check: re-quote with worst-case supply shift
    const worstCost = cost * (1 + maxSlippage);

    const pm = this.createProgramManager();
    const idField = launchId.endsWith("field") ? launchId : `${launchId}field`;
    const amountU64 = `${intAmount}u64`;

    try {
      const txHash = await pm.execute({
        programName: PROGRAMS.LAUNCHPAD,
        functionName: "buy_token",
        inputs: [idField, amountU64],
        priorityFee: this.config.defaultPriorityFee,
        privateFee: false,
      });

      const hash = typeof txHash === "string" ? txHash : String(txHash);
      const priceAvg = cost / intAmount;

      return {
        success: true,
        txHash: hash,
        message:
          `BUY ${intAmount.toLocaleString()} tokens\n` +
          `Cost: ${cost.toFixed(0)} microcredits (avg ${priceAvg.toFixed(2)}/token)\n` +
          `Max slippage cost: ${worstCost.toFixed(0)}\n` +
          `Tx: ${hash}`,
      };
    } catch (err) {
      throw new TransactionError(
        `Buy failed: ${err instanceof Error ? err.message : String(err)}`,
        undefined,
        err,
      );
    }
  }

  /**
   * Sell tokens on the bonding curve.
   *
   * @param launchId - Launch ID.
   * @param amount - Number of tokens to sell.
   */
  async sellToken(
    launchId: string,
    amount: number,
  ): Promise<LaunchTradeResult> {
    const intAmount = Math.floor(amount);
    if (intAmount <= 0) throw new ValidationError("Amount must be positive");

    const onChain = await this.getLaunchState(launchId);

    if (intAmount > onChain.supplySold) {
      throw new LaunchpadError(
        `Only ${onChain.supplySold.toLocaleString()} tokens in circulation.`,
      );
    }

    const refund = getSellRefund(onChain.supplySold, intAmount);

    const pm = this.createProgramManager();
    const idField = launchId.endsWith("field") ? launchId : `${launchId}field`;
    const amountU64 = `${intAmount}u64`;

    try {
      const txHash = await pm.execute({
        programName: PROGRAMS.LAUNCHPAD,
        functionName: "sell_token",
        inputs: [idField, amountU64],
        priorityFee: this.config.defaultPriorityFee,
        privateFee: false,
      });

      const hash = typeof txHash === "string" ? txHash : String(txHash);
      const priceAvg = refund / intAmount;

      return {
        success: true,
        txHash: hash,
        message:
          `SELL ${intAmount.toLocaleString()} tokens\n` +
          `Refund: ${refund.toFixed(0)} microcredits (avg ${priceAvg.toFixed(2)}/token)\n` +
          `Tx: ${hash}`,
      };
    } catch (err) {
      throw new TransactionError(
        `Sell failed: ${err instanceof Error ? err.message : String(err)}`,
        undefined,
        err,
      );
    }
  }
}
