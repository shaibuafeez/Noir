import { getPendingOrders, updateOrderStatus } from "../storage/db.js";
import { getPrice } from "./prices.js";
import { executeConfirmedTrade } from "../agent/actions.js";
import type { Bot } from "grammy";

const CHECK_INTERVAL_MS = 60_000;

let intervalHandle: ReturnType<typeof setInterval> | null = null;

/**
 * Start the limit-order check loop.
 * Checks all pending orders every 60 seconds.
 */
export function startLimitOrderEngine(bot: Bot): void {
  if (intervalHandle) return;

  console.log("[limits] Starting limit order engine (60s interval)");

  intervalHandle = setInterval(async () => {
    try {
      await checkLimitOrders(bot);
    } catch (err) {
      console.error("[limits] Error checking orders:", err);
    }
  }, CHECK_INTERVAL_MS);
}

export function stopLimitOrderEngine(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

async function checkLimitOrders(bot: Bot): Promise<void> {
  const orders = getPendingOrders();
  if (orders.length === 0) return;

  for (const order of orders) {
    const currentPrice = await getPrice(order.token);
    if (currentPrice <= 0) continue;

    let shouldExecute = false;

    if (order.side === "buy" && currentPrice <= order.target_price) {
      shouldExecute = true;
    } else if (order.side === "sell" && currentPrice >= order.target_price) {
      shouldExecute = true;
    }

    if (!shouldExecute) continue;

    console.log(
      `[limits] Triggering order #${order.id}: ${order.side} ${order.amount} ${order.token} @ $${currentPrice}`,
    );

    const confirmData = JSON.stringify({
      action: order.side,
      token: order.token,
      amount: order.amount,
      price: currentPrice,
    });

    const result = await executeConfirmedTrade(order.telegram_id, confirmData);
    updateOrderStatus(order.id, "executed");

    // Notify user
    try {
      await bot.api.sendMessage(
        Number(order.telegram_id),
        `Limit order #${order.id} executed!\n\n${result}`,
      );
    } catch (err) {
      console.error(`[limits] Failed to notify user ${order.telegram_id}:`, err);
    }
  }
}
