import type { Bot } from "grammy";
import { loadWallet } from "../aleo/wallet.js";
import { executeSwap } from "../aleo/trade.js";
import { getFollowersOf, incrementCopyCount } from "../storage/db.js";

let bot: Bot | null = null;

/** Store bot reference for notifications (called once at startup). */
export function setCopyBot(b: Bot): void {
  bot = b;
}

/**
 * Called after every successful trade. Checks if the leader has followers
 * and fires copy trades asynchronously.
 *
 * This is fire-and-forget — errors are logged but never propagate to the
 * leader's trade flow.
 */
export function onTradeExecuted(
  leaderId: string,
  action: "buy" | "sell",
  tokenSymbol: string,
  amount: number,
  price: number,
  txHash: string,
): void {
  // Fire-and-forget — don't await
  processCopyTrades(leaderId, action, tokenSymbol, amount, price, txHash).catch(
    (err) => console.error("[copy] processCopyTrades error:", err),
  );
}

/**
 * Tracks active leader chains to prevent circular copy loops.
 * e.g. A follows B, B follows A → A trades → B copies → B's trade would
 * trigger A again, but the set catches it.
 */
const activeLeaderChains = new Set<string>();

async function processCopyTrades(
  leaderId: string,
  action: "buy" | "sell",
  tokenSymbol: string,
  amount: number,
  price: number,
  _txHash: string,
): Promise<void> {
  // Circular chain guard
  if (activeLeaderChains.has(leaderId)) {
    console.log(`[copy] Circular chain detected for leader ${leaderId}, skipping`);
    return;
  }

  const followers = getFollowersOf(leaderId);
  if (followers.length === 0) return;

  console.log(`[copy] Leader ${leaderId} traded — notifying ${followers.length} follower(s)`);

  activeLeaderChains.add(leaderId);
  try {
    for (const strategy of followers) {
      try {
        const account = loadWallet(strategy.follower_id);
        if (!account) {
          console.warn(`[copy] Follower ${strategy.follower_id} has no wallet, skipping`);
          continue;
        }

        // Determine copy amount based on mode
        let copyAmount: number;
        if (strategy.mode === "fixed" && strategy.fixed_amount != null) {
          copyAmount = strategy.fixed_amount / price;
        } else {
          // proportional — mirror the same amount
          copyAmount = amount;
        }

        // Apply max_per_trade cap
        if (strategy.max_per_trade != null) {
          const maxTokens = strategy.max_per_trade / price;
          copyAmount = Math.min(copyAmount, maxTokens);
        }

        if (copyAmount <= 0) continue;

        console.log(
          `[copy] Executing copy trade for follower ${strategy.follower_id}: ` +
            `${action} ${copyAmount} ${tokenSymbol} @ $${price.toFixed(4)}`,
        );

        // executeSwap will call recordTrade internally, which will trigger
        // onTradeExecuted again — but activeLeaderChains guards against loops
        const result = await executeSwap(
          account,
          strategy.follower_id,
          action,
          tokenSymbol,
          copyAmount,
          price,
        );

        incrementCopyCount(strategy.id);

        // Notify follower
        await notifyFollower(
          strategy.follower_id,
          action,
          tokenSymbol,
          copyAmount,
          price,
          result.txHash,
        );
      } catch (err) {
        console.error(
          `[copy] Failed to copy trade for follower ${strategy.follower_id}:`,
          err,
        );
      }
    }
  } finally {
    activeLeaderChains.delete(leaderId);
  }
}

async function notifyFollower(
  followerId: string,
  action: "buy" | "sell",
  tokenSymbol: string,
  amount: number,
  price: number,
  txHash: string,
): Promise<void> {
  if (!bot) return;

  const total = amount * price;
  const message =
    `Copy trade executed:\n` +
    `${action.toUpperCase()} ${amount.toFixed(4)} ${tokenSymbol} @ $${price.toFixed(4)}\n` +
    `Total: $${total.toFixed(2)}\n` +
    `Tx: ${txHash}`;

  try {
    await bot.api.sendMessage(Number(followerId), message);
  } catch (err) {
    console.error(`[copy] Failed to notify follower ${followerId}:`, err);
  }
}

/**
 * Exposed for testing — check if a leader is in the active chain.
 */
export function isLeaderInChain(leaderId: string): boolean {
  return activeLeaderChains.has(leaderId);
}

/**
 * Exposed for testing — manually add/remove from the chain.
 */
export function addToChain(leaderId: string): void {
  activeLeaderChains.add(leaderId);
}

export function removeFromChain(leaderId: string): void {
  activeLeaderChains.delete(leaderId);
}
