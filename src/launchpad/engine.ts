/**
 * Launchpad engine — bonding curve token launch business logic.
 *
 * The Aleo blockchain is the source of truth for supply, graduation, and
 * holdings. The local DB is a metadata-only index (name, ticker, description)
 * plus an optional activity log (launch_trades).
 *
 * On-chain state is read via the Provable explorer REST API:
 *   supply_sold[launch_id]   → u64
 *   graduated[launch_id]     → bool
 *   launch_creators[launch_id] → address
 */

import { createHash } from "node:crypto";
import {
  insertLaunch,
  getLaunch,
  getLaunchByTicker,
  getAllLaunches,
  insertLaunchTrade,
  getLaunchTrades,
  getLaunchTradeVolume,
  type LaunchRow,
  type LaunchTradeRow,
} from "../storage/db.js";

const PROGRAM_ID = "ghost_launchpad_v1.aleo";
const MAX_SUPPLY = 1_000_000;
const GRADUATION_THRESHOLD = 800_000;

const NETWORK = process.env.ALEO_NETWORK || "testnet";
const EXPLORER_BASE = `https://api.explorer.provable.com/v1/${NETWORK}`;

// ── On-chain state reader ──

export interface OnChainLaunchState {
  supplySold: number;
  graduated: boolean;
  creator: string | null;
}

/**
 * Fetch on-chain state for a launch from Aleo RPC mappings.
 * Returns defaults (0 supply, not graduated) if the mapping entry doesn't exist yet.
 */
export async function fetchOnChainState(launchId: string): Promise<OnChainLaunchState> {
  const base = `${EXPLORER_BASE}/program/${PROGRAM_ID}/mapping`;

  const [supplyResp, gradResp, creatorResp] = await Promise.allSettled([
    fetch(`${base}/supply_sold/${launchId}field`),
    fetch(`${base}/graduated/${launchId}field`),
    fetch(`${base}/launch_creators/${launchId}field`),
  ]);

  let supplySold = 0;
  if (supplyResp.status === "fulfilled" && supplyResp.value.ok) {
    const raw = await supplyResp.value.text();
    // Response is like "500u64" or "500u64\n" — strip quotes and suffix
    supplySold = parseInt(raw.replace(/"/g, "").trim(), 10) || 0;
  }

  let graduated = false;
  if (gradResp.status === "fulfilled" && gradResp.value.ok) {
    const raw = await gradResp.value.text();
    graduated = raw.replace(/"/g, "").trim() === "true";
  }

  let creator: string | null = null;
  if (creatorResp.status === "fulfilled" && creatorResp.value.ok) {
    const raw = await creatorResp.value.text();
    creator = raw.replace(/"/g, "").trim() || null;
  }

  return { supplySold, graduated, creator };
}

// ── Bonding curve math ──

/** Price per token at a given supply level. */
export function getBondingPrice(supplySold: number): number {
  return 1 + supplySold / 1000;
}

/** Cost to buy `amount` tokens starting from `currentSupply`. */
export function getBuyCost(currentSupply: number, amount: number): number {
  const midpoint = currentSupply + amount / 2;
  return amount * (1 + midpoint / 1000);
}

/** Refund for selling `amount` tokens starting from `currentSupply`. */
export function getSellRefund(currentSupply: number, amount: number): number {
  const midpoint = currentSupply - amount / 2;
  return amount * (1 + Math.max(0, midpoint) / 1000);
}

// ── Launch operations ──

export interface CreateLaunchResult {
  launchId: string;
  name: string;
  ticker: string;
  txHash?: string;
  message: string;
}

/**
 * Generate a deterministic launch_id from name + ticker + timestamp.
 */
function generateLaunchId(name: string, ticker: string): string {
  const input = `${name}:${ticker}:${Date.now()}`;
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}

/**
 * Store launch metadata in the DB.
 * On-chain execution is handled by Shield Wallet on the frontend.
 */
export async function createLaunch(
  sessionId: string,
  name: string,
  ticker: string,
  description: string,
  opts?: { launchId?: string; txId?: string },
): Promise<CreateLaunchResult> {
  // Validate
  const normalTicker = ticker.toUpperCase();
  if (normalTicker.length > 6) {
    return { launchId: "", name, ticker: normalTicker, message: "Ticker must be 6 characters or fewer." };
  }

  // Check ticker uniqueness
  const existing = getLaunchByTicker(normalTicker);
  if (existing) {
    return { launchId: "", name, ticker: normalTicker, message: `Ticker ${normalTicker} is already taken.` };
  }

  const launchId = opts?.launchId || generateLaunchId(name, normalTicker);
  const txHash = opts?.txId;

  // Insert metadata into local DB
  insertLaunch(launchId, sessionId, name, normalTicker, description);

  return {
    launchId,
    name,
    ticker: normalTicker,
    txHash,
    message:
      `Launch created: ${name} ($${normalTicker})\n` +
      `ID: ${launchId}\n` +
      `Bonding curve active — price starts at 1 microcredit.\n` +
      `Graduates at ${GRADUATION_THRESHOLD.toLocaleString()} tokens sold.` +
      (txHash ? `\nTx: ${txHash}` : "\n(Metadata stored — execute on-chain via Shield Wallet)"),
  };
}

export interface TradeResult {
  success: boolean;
  txHash?: string;
  message: string;
}

/**
 * Log a buy trade. Reads on-chain supply for validation.
 * Actual on-chain execution is handled by Shield Wallet on the frontend.
 */
export async function buyLaunchToken(
  sessionId: string,
  launchId: string,
  amount: number,
  txId?: string,
): Promise<TradeResult> {
  const launch = getLaunch(launchId);
  if (!launch) return { success: false, message: "Launch not found." };

  const intAmount = Math.floor(amount);
  if (intAmount <= 0) return { success: false, message: "Amount must be positive." };

  // Read current supply from chain
  const onChain = await fetchOnChainState(launchId);

  if (onChain.graduated) {
    return { success: false, message: `$${launch.ticker} has graduated — no more buys on the bonding curve.` };
  }

  const newSupply = onChain.supplySold + intAmount;
  if (newSupply > MAX_SUPPLY) {
    return { success: false, message: `Exceeds max supply. Only ${MAX_SUPPLY - onChain.supplySold} tokens remaining.` };
  }

  const cost = getBuyCost(onChain.supplySold, intAmount);
  const priceAvg = cost / intAmount;
  const graduated = newSupply >= GRADUATION_THRESHOLD;

  // Log trade in activity log
  insertLaunchTrade(launchId, sessionId, "buy", intAmount, priceAvg, txId);

  return {
    success: true,
    txHash: txId,
    message:
      `BUY ${intAmount.toLocaleString()} $${launch.ticker}\n` +
      `Cost: ${cost.toFixed(0)} microcredits (avg ${priceAvg.toFixed(2)}/token)\n` +
      `Supply: ${newSupply.toLocaleString()} / ${MAX_SUPPLY.toLocaleString()}` +
      (graduated ? "\nGRADUATED! Token has hit the threshold." : "") +
      (txId ? `\nTx: ${txId}` : "\n(Execute on-chain via Shield Wallet)"),
  };
}

/**
 * Log a sell trade. Reads on-chain supply for validation.
 * Actual on-chain execution is handled by Shield Wallet on the frontend.
 */
export async function sellLaunchToken(
  sessionId: string,
  launchId: string,
  amount: number,
  txId?: string,
): Promise<TradeResult> {
  const launch = getLaunch(launchId);
  if (!launch) return { success: false, message: "Launch not found." };

  const intAmount = Math.floor(amount);
  if (intAmount <= 0) return { success: false, message: "Amount must be positive." };

  // Read current supply from chain
  const onChain = await fetchOnChainState(launchId);

  if (intAmount > onChain.supplySold) {
    return { success: false, message: `Only ${onChain.supplySold.toLocaleString()} tokens in circulation.` };
  }

  const refund = getSellRefund(onChain.supplySold, intAmount);
  const priceAvg = refund / intAmount;
  const newSupply = onChain.supplySold - intAmount;

  // Log trade in activity log
  insertLaunchTrade(launchId, sessionId, "sell", intAmount, priceAvg, txId);

  return {
    success: true,
    txHash: txId,
    message:
      `SELL ${intAmount.toLocaleString()} $${launch.ticker}\n` +
      `Refund: ${refund.toFixed(0)} microcredits (avg ${priceAvg.toFixed(2)}/token)\n` +
      `Supply: ${newSupply.toLocaleString()} / ${MAX_SUPPLY.toLocaleString()}` +
      (txId ? `\nTx: ${txId}` : "\n(Execute on-chain via Shield Wallet)"),
  };
}

// ── Query operations ──

export interface LaunchDetail {
  launch_id: string;
  creator_id: string;
  name: string;
  ticker: string;
  description: string;
  image_url: string;
  created_at: string;
  supply_sold: number;
  graduated: number;
  currentPrice: number;
  marketCap: number;
  progressPct: number;
  recentTrades: LaunchTradeRow[];
}

export async function listLaunches(): Promise<
  (LaunchRow & { supply_sold: number; graduated: number; currentPrice: number; progressPct: number })[]
> {
  const rows = getAllLaunches();
  if (rows.length === 0) return [];

  // Fetch on-chain state for all launches in parallel
  const states = await Promise.all(
    rows.map((r) => fetchOnChainState(r.launch_id)),
  );

  return rows.map((r, i) => {
    const s = states[i]!;
    return {
      ...r,
      supply_sold: s.supplySold,
      graduated: s.graduated ? 1 : 0,
      currentPrice: getBondingPrice(s.supplySold),
      progressPct: (s.supplySold / MAX_SUPPLY) * 100,
    };
  });
}

export async function getLaunchDetail(launchId: string): Promise<LaunchDetail | null> {
  const launch = getLaunch(launchId);
  if (!launch) return null;

  const onChain = await fetchOnChainState(launchId);

  const currentPrice = getBondingPrice(onChain.supplySold);
  const marketCap = onChain.supplySold * currentPrice;
  const progressPct = (onChain.supplySold / MAX_SUPPLY) * 100;
  const recentTrades = getLaunchTrades(launchId, 20);

  return {
    ...launch,
    supply_sold: onChain.supplySold,
    graduated: onChain.graduated ? 1 : 0,
    currentPrice,
    marketCap,
    progressPct,
    recentTrades,
  };
}

export async function getLaunchpadStats(): Promise<{
  totalLaunches: number;
  activeLaunches: number;
  graduatedCount: number;
  totalVolume: number;
}> {
  const all = getAllLaunches();
  const totalVolume = getLaunchTradeVolume();

  if (all.length === 0) {
    return { totalLaunches: 0, activeLaunches: 0, graduatedCount: 0, totalVolume };
  }

  // Fetch on-chain graduation status for all launches
  const states = await Promise.all(
    all.map((r) => fetchOnChainState(r.launch_id)),
  );

  const graduatedCount = states.filter((s) => s.graduated).length;

  return {
    totalLaunches: all.length,
    activeLaunches: all.length - graduatedCount,
    graduatedCount,
    totalVolume,
  };
}
