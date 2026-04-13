/**
 * REST endpoints for the web dashboard. Pulls real state from SQLite and the
 * market modules — no mock data.
 *
 * Conventions:
 *   - Session is identified via `?sessionId=web_xxx` (matches the WS session).
 *   - All endpoints return JSON with `{ ok: true, data }` or `{ ok: false, error }`.
 *   - Empty results are empty arrays, never placeholders.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import {
  getUser,
  getTradeHistory,
  getUserDcaStrategies,
  getUserProtections,
  getUserRebalances,
  getUserAlerts,
  getUserCopyStrategies,
  getUserPendingOrders,
  getDecisionHistory,
  getPriceHistory,
  type TradeHistoryRow,
} from "../storage/db.js";
import {
  createLaunch,
  buyLaunchToken,
  sellLaunchToken,
  listLaunches,
  getLaunchDetail,
  getLaunchpadStats,
} from "../launchpad/engine.js";
import {
  createSessionWallet,
  getSessionWalletInfo,
  getSessionWallet,
  deactivateSessionWallet,
} from "../aleo/session-wallet.js";
import { createProgramManager } from "../aleo/client.js";
import { getPrice } from "../market/prices.js";
import {
  calculateRSI,
  calculateBollinger,
  getPriceChange,
} from "../market/indicators.js";
import { getAllTokens, getTradableTokens } from "../market/tokens.js";

/** Read JSON request body. */
async function readBody<T = unknown>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8")) as T);
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

/** Write a JSON response with no-cache headers. */
function json(
  res: ServerResponse,
  status: number,
  body: unknown,
): void {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}

function ok(res: ServerResponse, data: unknown): void {
  json(res, 200, { ok: true, data });
}

function err(res: ServerResponse, status: number, message: string): void {
  json(res, status, { ok: false, error: message });
}

/** Extract sessionId from ?sessionId=... query param. */
function getSessionId(url: URL): string | null {
  const id = url.searchParams.get("sessionId");
  return id && id.trim() ? id.trim() : null;
}

/**
 * Derive holdings from trade history: sum of (buy − sell) per token,
 * multiplied by current price. Not perfect (misses pre-existing holdings or
 * direct transfers) but 100% real — no fabricated data.
 */
async function computeHoldings(trades: TradeHistoryRow[]): Promise<
  {
    token: string;
    amount: number;
    price: number;
    value: number;
    change24h: number;
  }[]
> {
  const positions = new Map<string, number>();
  for (const t of trades) {
    const current = positions.get(t.token) ?? 0;
    const delta = t.action === "buy" ? t.amount : -t.amount;
    positions.set(t.token, current + delta);
  }

  const rows: {
    token: string;
    amount: number;
    price: number;
    value: number;
    change24h: number;
  }[] = [];

  for (const [token, amount] of positions.entries()) {
    if (amount <= 0.00001) continue; // drop dust / fully-exited positions
    const price = await getPrice(token);
    const change = getPriceChange(token, 288); // 288 × 5min ≈ 24h
    rows.push({
      token,
      amount,
      price,
      value: amount * price,
      change24h: change?.changePercent ?? 0,
    });
  }

  // Sort by value descending
  rows.sort((a, b) => b.value - a.value);
  return rows;
}

/**
 * Build a 30-point portfolio value history from the raw trade log.
 * Each point is the cumulative holdings × price-at-that-point (approximated
 * with the closest price_history row).
 */
function buildPortfolioSeries(
  trades: TradeHistoryRow[],
): { label: string; value: number }[] {
  if (trades.length === 0) return [];

  // Chronological order
  const sorted = [...trades].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const positions = new Map<string, number>();
  const series: { label: string; value: number }[] = [];

  for (const t of sorted) {
    const current = positions.get(t.token) ?? 0;
    positions.set(t.token, current + (t.action === "buy" ? t.amount : -t.amount));

    // Compute snapshot value using the trade's own price where available
    let value = 0;
    for (const [tok, amt] of positions.entries()) {
      if (amt <= 0) continue;
      if (tok === t.token && t.price) {
        value += amt * t.price;
      } else {
        // Fallback: latest recorded price for other tokens
        const hist = getPriceHistory(tok, 1);
        value += amt * (hist[0]?.price ?? 0);
      }
    }

    const d = new Date(t.timestamp);
    series.push({
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: Math.round(value),
    });
  }

  return series;
}

/**
 * Main entry: route an incoming request to the right REST handler.
 * Returns true if handled, false if the path doesn't match /api.
 */
export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (!url.pathname.startsWith("/api/")) return false;

  // All methods allowed for preflight simplicity
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return true;
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    switch (url.pathname) {
      case "/api/session": {
        const sessionId = getSessionId(url);
        if (!sessionId) return err(res, 400, "sessionId required"), true;
        const user = getUser(sessionId);
        return (
          ok(res, {
            sessionId,
            walletAddress: user?.aleo_address ?? null,
            hasWallet: Boolean(user),
          }),
          true
        );
      }

      case "/api/holdings": {
        const sessionId = getSessionId(url);
        if (!sessionId) return err(res, 400, "sessionId required"), true;
        const trades = getTradeHistory(sessionId);
        const holdings = await computeHoldings(trades);
        const totalValue = holdings.reduce((s, h) => s + h.value, 0);
        const change24h =
          totalValue > 0
            ? holdings.reduce(
                (s, h) => s + h.value * (h.change24h / 100),
                0,
              ) / totalValue
            : 0;
        const portfolioSeries = buildPortfolioSeries(trades);
        return (
          ok(res, {
            totalValue,
            change24h: change24h * 100, // as percentage
            holdings,
            portfolioSeries,
          }),
          true
        );
      }

      case "/api/trades": {
        const sessionId = getSessionId(url);
        if (!sessionId) return err(res, 400, "sessionId required"), true;
        const rows = getTradeHistory(sessionId);
        return ok(res, rows), true;
      }

      case "/api/strategies": {
        const sessionId = getSessionId(url);
        if (!sessionId) return err(res, 400, "sessionId required"), true;
        const dca = getUserDcaStrategies(sessionId);
        const limits = getUserPendingOrders(sessionId);
        const alerts = getUserAlerts(sessionId);
        const protection = getUserProtections(sessionId);
        const rebalance = getUserRebalances(sessionId).map((r) => ({
          ...r,
          allocations: safeParseJson(r.allocations),
        }));
        const copy = getUserCopyStrategies(sessionId);
        return (
          ok(res, {
            dca,
            limits,
            alerts,
            protection,
            rebalance,
            copy,
            totalActive:
              dca.length +
              limits.length +
              alerts.length +
              protection.length +
              rebalance.length +
              copy.length,
          }),
          true
        );
      }

      case "/api/decisions": {
        const sessionId = getSessionId(url);
        if (!sessionId) return err(res, 400, "sessionId required"), true;
        const rows = getDecisionHistory(sessionId, 50);
        return ok(res, rows), true;
      }

      case "/api/market": {
        const tokens = getAllTokens();
        const out: unknown[] = [];
        for (const t of tokens) {
          const price = await getPrice(t.symbol);
          const rsi = calculateRSI(t.symbol);
          const bollinger = calculateBollinger(t.symbol);
          const change24h = getPriceChange(t.symbol, 288);
          const change1h = getPriceChange(t.symbol, 12);
          out.push({
            symbol: t.symbol,
            name: t.symbol, // no full-name registry yet — use symbol
            price,
            change24h: change24h?.changePercent ?? 0,
            change1h: change1h?.changePercent ?? 0,
            rsi: rsi?.value ?? null,
            rsiSignal: rsi?.signal ?? null,
            bollingerPosition: bollinger?.position ?? null,
            isStablecoin: t.isStablecoin,
          });
        }
        return ok(res, out), true;
      }

      case "/api/market/history": {
        const token = url.searchParams.get("token");
        if (!token) return err(res, 400, "token required"), true;
        const limitParam = url.searchParams.get("limit");
        const limit = limitParam ? parseInt(limitParam, 10) : 48;
        const rows = getPriceHistory(token, limit);
        // Reverse to chronological order
        const series = [...rows]
          .reverse()
          .map((r) => ({
            label: new Date(r.timestamp).toLocaleTimeString("en-US", {
              hour: "2-digit",
            }),
            value: r.price,
          }));
        return ok(res, series), true;
      }

      case "/api/balance": {
        const sessionId = getSessionId(url);
        if (!sessionId) return err(res, 400, "sessionId required"), true;
        const user = getUser(sessionId);
        if (!user) return ok(res, { address: null, balanceCredits: 0 }), true;
        const network = process.env.ALEO_NETWORK || "testnet";
        const explorerBase = `https://api.explorer.provable.com/v1/${network}`;
        try {
          const resp = await fetch(
            `${explorerBase}/program/credits.aleo/mapping/account/${user.aleo_address}`,
          );
          if (!resp.ok) {
            return ok(res, { address: user.aleo_address, balanceCredits: 0 }), true;
          }
          const raw = await resp.text();
          // Response is like "1000000u64" — strip quotes, parseInt stops at 'u'
          const microcredits = parseInt(raw.replace(/"/g, "").trim(), 10) || 0;
          const credits = microcredits / 1_000_000;
          return ok(res, { address: user.aleo_address, balanceCredits: credits }), true;
        } catch {
          return ok(res, { address: user.aleo_address, balanceCredits: 0 }), true;
        }
      }

      case "/api/tokens": {
        return ok(res, getTradableTokens()), true;
      }

      case "/api/gemini/config": {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return err(res, 503, "Gemini API key not configured"), true;
        return ok(res, {
          apiKey,
          voiceModel: "gemini-2.0-flash-live-001",
          textModel: "gemini-2.0-flash",
        }), true;
      }

      // ── Session wallet endpoints ──

      case "/api/session-wallet": {
        const sessionId = getSessionId(url);
        if (!sessionId) return err(res, 400, "sessionId required"), true;

        if (req.method === "POST") {
          const body = await readBody<{ shieldAddress?: string }>(req);
          if (!body.shieldAddress) return err(res, 400, "shieldAddress required"), true;
          const { sessionAddress } = createSessionWallet(sessionId, body.shieldAddress);
          return ok(res, { sessionAddress }), true;
        }

        // GET
        const info = getSessionWalletInfo(sessionId);
        if (!info) return ok(res, { active: false }), true;
        return ok(res, info), true;
      }

      case "/api/session-wallet/reclaim": {
        if (req.method !== "POST") return err(res, 405, "POST only"), true;
        const sessionId = getSessionId(url);
        if (!sessionId) return err(res, 400, "sessionId required"), true;

        const info = getSessionWalletInfo(sessionId);
        if (!info || !info.active) {
          return err(res, 404, "No active session wallet"), true;
        }

        // Read on-chain balance of session wallet
        const network = process.env.ALEO_NETWORK || "testnet";
        const explorerBase = `https://api.explorer.provable.com/v1/${network}`;
        let balance = 0;
        try {
          const resp = await fetch(
            `${explorerBase}/program/credits.aleo/mapping/account/${info.sessionAddress}`,
          );
          if (resp.ok) {
            const raw = await resp.text();
            balance = parseInt(raw.replace(/"/g, "").trim(), 10) || 0;
          }
        } catch {
          // balance stays 0
        }

        const gasReserve = 100_000; // 0.1 ALEO for gas
        const reclaimable = balance - gasReserve;

        if (reclaimable <= 0) {
          deactivateSessionWallet(sessionId);
          return ok(res, { reclaimed: 0, message: "Session wallet deactivated (no reclaimable balance)." }), true;
        }

        // Execute transfer_public from session wallet back to shield
        try {
          const account = getSessionWallet(sessionId);
          if (!account) {
            return err(res, 500, "Could not load session wallet"), true;
          }
          const pm = createProgramManager(account);
          const txHash = await pm.execute({
            programName: "credits.aleo",
            functionName: "transfer_public",
            inputs: [info.shieldAddress, `${reclaimable}u64`],
            priorityFee: 0.01,
            privateFee: false,
          });
          const hash = typeof txHash === "string" ? txHash : String(txHash);
          deactivateSessionWallet(sessionId);
          return ok(res, {
            reclaimed: reclaimable,
            txHash: hash,
            message: `Reclaimed ${(reclaimable / 1_000_000).toFixed(4)} ALEO back to Shield Wallet.`,
          }), true;
        } catch (e) {
          // Deactivate anyway, but report error
          deactivateSessionWallet(sessionId);
          return ok(res, {
            reclaimed: 0,
            message: `Session wallet deactivated. Reclaim transfer failed: ${e instanceof Error ? e.message : String(e)}`,
          }), true;
        }
      }

      // ── Launchpad endpoints ──

      case "/api/launches": {
        if (req.method === "POST") {
          const sessionId = getSessionId(url);
          if (!sessionId) return err(res, 400, "sessionId required"), true;
          const body = await readBody<{
            name?: string;
            ticker?: string;
            description?: string;
            launch_id?: string;
            txId?: string;
          }>(req);
          if (!body.name || !body.ticker) {
            return err(res, 400, "name and ticker required"), true;
          }
          const result = await createLaunch(
            sessionId,
            body.name,
            body.ticker,
            body.description ?? "",
            body.launch_id || body.txId
              ? { launchId: body.launch_id, txId: body.txId }
              : undefined,
          );
          return ok(res, result), true;
        }
        // GET — list all launches + stats (on-chain reads)
        const [launches, stats] = await Promise.all([
          listLaunches(),
          getLaunchpadStats(),
        ]);
        return ok(res, { launches, stats }), true;
      }

      default:
        break;
    }

    // ── Parameterized launchpad routes ──

    // /api/launches/:id/trade
    const tradeMatch = url.pathname.match(/^\/api\/launches\/([^/]+)\/trade$/);
    if (tradeMatch && req.method === "POST") {
      const sessionId = getSessionId(url);
      if (!sessionId) return err(res, 400, "sessionId required"), true;
      const launchId = tradeMatch[1]!;
      const body = await readBody<{ side?: string; amount?: number; txId?: string }>(req);
      if (!body.side || !body.amount) {
        return err(res, 400, "side and amount required"), true;
      }
      if (body.side === "buy") {
        const result = await buyLaunchToken(sessionId, launchId, body.amount, body.txId);
        return ok(res, result), true;
      }
      if (body.side === "sell") {
        const result = await sellLaunchToken(sessionId, launchId, body.amount, body.txId);
        return ok(res, result), true;
      }
      return err(res, 400, "side must be buy or sell"), true;
    }

    // /api/launches/:id
    const detailMatch = url.pathname.match(/^\/api\/launches\/([^/]+)$/);
    if (detailMatch) {
      const launchId = detailMatch[1]!;
      const detail = await getLaunchDetail(launchId);
      if (!detail) return err(res, 404, "launch not found"), true;
      return ok(res, detail), true;
    }

    return err(res, 404, `unknown endpoint: ${url.pathname}`), true;
  } catch (e) {
    console.error("[web-api] error:", e);
    return (
      err(
        res,
        500,
        e instanceof Error ? e.message : "internal error",
      ),
      true
    );
  }
}

function safeParseJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
