/**
 * Typed REST client for the Noir dashboard. Hits /api/* endpoints served
 * by src/chat/web-api.ts. All endpoints return real data from SQLite and
 * the market modules — no mocks.
 */

import * as React from "react";

// In dev (Next dev on :3002) we point at the backend on :3000.
// In prod (Vercel) we point at the Railway backend.
function apiBase(): string {
  if (typeof window === "undefined") return "";
  if (window.location.port === "3002") {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }
  if (window.location.port === "3000") return "";
  return process.env.NEXT_PUBLIC_API_URL || "https://noir-backend-production-d2b0.up.railway.app";
}

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string };

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`);
  const body = (await res.json()) as ApiResponse<T>;
  if (!body.ok) throw new Error(body.error);
  return body.data;
}

// ── Types ──────────────────────────────────────────────────────────────

export interface Holding {
  token: string;
  amount: number;
  price: number;
  value: number;
  change24h: number;
}

export interface PortfolioSummary {
  totalValue: number;
  change24h: number;
  holdings: Holding[];
  portfolioSeries: { label: string; value: number }[];
}

export interface TradeRow {
  id: number;
  telegram_id: string;
  action: string;
  token: string;
  amount: number;
  price: number | null;
  tx_hash: string | null;
  timestamp: string;
}

export interface DcaStrategy {
  id: number;
  telegram_id: string;
  token: string;
  amount: number;
  interval: string;
  status: string;
  last_executed: string | null;
  created_at: string;
}

export interface LimitOrder {
  id: number;
  telegram_id: string;
  type: string;
  side: string;
  token: string;
  amount: number;
  target_price: number;
  status: string;
  created_at: string;
}

export interface AlertStrategy {
  id: number;
  telegram_id: string;
  token: string;
  condition: string;
  threshold: number;
  action_type: string;
  action_params: string | null;
  status: string;
  created_at: string;
  triggered_at: string | null;
}

export interface ProtectionStrategy {
  id: number;
  telegram_id: string;
  threshold: number;
  high_water_mark: number | null;
  status: string;
  created_at: string;
}

export interface RebalanceStrategy {
  id: number;
  telegram_id: string;
  allocations: Record<string, number> | null;
  drift_threshold: number;
  status: string;
  last_rebalanced: string | null;
  created_at: string;
}

export interface CopyStrategy {
  id: number;
  follower_id: string;
  leader_id: string;
  mode: string;
  fixed_amount: number | null;
  max_per_trade: number | null;
  status: string;
  total_copied: number;
  created_at: string;
}

export interface StrategiesBundle {
  dca: DcaStrategy[];
  limits: LimitOrder[];
  alerts: AlertStrategy[];
  protection: ProtectionStrategy[];
  rebalance: RebalanceStrategy[];
  copy: CopyStrategy[];
  totalActive: number;
}

export interface DecisionRow {
  id: number;
  telegram_id: string;
  user_message: string | null;
  parsed_action: string;
  market_context: string | null;
  reasoning: string;
  decision: string;
  tx_hash: string | null;
  timestamp: string;
}

export interface MarketToken {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change1h: number;
  rsi: number | null;
  rsiSignal: "oversold" | "neutral" | "overbought" | null;
  bollingerPosition:
    | "below_lower"
    | "lower_half"
    | "upper_half"
    | "above_upper"
    | null;
  isStablecoin: boolean;
}

// ── Privacy types ──────────────────────────────────────────────────────

export interface PrivacyBreakdown {
  zkTradesCount: number;
  totalTrades: number;
  privateSends: number;
  godarks: number;
  zkLoginActive: boolean;
  shieldWallet: boolean;
  activeStrategies: number;
}

export interface PrivacyContract {
  name: string;
  status: string;
  functions: number;
}

export interface ProofCapability {
  name: string;
  fn: string;
  program: string;
  description: string;
}

export interface PrivacySummary {
  privacyScore: number;
  breakdown: PrivacyBreakdown;
  contracts: PrivacyContract[];
  proofCapabilities: ProofCapability[];
}

// ── Launchpad types ────────────────────────────────────────────────────

export interface LaunchItem {
  launch_id: string;
  creator_id: string;
  name: string;
  ticker: string;
  description: string;
  image_url: string;
  website_url: string;
  twitter_url: string;
  telegram_url: string;
  discord_url: string;
  supply_sold: number;
  graduated: number;
  created_at: string;
  currentPrice: number;
  progressPct: number;
}

export interface LaunchStats {
  totalLaunches: number;
  activeLaunches: number;
  graduatedCount: number;
  totalVolume: number;
}

export interface LaunchesResponse {
  launches: LaunchItem[];
  stats: LaunchStats;
}

export interface LaunchTradeItem {
  id: number;
  launch_id: string;
  session_id: string;
  side: string;
  amount: number;
  price_avg: number;
  tx_id: string | null;
  created_at: string;
}

export interface LaunchDetailResponse {
  launch_id: string;
  creator_id: string;
  name: string;
  ticker: string;
  description: string;
  image_url: string;
  website_url: string;
  twitter_url: string;
  telegram_url: string;
  discord_url: string;
  supply_sold: number;
  graduated: number;
  created_at: string;
  currentPrice: number;
  marketCap: number;
  progressPct: number;
  recentTrades: LaunchTradeItem[];
}

// ── Fetchers ───────────────────────────────────────────────────────────

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as ApiResponse<T>;
  if (!data.ok) throw new Error(data.error);
  return data.data;
}

export const api = {
  portfolio: (sessionId: string) =>
    get<PortfolioSummary>(`/api/holdings?sessionId=${encodeURIComponent(sessionId)}`),
  trades: (sessionId: string) =>
    get<TradeRow[]>(`/api/trades?sessionId=${encodeURIComponent(sessionId)}`),
  strategies: (sessionId: string) =>
    get<StrategiesBundle>(
      `/api/strategies?sessionId=${encodeURIComponent(sessionId)}`,
    ),
  decisions: (sessionId: string) =>
    get<DecisionRow[]>(
      `/api/decisions?sessionId=${encodeURIComponent(sessionId)}`,
    ),
  balance: (sessionId: string) =>
    get<{ address: string | null; balanceCredits: number }>(
      `/api/balance?sessionId=${encodeURIComponent(sessionId)}`,
    ),
  balanceUsdcx: (sessionId: string) =>
    get<{ address: string | null; balanceUsdcx: number }>(
      `/api/balance/usdcx?sessionId=${encodeURIComponent(sessionId)}`,
    ),
  market: () => get<MarketToken[]>("/api/market"),
  marketHistory: (token: string, limit = 48) =>
    get<{ label: string; value: number }[]>(
      `/api/market/history?token=${encodeURIComponent(token)}&limit=${limit}`,
    ),
  launches: () => get<LaunchesResponse>("/api/launches"),
  launchDetail: (id: string) =>
    get<LaunchDetailResponse>(`/api/launches/${encodeURIComponent(id)}`),
  createLaunch: (
    sessionId: string,
    name: string,
    ticker: string,
    description: string,
    opts?: {
      launch_id?: string;
      txId?: string;
      image_url?: string;
      website_url?: string;
      twitter_url?: string;
      telegram_url?: string;
      discord_url?: string;
    },
  ) =>
    post<{ launchId: string; message: string }>(
      `/api/launches?sessionId=${encodeURIComponent(sessionId)}`,
      { name, ticker, description, ...opts },
    ),
  tradeLaunch: (sessionId: string, launchId: string, side: string, amount: number) =>
    post<{ success: boolean; message: string }>(
      `/api/launches/${encodeURIComponent(launchId)}/trade?sessionId=${encodeURIComponent(sessionId)}`,
      { side, amount },
    ),

  // ── Strategy creation ─────────────────────────────────────────────────
  createDca: (sessionId: string, token: string, amount: number, interval: string) =>
    post<{ id: number; message: string }>(
      `/api/strategies/dca?sessionId=${encodeURIComponent(sessionId)}`,
      { token, amount, interval },
    ),
  createLimit: (sessionId: string, side: string, token: string, amount: number, targetPrice: number) =>
    post<{ id: number; message: string }>(
      `/api/strategies/limit?sessionId=${encodeURIComponent(sessionId)}`,
      { side, token, amount, targetPrice },
    ),
  createAlert: (sessionId: string, token: string, condition: string, threshold: number, actionType: string, actionValue?: string) =>
    post<{ id: number; message: string }>(
      `/api/strategies/alert?sessionId=${encodeURIComponent(sessionId)}`,
      { token, condition, threshold, actionType, actionValue },
    ),
  createProtection: (sessionId: string, threshold: number) =>
    post<{ id: number; message: string }>(
      `/api/strategies/protection?sessionId=${encodeURIComponent(sessionId)}`,
      { threshold },
    ),
  createRebalance: (sessionId: string, allocations: Record<string, number>, driftThreshold?: number) =>
    post<{ id: number; message: string }>(
      `/api/strategies/rebalance?sessionId=${encodeURIComponent(sessionId)}`,
      { allocations, driftThreshold },
    ),
  createCopy: (sessionId: string, leader: string, mode?: string, fixedAmount?: number, maxPerTrade?: number) =>
    post<{ id: number; message: string }>(
      `/api/strategies/copy?sessionId=${encodeURIComponent(sessionId)}`,
      { leader, mode, fixedAmount, maxPerTrade },
    ),

  privacySummary: (sessionId: string) =>
    get<PrivacySummary>(
      `/api/privacy/summary?sessionId=${encodeURIComponent(sessionId)}`,
    ),

  // ── Session wallet ────────────────────────────────────────────────────
  createSessionWallet: (sessionId: string, shieldAddress: string) =>
    post<{ sessionAddress: string }>(
      `/api/session-wallet?sessionId=${encodeURIComponent(sessionId)}`,
      { shieldAddress },
    ),
  getSessionWallet: (sessionId: string) =>
    get<{
      active: boolean;
      sessionAddress?: string;
      shieldAddress?: string;
      fundedAmount?: number;
    }>(`/api/session-wallet?sessionId=${encodeURIComponent(sessionId)}`),
  reclaimSessionWallet: (sessionId: string) =>
    post<{ reclaimed: number; txHash?: string; message: string }>(
      `/api/session-wallet/reclaim?sessionId=${encodeURIComponent(sessionId)}`,
      {},
    ),
};

// ── React hook ─────────────────────────────────────────────────────────

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Tiny fetch-on-mount hook. `fetcher` is re-run whenever any dep changes.
 * Returns null data with loading=false if any dep is null (so consumers can
 * show a placeholder while waiting for sessionId).
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList,
  enabled: boolean = true,
  pollMs?: number,
): AsyncState<T> {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(enabled);
  const [error, setError] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, enabled]);

  // Polling: silently refresh data at interval without setting loading state
  React.useEffect(() => {
    if (!enabled || !pollMs) return;
    const id = setInterval(() => {
      fetcher()
        .then((d) => setData(d))
        .catch(() => {}); // silent — stale data is fine
    }, pollMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, pollMs]);

  const reload = React.useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, reload };
}
