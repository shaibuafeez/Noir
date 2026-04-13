/**
 * ZkLoginClient — on-chain zkLogin interaction via ghost_zklogin_v1.aleo.
 */

import { PROGRAMS } from "../constants.js";
import { TransactionError, ValidationError } from "../errors.js";
import type { AleoNetwork, NetworkConfig, TransactionResult } from "../types.js";
import { resolveNetworkConfig } from "../network/config.js";

export class ZkLoginClient {
  private readonly account: any;
  private readonly config: NetworkConfig;

  constructor(account: any, network: AleoNetwork = "testnet", priorityFee?: number) {
    this.account = account;
    this.config = resolveNetworkConfig(network, priorityFee);
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
   * Register a zkLogin commitment on-chain.
   *
   * @param commitment - Hex-encoded commitment from computeCommitment().
   */
  async registerCommitment(commitment: string): Promise<TransactionResult> {
    if (!commitment || commitment.length !== 62) {
      throw new ValidationError("Commitment must be a 62-character hex string");
    }

    const pm = this.createProgramManager();
    const commitField = `${commitment}field`;

    try {
      const txHash = await pm.execute({
        programName: PROGRAMS.ZKLOGIN,
        functionName: "register",
        inputs: [commitField],
        priorityFee: this.config.defaultPriorityFee,
        privateFee: false,
      });

      const hash = typeof txHash === "string" ? txHash : String(txHash);
      return {
        txHash: hash,
        message: `zkLogin commitment registered. Tx: ${hash}`,
      };
    } catch (err) {
      throw new TransactionError(
        `Failed to register commitment: ${err instanceof Error ? err.message : String(err)}`,
        undefined,
        err,
      );
    }
  }

  /**
   * Verify a zkLogin identity on-chain.
   *
   * @param commitment - Hex-encoded commitment to verify.
   */
  async verifyIdentity(commitment: string): Promise<TransactionResult> {
    if (!commitment || commitment.length !== 62) {
      throw new ValidationError("Commitment must be a 62-character hex string");
    }

    const pm = this.createProgramManager();
    const commitField = `${commitment}field`;

    try {
      const txHash = await pm.execute({
        programName: PROGRAMS.ZKLOGIN,
        functionName: "verify",
        inputs: [commitField],
        priorityFee: this.config.defaultPriorityFee,
        privateFee: false,
      });

      const hash = typeof txHash === "string" ? txHash : String(txHash);
      return {
        txHash: hash,
        message: `zkLogin identity verified. Tx: ${hash}`,
      };
    } catch (err) {
      throw new TransactionError(
        `Failed to verify identity: ${err instanceof Error ? err.message : String(err)}`,
        undefined,
        err,
      );
    }
  }
}
