import { Account } from "@provablehq/sdk";
import { createProgramManager } from "./client.js";
import { getNetworkConfig, getNetworkLabel } from "./network.js";
import { tokenToField } from "../market/tokens.js";
import { recordTrade } from "../storage/db.js";
import { onTradeExecuted } from "../market/copy.js";

const PROGRAM_ID = "ghost_trade_v2.aleo";
const CREDITS_PROGRAM = "credits.aleo";

// Re-export tokenToField for backwards compatibility
export { tokenToField } from "../market/tokens.js";

/**
 * Execute a trade on-chain.
 *
 * BUY  → calls create_holding to mint a private Holding record for the token.
 * SELL → calls swap to exchange token holding for USDT holding + receipt.
 *        The swap transition consumes the Holding record and produces:
 *        1. Leftover Holding (remaining token balance)
 *        2. Acquired Holding (USDT received)
 *        3. Receipt (private proof of the trade)
 */
export async function executeSwap(
  account: Account,
  telegramId: string,
  action: "buy" | "sell",
  tokenSymbol: string,
  amount: number,
  price: number,
): Promise<{ txHash: string; message: string }> {
  const config = getNetworkConfig();
  const pm = createProgramManager(account);
  const tokenField = tokenToField(tokenSymbol);

  if (action === "sell") {
    // SELL → call swap transition on ghost_trade.aleo
    // Swaps token → USDT at the given price (basis points)
    const amountU64 = `${Math.floor(amount)}u64`;
    const usdtField = tokenToField("USDT");
    // Price in basis points: e.g. $0.50 = 5000 basis points
    const priceBps = `${Math.floor(price * 10000)}u64`;
    const timestamp = `${Math.floor(Date.now() / 1000)}u64`;

    try {
      console.log("[trade] Executing on-chain SELL (swap):", {
        programName: PROGRAM_ID,
        functionName: "swap",
        inputs: [tokenField, usdtField, amountU64, priceBps, timestamp],
      });

      const txHash = await pm.execute({
        programName: PROGRAM_ID,
        functionName: "swap",
        inputs: [tokenField, usdtField, amountU64, priceBps, timestamp],
        priorityFee: config.defaultPriorityFee,
        privateFee: false,
      });

      const hash = typeof txHash === "string" ? txHash : String(txHash);
      console.log("[trade] SELL SUCCESS — tx:", hash);
      recordTrade(telegramId, action, tokenSymbol, amount, price, hash);
      onTradeExecuted(telegramId, action, tokenSymbol, amount, price, hash);

      return {
        txHash: hash,
        message:
          `SELL ${amount} ${tokenSymbol} @ $${price.toFixed(4)}\n` +
          `Private swap executed on ${getNetworkLabel()}.\n` +
          `Receipt record created as proof of trade.\n` +
          `Tx: ${hash}`,
      };
    } catch (err) {
      console.error("[trade] SELL FAILED:", err);
      // Fallback: record locally with create_holding for the output token
      // so the trade is at least tracked
      const fallbackHash = `local_${Date.now().toString(36)}`;
      recordTrade(telegramId, action, tokenSymbol, amount, price, fallbackHash);
      onTradeExecuted(telegramId, action, tokenSymbol, amount, price, fallbackHash);

      return {
        txHash: fallbackHash,
        message:
          `SELL ${amount} ${tokenSymbol} @ $${price.toFixed(4)}\n` +
          `(Recorded locally — on-chain swap requires existing Holding record)\n` +
          `Reason: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  // BUY → create a private Holding record on-chain
  const amountU64 = `${Math.floor(amount)}u64`;

  try {
    console.log("[trade] Executing on-chain BUY:", {
      programName: PROGRAM_ID,
      functionName: "create_holding",
      inputs: [tokenField, amountU64],
    });
    console.log("[trade] Account address:", account.address().to_string());
    const txHash = await pm.execute({
      programName: PROGRAM_ID,
      functionName: "create_holding",
      inputs: [tokenField, amountU64],
      priorityFee: config.defaultPriorityFee,
      privateFee: false,
    });

    const hash = typeof txHash === "string" ? txHash : String(txHash);
    console.log("[trade] BUY SUCCESS — tx:", hash);
    recordTrade(telegramId, action, tokenSymbol, amount, price, hash);
    onTradeExecuted(telegramId, action, tokenSymbol, amount, price, hash);

    return {
      txHash: hash,
      message:
        `BUY ${amount} ${tokenSymbol} @ $${price.toFixed(4)}\n` +
        `Private Holding record created on ${getNetworkLabel()}.\n` +
        `Tx: ${hash}`,
    };
  } catch (err) {
    console.error("[trade] BUY FAILED:", err);
    const fallbackHash = `local_${Date.now().toString(36)}`;
    recordTrade(telegramId, action, tokenSymbol, amount, price, fallbackHash);
    onTradeExecuted(telegramId, action, tokenSymbol, amount, price, fallbackHash);

    return {
      txHash: fallbackHash,
      message:
        `BUY ${amount} ${tokenSymbol} @ $${price.toFixed(4)}\n` +
        `(Recorded locally — on-chain execution pending)\n` +
        `Reason: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Transfer Aleo credits using credits.aleo/transfer_public.
 * Uses transfer_public since we don't have private record scanning yet.
 */
export async function transferCredits(
  account: Account,
  recipient: string,
  amount: number,
): Promise<{ txHash: string; message: string }> {
  const config = getNetworkConfig();
  const pm = createProgramManager(account);
  const microcredits = `${Math.floor(amount * 1_000_000)}u64`;

  try {
    console.log("[transfer] Sending", amount, "credits to", recipient);
    const txHash = await pm.execute({
      programName: CREDITS_PROGRAM,
      functionName: "transfer_public",
      inputs: [recipient, microcredits],
      priorityFee: config.defaultPriorityFee,
      privateFee: false,
    });

    const hash = typeof txHash === "string" ? txHash : String(txHash);
    console.log("[transfer] SUCCESS — tx:", hash);

    return {
      txHash: hash,
      message:
        `Sent ${amount} ALEO to ${recipient.slice(0, 12)}...${recipient.slice(-6)}\n` +
        `Tx: ${hash}`,
    };
  } catch (err) {
    console.error("[transfer] FAILED:", err);
    return {
      txHash: "",
      message: `Transfer failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
