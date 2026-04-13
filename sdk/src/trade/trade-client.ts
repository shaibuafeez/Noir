/**
 * TradeClient — on-chain trade execution via ghost_trade_v2.aleo.
 *
 * Extracted from src/aleo/trade.ts — no DB writes, no Telegram notifications.
 */

import { PROGRAMS, TRADE } from "../constants.js";
import { TransactionError, ValidationError } from "../errors.js";
import type {
  AleoNetwork,
  NetworkConfig,
  SwapResult,
  TransactionResult,
} from "../types.js";
import { resolveNetworkConfig } from "../network/config.js";
import { tokenToField } from "./tokens.js";

export class TradeClient {
  private readonly account: any; // Account from @provablehq/sdk
  private readonly config: NetworkConfig;

  constructor(account: any, network: AleoNetwork = "testnet", priorityFee?: number) {
    this.account = account;
    this.config = resolveNetworkConfig(network, priorityFee);
  }

  private createProgramManager(): any {
    // Dynamically import @provablehq/sdk to avoid hard dependency
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
   * Create a private Holding record on-chain (BUY).
   */
  async createHolding(
    tokenSymbol: string,
    amount: number,
  ): Promise<TransactionResult> {
    if (amount <= 0 || amount > TRADE.MAX_TRADE_SIZE) {
      throw new ValidationError(
        `Amount must be between 1 and ${TRADE.MAX_TRADE_SIZE}`,
      );
    }

    const pm = this.createProgramManager();
    const tokenField = tokenToField(tokenSymbol);
    const amountU64 = `${Math.floor(amount)}u64`;

    try {
      const txHash = await pm.execute({
        programName: PROGRAMS.TRADE,
        functionName: "create_holding",
        inputs: [tokenField, amountU64],
        priorityFee: this.config.defaultPriorityFee,
        privateFee: false,
      });

      const hash = typeof txHash === "string" ? txHash : String(txHash);
      return {
        txHash: hash,
        message: `BUY ${amount} ${tokenSymbol} — Holding record created. Tx: ${hash}`,
      };
    } catch (err) {
      throw new TransactionError(
        `Failed to create holding for ${amount} ${tokenSymbol}: ${err instanceof Error ? err.message : String(err)}`,
        undefined,
        err,
      );
    }
  }

  /**
   * Execute a swap on-chain (SELL token → USDT).
   */
  async swap(
    fromToken: string,
    toToken: string,
    amount: number,
    priceBps: number,
  ): Promise<SwapResult> {
    if (amount <= 0 || amount > TRADE.MAX_TRADE_SIZE) {
      throw new ValidationError(
        `Amount must be between 1 and ${TRADE.MAX_TRADE_SIZE}`,
      );
    }

    const pm = this.createProgramManager();
    const fromField = tokenToField(fromToken);
    const toField = tokenToField(toToken);
    const amountU64 = `${Math.floor(amount)}u64`;
    const priceU64 = `${Math.floor(priceBps)}u64`;
    const timestamp = `${Math.floor(Date.now() / 1000)}u64`;

    try {
      const txHash = await pm.execute({
        programName: PROGRAMS.TRADE,
        functionName: "swap",
        inputs: [fromField, toField, amountU64, priceU64, timestamp],
        priorityFee: this.config.defaultPriorityFee,
        privateFee: false,
      });

      const hash = typeof txHash === "string" ? txHash : String(txHash);
      const price = priceBps / TRADE.BASIS_POINTS_DIVISOR;
      return {
        txHash: hash,
        message: `SELL ${amount} ${fromToken} → ${toToken} @ ${price.toFixed(4)}. Tx: ${hash}`,
        action: "sell",
        tokenSymbol: fromToken,
        amount,
        price,
      };
    } catch (err) {
      throw new TransactionError(
        `Swap failed: ${err instanceof Error ? err.message : String(err)}`,
        undefined,
        err,
      );
    }
  }

  /**
   * Transfer a private Holding to another address.
   */
  async transferPrivate(
    tokenSymbol: string,
    recipient: string,
    amount: number,
  ): Promise<TransactionResult> {
    if (amount <= 0) throw new ValidationError("Amount must be positive");

    const pm = this.createProgramManager();
    const tokenField = tokenToField(tokenSymbol);
    const amountU64 = `${Math.floor(amount)}u64`;

    try {
      const txHash = await pm.execute({
        programName: PROGRAMS.TRADE,
        functionName: "transfer_holding",
        inputs: [recipient, tokenField, amountU64],
        priorityFee: this.config.defaultPriorityFee,
        privateFee: false,
      });

      const hash = typeof txHash === "string" ? txHash : String(txHash);
      return {
        txHash: hash,
        message: `Transferred ${amount} ${tokenSymbol} to ${recipient.slice(0, 12)}... Tx: ${hash}`,
      };
    } catch (err) {
      throw new TransactionError(
        `Transfer failed: ${err instanceof Error ? err.message : String(err)}`,
        undefined,
        err,
      );
    }
  }

  /**
   * Transfer Aleo credits using credits.aleo/transfer_public.
   */
  async transferCredits(
    recipient: string,
    amount: number,
  ): Promise<TransactionResult> {
    if (amount <= 0) throw new ValidationError("Amount must be positive");

    const pm = this.createProgramManager();
    const microcredits = `${Math.floor(amount * 1_000_000)}u64`;

    try {
      const txHash = await pm.execute({
        programName: PROGRAMS.CREDITS,
        functionName: "transfer_public",
        inputs: [recipient, microcredits],
        priorityFee: this.config.defaultPriorityFee,
        privateFee: false,
      });

      const hash = typeof txHash === "string" ? txHash : String(txHash);
      return {
        txHash: hash,
        message: `Sent ${amount} ALEO to ${recipient.slice(0, 12)}...${recipient.slice(-6)}. Tx: ${hash}`,
      };
    } catch (err) {
      throw new TransactionError(
        `Credit transfer failed: ${err instanceof Error ? err.message : String(err)}`,
        undefined,
        err,
      );
    }
  }
}
