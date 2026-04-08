/**
 * Alert engine — checks price conditions every 60s.
 *
 * Supports:
 * - "if ALEO drops 15%, sell half"  → condition: drops_pct, action: sell_pct
 * - "if ALEO rises 20%, notify me"  → condition: rises_pct, action: notify
 * - "notify me when ALEO hits $1"   → condition: above, action: notify
 * - "alert if ALEO below $0.40"     → condition: below, action: notify
 */

import type { Bot } from "grammy";
import { getPrice } from "./prices.js";
import { getPriceChange } from "./indicators.js";
import {
  getActiveAlerts,
  triggerAlert,
  logDecision,
} from "../storage/db.js";
import { loadWallet } from "../aleo/wallet.js";
import { executeSwap } from "../aleo/trade.js";

let timer: ReturnType<typeof setInterval> | null = null;

export function startAlertEngine(bot: Bot): void {
  console.log("[alerts] Starting alert engine (60s interval)");

  timer = setInterval(async () => {
    try {
      await checkAlerts(bot);
    } catch (err) {
      console.error("[alerts] Engine error:", err);
    }
  }, 60_000);
}

export function stopAlertEngine(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

async function checkAlerts(bot: Bot): Promise<void> {
  const alerts = getActiveAlerts();
  if (alerts.length === 0) return;

  for (const alert of alerts) {
    try {
      const triggered = await evaluateCondition(alert.token, alert.condition, alert.threshold);
      if (!triggered) continue;

      console.log(`[alerts] #${alert.id} triggered: ${alert.condition} ${alert.threshold} on ${alert.token}`);
      triggerAlert(alert.id);

      const price = await getPrice(alert.token);

      if (alert.action_type === "notify") {
        // Notification only
        const msg =
          `Alert #${alert.id} triggered!\n` +
          `${alert.token} ${formatCondition(alert.condition, alert.threshold)}\n` +
          `Current price: $${price.toFixed(4)}`;

        logDecision(
          alert.telegram_id,
          null,
          "alert_notify",
          `${alert.token} $${price.toFixed(4)}`,
          `Alert condition met: ${alert.condition} ${alert.threshold}`,
          `Notified user`,
        );

        await notify(bot, alert.telegram_id, msg);
      } else if (alert.action_type === "sell_pct") {
        // Sell a percentage of holdings
        const params = alert.action_params ? JSON.parse(alert.action_params) as { percent: number } : { percent: 100 };
        const account = loadWallet(alert.telegram_id);
        if (!account) continue;

        // We don't know exact holdings without record scanning,
        // so use trade history to estimate
        const { getTradeHistory } = await import("../storage/db.js");
        const history = getTradeHistory(alert.telegram_id);
        const balances = new Map<string, number>();
        for (const t of history) {
          const cur = balances.get(t.token) ?? 0;
          balances.set(t.token, t.action === "buy" ? cur + t.amount : cur - t.amount);
        }

        const holding = balances.get(alert.token) ?? 0;
        if (holding <= 0) continue;

        const sellAmount = holding * (params.percent / 100);
        const result = await executeSwap(
          account,
          alert.telegram_id,
          "sell",
          alert.token,
          sellAmount,
          price,
        );

        logDecision(
          alert.telegram_id,
          null,
          `alert_sell_${params.percent}pct`,
          `${alert.token} $${price.toFixed(4)}`,
          `Alert #${alert.id} triggered (${alert.condition} ${alert.threshold}). Selling ${params.percent}% of ${alert.token}.`,
          result.message,
          result.txHash,
        );

        const msg =
          `Alert #${alert.id} EXECUTED\n` +
          `${alert.token} ${formatCondition(alert.condition, alert.threshold)}\n` +
          `Sold ${params.percent}% (${sellAmount.toFixed(2)} ${alert.token})\n\n` +
          result.message;

        await notify(bot, alert.telegram_id, msg);
      } else if (alert.action_type === "buy_amount") {
        const params = alert.action_params ? JSON.parse(alert.action_params) as { amount: number } : { amount: 0 };
        if (params.amount <= 0) continue;

        const account = loadWallet(alert.telegram_id);
        if (!account) continue;

        const result = await executeSwap(
          account,
          alert.telegram_id,
          "buy",
          alert.token,
          params.amount,
          price,
        );

        logDecision(
          alert.telegram_id,
          null,
          `alert_buy_${params.amount}`,
          `${alert.token} $${price.toFixed(4)}`,
          `Alert #${alert.id} triggered (${alert.condition} ${alert.threshold}). Buying ${params.amount} ${alert.token}.`,
          result.message,
          result.txHash,
        );

        const msg =
          `Alert #${alert.id} EXECUTED\n` +
          `${alert.token} ${formatCondition(alert.condition, alert.threshold)}\n` +
          `Bought ${params.amount} ${alert.token}\n\n` +
          result.message;

        await notify(bot, alert.telegram_id, msg);
      }
    } catch (err) {
      console.error(`[alerts] Error processing alert #${alert.id}:`, err);
    }
  }
}

async function evaluateCondition(
  token: string,
  condition: string,
  threshold: number,
): Promise<boolean> {
  const price = await getPrice(token);
  if (price === 0) return false;

  switch (condition) {
    case "above":
      return price >= threshold;

    case "below":
      return price <= threshold;

    case "drops_pct": {
      // Check if price dropped by threshold% from recent data
      const change = getPriceChange(token, 288); // ~24h
      if (!change) return false;
      return change.changePercent <= -threshold;
    }

    case "rises_pct": {
      const change = getPriceChange(token, 288);
      if (!change) return false;
      return change.changePercent >= threshold;
    }

    default:
      return false;
  }
}

function formatCondition(condition: string, threshold: number): string {
  switch (condition) {
    case "above": return `reached $${threshold}`;
    case "below": return `dropped below $${threshold}`;
    case "drops_pct": return `dropped ${threshold}%`;
    case "rises_pct": return `rose ${threshold}%`;
    default: return `${condition} ${threshold}`;
  }
}

async function notify(bot: Bot, telegramId: string, message: string): Promise<void> {
  try {
    // Try Telegram — works for numeric IDs
    const numId = Number(telegramId);
    if (!isNaN(numId)) {
      await bot.api.sendMessage(numId, message);
    }
  } catch {
    // User may have blocked the bot or it's a web/cli session
  }
}
