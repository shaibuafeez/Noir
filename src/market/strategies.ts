import type { Bot } from "grammy";
import { getPrice } from "./prices.js";
import { loadWallet } from "../aleo/wallet.js";
import { executeSwap } from "../aleo/trade.js";
import {
  getActiveDcaStrategies,
  updateDcaLastExecuted,
  getActiveProtections,
  updateHighWaterMark,
  triggerProtection,
  getActiveRebalances,
  updateRebalanceLastRun,
  getTradeHistory,
} from "../storage/db.js";

const INTERVAL_MS: Record<string, number> = {
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

let timer: ReturnType<typeof setInterval> | null = null;

export function startStrategyEngine(bot: Bot): void {
  console.log("[strategies] Starting strategy engine (60s interval)");

  timer = setInterval(async () => {
    try {
      await runDcaStrategies(bot);
      await runProtectionStrategies(bot);
      await runRebalanceStrategies(bot);
    } catch (err) {
      console.error("[strategies] Engine error:", err);
    }
  }, 60_000);
}

export function stopStrategyEngine(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

async function runDcaStrategies(bot: Bot): Promise<void> {
  const strategies = getActiveDcaStrategies();
  const now = Date.now();

  for (const s of strategies) {
    const intervalMs = INTERVAL_MS[s.interval] ?? INTERVAL_MS.daily!;
    const lastRun = s.last_executed ? new Date(s.last_executed + "Z").getTime() : 0;

    // Add ±20% jitter to prevent timing correlation
    const jitter = intervalMs * 0.2 * (Math.random() - 0.5);
    if (now - lastRun < intervalMs + jitter) continue;

    // Time to execute
    const price = await getPrice(s.token);
    const amount = s.amount / price; // Convert $ amount to token amount

    const account = loadWallet(s.telegram_id);
    if (!account) continue;

    console.log(`[dca] Executing DCA #${s.id}: $${s.amount} of ${s.token}`);

    const result = await executeSwap(
      account,
      s.telegram_id,
      "buy",
      s.token,
      amount,
      price,
    );

    updateDcaLastExecuted(s.id);

    // Notify user
    try {
      await bot.api.sendMessage(
        Number(s.telegram_id),
        `DCA #${s.id} executed:\n${result.message}`,
      );
    } catch {
      // User may have blocked the bot
    }
  }
}

async function runProtectionStrategies(bot: Bot): Promise<void> {
  const protections = getActiveProtections();

  for (const p of protections) {
    // Calculate current portfolio value
    const history = getTradeHistory(p.telegram_id);
    const balances = new Map<string, number>();
    for (const t of history) {
      const cur = balances.get(t.token) ?? 0;
      balances.set(t.token, t.action === "buy" ? cur + t.amount : cur - t.amount);
    }

    let currentValue = 0;
    for (const [token, amount] of balances) {
      if (amount <= 0) continue;
      const price = await getPrice(token);
      currentValue += amount * price;
    }

    if (currentValue === 0) continue;

    // Update high-water mark if new peak
    const hwm = p.high_water_mark ?? currentValue;
    if (currentValue > hwm) {
      updateHighWaterMark(p.id, currentValue);
      continue;
    }

    // Check drawdown
    const drawdown = ((hwm - currentValue) / hwm) * 100;
    if (drawdown < p.threshold) continue;

    // Threshold breached — trigger protection
    console.log(`[protect] #${p.id} triggered: ${drawdown.toFixed(1)}% drawdown`);
    triggerProtection(p.id);

    // Execute sell for all holdings
    const account = loadWallet(p.telegram_id);
    if (!account) continue;

    const sells: string[] = [];
    for (const [token, amount] of balances) {
      if (amount <= 0) continue;
      const price = await getPrice(token);
      const result = await executeSwap(
        account,
        p.telegram_id,
        "sell",
        token,
        amount,
        price,
      );
      sells.push(result.message);
    }

    try {
      await bot.api.sendMessage(
        Number(p.telegram_id),
        `Protection #${p.id} TRIGGERED\n` +
        `Drawdown: ${drawdown.toFixed(1)}% (threshold: ${p.threshold}%)\n` +
        `Peak: $${hwm.toFixed(2)} → Now: $${currentValue.toFixed(2)}\n\n` +
        sells.join("\n"),
      );
    } catch {
      // User may have blocked the bot
    }
  }
}

async function runRebalanceStrategies(bot: Bot): Promise<void> {
  const strategies = getActiveRebalances();

  for (const s of strategies) {
    // Only rebalance once per hour
    const lastRun = s.last_rebalanced ? new Date(s.last_rebalanced + "Z").getTime() : 0;
    if (Date.now() - lastRun < 60 * 60 * 1000) continue;

    const targetAlloc = JSON.parse(s.allocations) as Record<string, number>;

    // Calculate current portfolio
    const history = getTradeHistory(s.telegram_id);
    const balances = new Map<string, number>();
    for (const t of history) {
      const cur = balances.get(t.token) ?? 0;
      balances.set(t.token, t.action === "buy" ? cur + t.amount : cur - t.amount);
    }

    // Calculate current values
    let totalValue = 0;
    const tokenValues = new Map<string, number>();
    for (const [token, amount] of balances) {
      if (amount <= 0) continue;
      const price = await getPrice(token);
      const value = amount * price;
      tokenValues.set(token, value);
      totalValue += value;
    }

    if (totalValue === 0) continue;

    // Check drift for each target token
    let maxDrift = 0;
    const swaps: Array<{ token: string; side: "buy" | "sell"; amount: number }> = [];

    for (const [token, targetPct] of Object.entries(targetAlloc)) {
      const currentValue = tokenValues.get(token) ?? 0;
      const currentPct = (currentValue / totalValue) * 100;
      const drift = Math.abs(currentPct - targetPct);
      if (drift > maxDrift) maxDrift = drift;

      if (drift > s.drift_threshold) {
        const targetValue = (targetPct / 100) * totalValue;
        const diff = targetValue - currentValue;
        const price = await getPrice(token);
        if (price === 0) continue;

        if (diff > 0) {
          swaps.push({ token, side: "buy", amount: diff / price });
        } else {
          swaps.push({ token, side: "sell", amount: Math.abs(diff) / price });
        }
      }
    }

    if (maxDrift <= s.drift_threshold) continue;

    // Execute rebalance swaps
    console.log(`[rebalance] #${s.id} drift ${maxDrift.toFixed(1)}% > ${s.drift_threshold}%`);

    const account = loadWallet(s.telegram_id);
    if (!account) continue;

    const results: string[] = [];
    for (const swap of swaps) {
      const price = await getPrice(swap.token);
      const result = await executeSwap(
        account,
        s.telegram_id,
        swap.side,
        swap.token,
        swap.amount,
        price,
      );
      results.push(result.message);
    }

    updateRebalanceLastRun(s.id);

    try {
      const allocStr = Object.entries(targetAlloc)
        .map(([t, pct]) => `${pct}% ${t}`)
        .join(" / ");
      await bot.api.sendMessage(
        Number(s.telegram_id),
        `Rebalance #${s.id} executed (drift was ${maxDrift.toFixed(1)}%)\n` +
        `Target: ${allocStr}\n\n` +
        results.join("\n"),
      );
    } catch {
      // User may have blocked the bot
    }
  }
}
