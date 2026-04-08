import type { Account } from "@provablehq/sdk";
import type { ParsedIntent } from "./parser.js";
import { loadWallet } from "../aleo/wallet.js";
import { executeSwap, transferCredits } from "../aleo/trade.js";
import { createProgramManager, getNetworkClient } from "../aleo/client.js";
import { getPrice } from "../market/prices.js";
import { getMarketContext } from "../market/indicators.js";
import { getNetworkLabel } from "../aleo/network.js";
import { getAllTokens } from "../market/tokens.js";
import {
  getTradeHistory,
  createPendingOrder,
  createDcaStrategy,
  getUserDcaStrategies,
  createProtection,
  getUserProtections,
  createRebalanceStrategy,
  getUserRebalances,
  createAlert,
  getUserAlerts,
  logDecision,
  getDecisionHistory,
  getAllDecisions,
} from "../storage/db.js";

export interface ActionResult {
  message: string;
  needsConfirmation: boolean;
  confirmData?: string;
}

/**
 * Execute a parsed intent and return a user-facing response.
 */
export async function handleIntent(
  telegramId: string,
  intent: ParsedIntent,
): Promise<ActionResult> {
  if (!intent) {
    return {
      message:
        "I didn't understand that. Try:\n" +
        '• "buy 100 ALEO" / "sell 50 ALEO"\n' +
        '• "send 10 ALEO to aleo1..."\n' +
        '• "stack ALEO $50/week" / "protect at 20%"\n' +
        '• "if ALEO drops 15%, sell half"\n' +
        '• "market ALEO" — RSI, Bollinger Bands\n' +
        '• "why" — explain last decisions\n' +
        '• "export" — download trade history CSV\n' +
        '• "portfolio" / "status"',
      needsConfirmation: false,
    };
  }

  switch (intent.action) {
    case "buy":
    case "sell": {
      const price = await getPrice(intent.token);
      const total = intent.amount * price;
      const mktCtx = await getMarketContext(intent.token);

      // Log reasoning
      logDecision(
        telegramId,
        `${intent.action} ${intent.amount} ${intent.token}`,
        intent.action,
        mktCtx.summary,
        `User requested ${intent.action} ${intent.amount} ${intent.token} at $${price.toFixed(4)}. Awaiting confirmation.`,
        "pending_confirmation",
      );

      return {
        message:
          `${intent.action === "buy" ? "BUY" : "SELL"} ${intent.amount} ${intent.token}\n` +
          `Price: $${price.toFixed(4)}\n` +
          `Total: $${total.toFixed(2)}\n` +
          (mktCtx.rsi ? `RSI: ${mktCtx.rsi.value} (${mktCtx.rsi.signal})\n` : "") +
          `\nThis will execute a private swap on ${getNetworkLabel()}.\nConfirm?`,
        needsConfirmation: true,
        confirmData: JSON.stringify({
          type: "trade",
          action: intent.action,
          token: intent.token,
          amount: intent.amount,
          price,
        }),
      };
    }

    case "send": {
      return {
        message:
          `SEND ${intent.amount} ALEO\n` +
          `To: ${intent.recipient.slice(0, 12)}...${intent.recipient.slice(-6)}\n\n` +
          `This will transfer credits on ${getNetworkLabel()}.\nConfirm?`,
        needsConfirmation: true,
        confirmData: JSON.stringify({
          type: "send",
          amount: intent.amount,
          recipient: intent.recipient,
        }),
      };
    }

    case "portfolio": {
      const history = getTradeHistory(telegramId);
      if (history.length === 0) {
        return {
          message: "No trades yet. Send a buy or sell command to get started.",
          needsConfirmation: false,
        };
      }

      // Split into on-chain vs local trades
      const onChain = history.filter((t) => t.tx_hash && !t.tx_hash.startsWith("local_"));
      const local = history.filter((t) => !t.tx_hash || t.tx_hash.startsWith("local_"));

      // Aggregate confirmed on-chain holdings
      const confirmed = new Map<string, number>();
      for (const trade of onChain) {
        const current = confirmed.get(trade.token) ?? 0;
        if (trade.action === "buy") {
          confirmed.set(trade.token, current + trade.amount);
        } else {
          confirmed.set(trade.token, current - trade.amount);
        }
      }

      // Aggregate pending local holdings
      const pending = new Map<string, number>();
      for (const trade of local) {
        const current = pending.get(trade.token) ?? 0;
        if (trade.action === "buy") {
          pending.set(trade.token, current + trade.amount);
        } else {
          pending.set(trade.token, current - trade.amount);
        }
      }

      let msg = "Portfolio:\n\n";

      // On-chain confirmed
      let hasConfirmed = false;
      for (const [token, amount] of confirmed) {
        if (amount <= 0) continue;
        hasConfirmed = true;
        const price = await getPrice(token);
        const value = amount * price;
        msg += `${token}: ${amount} ($${value.toFixed(2)})\n`;
      }
      if (!hasConfirmed) msg += "(no confirmed on-chain holdings)\n";

      // Pending local
      let hasPending = false;
      for (const [token, amount] of pending) {
        if (amount <= 0) continue;
        if (!hasPending) msg += "\nPending (local only):\n";
        hasPending = true;
        const price = await getPrice(token);
        const value = amount * price;
        msg += `  ${token}: ${amount} ($${value.toFixed(2)})\n`;
      }

      msg += `\nLast ${Math.min(history.length, 5)} trades:\n`;
      for (const trade of history.slice(0, 5)) {
        const status = trade.tx_hash?.startsWith("local_") ? "local" : "on-chain";
        msg += `  ${trade.action.toUpperCase()} ${trade.amount} ${trade.token} @ $${trade.price?.toFixed(4) ?? "?"} [${status}] — ${trade.timestamp}\n`;
      }

      return { message: msg, needsConfirmation: false };
    }

    case "limit": {
      const orderId = createPendingOrder(
        telegramId,
        intent.side,
        intent.token,
        intent.amount,
        intent.targetPrice,
      );
      return {
        message:
          `Limit order #${orderId} created:\n` +
          `${intent.side.toUpperCase()} ${intent.amount} ${intent.token} @ $${intent.targetPrice}\n` +
          `I'll execute this when the price is reached.`,
        needsConfirmation: false,
      };
    }

    case "stack": {
      const dcaId = createDcaStrategy(
        telegramId,
        intent.token,
        intent.amount,
        intent.interval,
      );
      return {
        message:
          `DCA strategy #${dcaId} activated:\n` +
          `BUY $${intent.amount} of ${intent.token} ${intent.interval}\n` +
          `First buy will execute on the next cycle.`,
        needsConfirmation: false,
      };
    }

    case "protect": {
      // Calculate current portfolio value for high-water mark
      const history = getTradeHistory(telegramId);
      let totalValue = 0;
      const balances = new Map<string, number>();
      for (const t of history) {
        const cur = balances.get(t.token) ?? 0;
        balances.set(t.token, t.action === "buy" ? cur + t.amount : cur - t.amount);
      }
      for (const [token, amount] of balances) {
        if (amount <= 0) continue;
        const price = await getPrice(token);
        totalValue += amount * price;
      }

      const protId = createProtection(telegramId, intent.threshold, totalValue);
      return {
        message:
          `Protection #${protId} activated:\n` +
          `Auto-sell if portfolio drops ${intent.threshold}% from peak.\n` +
          `Current value: $${totalValue.toFixed(2)} (high-water mark set)`,
        needsConfirmation: false,
      };
    }

    case "status": {
      const dcas = getUserDcaStrategies(telegramId);
      const prots = getUserProtections(telegramId);
      const alerts = getUserAlerts(telegramId);

      let msg = "Active Strategies:\n\n";

      const rebals = getUserRebalances(telegramId);

      if (dcas.length === 0 && prots.length === 0 && rebals.length === 0 && alerts.length === 0) {
        msg += "No active strategies. Try:\n";
        msg += '• "stack ALEO $50/week" — recurring buys\n';
        msg += '• "protect at 20%" — stop-loss protection\n';
        msg += '• "if ALEO drops 15%, sell half" — price alerts\n';
        msg += '• "rebalance 60 ALEO 40 USDC" — auto-rebalance';
        return { message: msg, needsConfirmation: false };
      }

      if (dcas.length > 0) {
        msg += "DCA (Stack):\n";
        for (const d of dcas) {
          msg += `  #${d.id}: BUY $${d.amount} ${d.token} ${d.interval}`;
          if (d.last_executed) msg += ` (last: ${d.last_executed})`;
          msg += "\n";
        }
      }

      if (prots.length > 0) {
        msg += "\nProtection:\n";
        for (const p of prots) {
          msg += `  #${p.id}: Sell at ${p.threshold}% drawdown`;
          if (p.high_water_mark) msg += ` (peak: $${p.high_water_mark.toFixed(2)})`;
          msg += "\n";
        }
      }

      if (rebals.length > 0) {
        msg += "\nRebalance:\n";
        for (const r of rebals) {
          const alloc = JSON.parse(r.allocations) as Record<string, number>;
          const parts = Object.entries(alloc).map(([t, pct]) => `${pct}% ${t}`).join(" / ");
          msg += `  #${r.id}: ${parts} (drift > ${r.drift_threshold}%)`;
          if (r.last_rebalanced) msg += ` (last: ${r.last_rebalanced})`;
          msg += "\n";
        }
      }

      if (alerts.length > 0) {
        msg += "\nAlerts:\n";
        for (const a of alerts) {
          const condStr =
            a.condition === "above" ? `above $${a.threshold}` :
            a.condition === "below" ? `below $${a.threshold}` :
            a.condition === "drops_pct" ? `drops ${a.threshold}%` :
            `rises ${a.threshold}%`;
          const actionStr = a.action_type === "notify" ? "notify" :
            a.action_type === "sell_pct"
              ? `sell ${a.action_params ? JSON.parse(a.action_params).percent : 100}%`
              : a.action_type;
          msg += `  #${a.id}: ${a.token} ${condStr} → ${actionStr}\n`;
        }
      }

      return { message: msg, needsConfirmation: false };
    }

    case "rebalance": {
      const total = Object.values(intent.allocations).reduce((a, b) => a + b, 0);
      if (total !== 100) {
        return {
          message: `Allocations must add up to 100% (got ${total}%). Try: "rebalance 60 ALEO 40 USDC"`,
          needsConfirmation: false,
        };
      }

      const rebalId = createRebalanceStrategy(telegramId, intent.allocations);
      const parts = Object.entries(intent.allocations)
        .map(([t, pct]) => `${pct}% ${t}`)
        .join(" / ");
      return {
        message:
          `Rebalance #${rebalId} activated:\n` +
          `Target: ${parts}\n` +
          `Auto-rebalances when drift exceeds 5%.`,
        needsConfirmation: false,
      };
    }

    case "godark": {
      return {
        message:
          `Ghost mode activating...\n` +
          `Moving all public balances to private records.\n` +
          `This will execute credits.aleo/transfer_public_to_private.`,
        needsConfirmation: true,
        confirmData: JSON.stringify({ type: "godark" }),
      };
    }

    case "gopublic": {
      return {
        message:
          `Uncloaking...\n` +
          `Moving private records back to public balances.\n` +
          `This will make your balances visible on-chain.`,
        needsConfirmation: true,
        confirmData: JSON.stringify({ type: "gopublic" }),
      };
    }

    case "alert": {
      const actionType = intent.tradeAction ?? "notify";
      const actionParams = intent.tradeAction === "sell_pct"
        ? { percent: intent.tradeValue ?? 100 }
        : intent.tradeAction === "buy_amount"
          ? { amount: intent.tradeValue ?? 0 }
          : undefined;

      const alertId = createAlert(
        telegramId,
        intent.token,
        intent.condition,
        intent.threshold,
        actionType,
        actionParams,
      );

      const condStr =
        intent.condition === "above" ? `reaches $${intent.threshold}` :
        intent.condition === "below" ? `drops below $${intent.threshold}` :
        intent.condition === "drops_pct" ? `drops ${intent.threshold}%` :
        `rises ${intent.threshold}%`;

      const actionStr = actionType === "notify"
        ? "I'll notify you"
        : actionType === "sell_pct"
          ? `I'll sell ${actionParams?.percent ?? 100}% of your ${intent.token}`
          : `I'll buy ${actionParams?.amount ?? 0} ${intent.token}`;

      logDecision(
        telegramId,
        `alert ${intent.token} ${intent.condition} ${intent.threshold}`,
        "create_alert",
        null,
        `User set alert: ${intent.token} ${condStr}. Action: ${actionStr}.`,
        `Alert #${alertId} created`,
      );

      return {
        message:
          `Alert #${alertId} set:\n` +
          `When ${intent.token} ${condStr}, ${actionStr}.\n` +
          `Checking every 60 seconds.`,
        needsConfirmation: false,
      };
    }

    case "why": {
      const decisions = getDecisionHistory(telegramId, 5);
      if (decisions.length === 0) {
        return {
          message: "No decisions recorded yet. Trade or set up strategies to build a history.",
          needsConfirmation: false,
        };
      }

      let msg = "Recent decisions:\n\n";
      for (const d of decisions) {
        msg += `[${d.timestamp}] ${d.parsed_action}\n`;
        if (d.market_context) msg += `  Market: ${d.market_context}\n`;
        msg += `  Reasoning: ${d.reasoning}\n`;
        msg += `  Result: ${d.decision}\n\n`;
      }

      return { message: msg, needsConfirmation: false };
    }

    case "export": {
      const decisions = getAllDecisions(telegramId);
      const trades = getTradeHistory(telegramId);

      if (decisions.length === 0 && trades.length === 0) {
        return {
          message: "No history to export yet.",
          needsConfirmation: false,
        };
      }

      let csv = "timestamp,type,action,token,amount,price,tx_hash,reasoning\n";

      for (const t of trades) {
        csv += `${t.timestamp},trade,${t.action},${t.token},${t.amount},${t.price ?? ""},${t.tx_hash ?? ""},\n`;
      }

      for (const d of decisions) {
        const reason = d.reasoning.replace(/"/g, '""');
        csv += `${d.timestamp},decision,${d.parsed_action},,,,,"${reason}"\n`;
      }

      return {
        message:
          `Export (${trades.length} trades, ${decisions.length} decisions):\n\n` +
          "```\n" + csv + "```\n\n" +
          "Copy the CSV above or save it to a file.",
        needsConfirmation: false,
      };
    }

    case "market": {
      const ctx = await getMarketContext(intent.token);

      let msg = `Market: ${ctx.token} — $${ctx.price.toFixed(4)}\n\n`;

      if (ctx.rsi) {
        msg += `RSI(${ctx.rsi.periods}): ${ctx.rsi.value}`;
        if (ctx.rsi.signal === "oversold") msg += " — Oversold (potential buy signal)";
        else if (ctx.rsi.signal === "overbought") msg += " — Overbought (potential sell signal)";
        msg += "\n";
      } else {
        msg += "RSI: Building data (need ~15 price points)\n";
      }

      if (ctx.bollinger) {
        msg += `\nBollinger Bands(${ctx.bollinger.periods}):\n`;
        msg += `  Upper:  $${ctx.bollinger.upper}\n`;
        msg += `  Middle: $${ctx.bollinger.middle} (SMA)\n`;
        msg += `  Lower:  $${ctx.bollinger.lower}\n`;
        msg += `  Position: ${ctx.bollinger.position.replace(/_/g, " ")}\n`;
        msg += `  Volatility: ${(ctx.bollinger.bandwidth * 100).toFixed(2)}%\n`;
      } else {
        msg += "\nBollinger Bands: Building data (need ~20 price points)\n";
      }

      if (ctx.change1h) {
        const dir = ctx.change1h.changePercent >= 0 ? "+" : "";
        msg += `\n1h: ${dir}${ctx.change1h.changePercent}% ($${ctx.change1h.previous} → $${ctx.change1h.current})\n`;
      }

      if (ctx.change24h) {
        const dir = ctx.change24h.changePercent >= 0 ? "+" : "";
        msg += `24h: ${dir}${ctx.change24h.changePercent}% ($${ctx.change24h.previous} → $${ctx.change24h.current})\n`;
      }

      return { message: msg, needsConfirmation: false };
    }

    case "tokens": {
      const tokens = getAllTokens();
      let msg = "Available tokens:\n\n";
      for (const t of tokens) {
        const price = await getPrice(t.symbol);
        const tag = t.isStablecoin ? " (stablecoin)" : "";
        msg += `  ${t.symbol}: $${price.toFixed(4)}${tag}\n`;
      }
      msg += `\n${tokens.length} tokens supported. Use "buy <amount> <TOKEN>" to trade.`;
      return { message: msg, needsConfirmation: false };
    }
  }
}

/**
 * Execute a confirmed action (trade or send).
 */
export async function executeConfirmedTrade(
  telegramId: string,
  confirmData: string,
): Promise<string> {
  const data = JSON.parse(confirmData) as Record<string, unknown>;

  const account = loadWallet(telegramId);
  if (!account) {
    return "Wallet not found. Use /start to create one.";
  }

  if (data.type === "send") {
    const result = await transferCredits(
      account,
      data.recipient as string,
      data.amount as number,
    );
    return result.message;
  }

  if (data.type === "godark") {
    return goDark(account);
  }

  if (data.type === "gopublic") {
    return goPublic(account);
  }

  // Default: trade
  const result = await executeSwap(
    account,
    telegramId,
    data.action as "buy" | "sell",
    data.token as string,
    data.amount as number,
    data.price as number,
  );

  // Log the executed decision
  const mktCtx = await getMarketContext(data.token as string);
  logDecision(
    telegramId,
    null,
    `${data.action}_confirmed`,
    mktCtx.summary,
    `User confirmed ${data.action} ${data.amount} ${data.token} at $${(data.price as number).toFixed(4)}. Executed on Aleo.`,
    result.message,
    result.txHash,
  );

  return result.message;
}

/**
 * Go dark — move public credits to private records.
 * Uses credits.aleo/transfer_public_to_private.
 */
async function goDark(account: Account): Promise<string> {
  const address = account.address().to_string();
  const net = getNetworkClient();

  try {
    // Check public balance
    const balanceStr = await net.getProgramMappingValue(
      "credits.aleo",
      "account",
      address,
    );
    if (!balanceStr) return "No public balance to move.";

    const balance = parseInt(String(balanceStr).replace("u64", ""), 10);
    // Keep 100k microcredits for gas
    const toMove = balance - 100_000;
    if (toMove <= 0) return "Balance too low to go dark (need to keep gas reserve).";

    const pm = createProgramManager(account);
    console.log(`[godark] Moving ${toMove} microcredits to private`);

    const txHash = await pm.execute({
      programName: "credits.aleo",
      functionName: "transfer_public_to_private",
      inputs: [address, `${toMove}u64`],
      priorityFee: 0.01,
      privateFee: false,
    });

    const hash = typeof txHash === "string" ? txHash : String(txHash);
    const aleoAmount = (toMove / 1_000_000).toFixed(4);
    return (
      `Ghost mode activated.\n` +
      `Moved ${aleoAmount} ALEO to private records.\n` +
      `Your balance is now invisible on-chain.\n` +
      `Tx: ${hash}`
    );
  } catch (err) {
    return `Ghost mode failed: ${err instanceof Error ? err.message : String(err)}`;
  }
}

/**
 * Go public — move private credits back to public.
 * Uses credits.aleo/transfer_private_to_public.
 * Note: requires scanning for private records (limited without indexer).
 */
async function goPublic(_account: Account): Promise<string> {
  // Private record scanning requires an indexer or view key scan.
  // For now, inform the user this is a future feature.
  return (
    "Go public requires scanning your private records.\n" +
    "This needs a record indexer (Wave 4 feature).\n" +
    "Your private records are still safe and spendable."
  );
}
