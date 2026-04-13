import Database from "better-sqlite3";
import { existsSync } from "node:fs";

let db: Database.Database;

export function initDb(path = "noir.db"): Database.Database {
  db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      telegram_id TEXT PRIMARY KEY,
      aleo_address TEXT NOT NULL,
      encrypted_private_key TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pending_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'limit',
      side TEXT NOT NULL,
      token TEXT NOT NULL,
      amount REAL NOT NULL,
      target_price REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
    );

    CREATE TABLE IF NOT EXISTS trade_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT NOT NULL,
      action TEXT NOT NULL,
      token TEXT NOT NULL,
      amount REAL NOT NULL,
      price REAL,
      tx_hash TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
    );

    CREATE TABLE IF NOT EXISTS dca_strategies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT NOT NULL,
      token TEXT NOT NULL,
      amount REAL NOT NULL,
      interval TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      last_executed TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
    );

    CREATE TABLE IF NOT EXISTS protection_strategies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT NOT NULL,
      threshold REAL NOT NULL,
      high_water_mark REAL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
    );

    CREATE TABLE IF NOT EXISTS rebalance_strategies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT NOT NULL,
      allocations TEXT NOT NULL,
      drift_threshold REAL NOT NULL DEFAULT 5.0,
      status TEXT NOT NULL DEFAULT 'active',
      last_rebalanced TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL,
      price REAL NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_price_history_token_ts ON price_history(token, timestamp);

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT NOT NULL,
      token TEXT NOT NULL,
      condition TEXT NOT NULL,
      threshold REAL NOT NULL,
      action_type TEXT NOT NULL DEFAULT 'notify',
      action_params TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      triggered_at TEXT,
      FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
    );

    CREATE TABLE IF NOT EXISTS agent_decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT NOT NULL,
      user_message TEXT,
      parsed_action TEXT NOT NULL,
      market_context TEXT,
      reasoning TEXT NOT NULL,
      decision TEXT NOT NULL,
      tx_hash TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
    );

    CREATE TABLE IF NOT EXISTS copy_strategies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id TEXT NOT NULL,
      leader_id TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'proportional',
      fixed_amount REAL,
      max_per_trade REAL,
      status TEXT NOT NULL DEFAULT 'active',
      total_copied INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(follower_id, leader_id)
    );
    CREATE INDEX IF NOT EXISTS idx_copy_leader ON copy_strategies(leader_id, status);

    CREATE TABLE IF NOT EXISTS launches (
      launch_id TEXT PRIMARY KEY,
      creator_id TEXT NOT NULL,
      name TEXT NOT NULL,
      ticker TEXT NOT NULL,
      description TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS launch_trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      launch_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      side TEXT NOT NULL,
      amount INTEGER NOT NULL,
      price_avg REAL NOT NULL,
      tx_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_launch_trades_launch ON launch_trades(launch_id, created_at);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS session_wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      shield_address TEXT NOT NULL,
      session_address TEXT NOT NULL,
      session_private_key TEXT NOT NULL,
      funded_amount INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // ── OAuth migration (additive — no-op if columns already exist) ──
  const cols = db.pragma("table_info(users)") as { name: string }[];
  const colNames = new Set(cols.map((c) => c.name));
  if (!colNames.has("oauth_provider")) {
    db.exec("ALTER TABLE users ADD COLUMN oauth_provider TEXT");
  }
  if (!colNames.has("oauth_sub")) {
    db.exec("ALTER TABLE users ADD COLUMN oauth_sub TEXT");
  }
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_sub)",
  );

  // ── Launches social links migration ──
  const launchCols = db.pragma("table_info(launches)") as { name: string }[];
  const launchColNames = new Set(launchCols.map((c) => c.name));
  if (!launchColNames.has("website_url")) {
    db.exec("ALTER TABLE launches ADD COLUMN website_url TEXT DEFAULT ''");
  }
  if (!launchColNames.has("twitter_url")) {
    db.exec("ALTER TABLE launches ADD COLUMN twitter_url TEXT DEFAULT ''");
  }
  if (!launchColNames.has("telegram_url")) {
    db.exec("ALTER TABLE launches ADD COLUMN telegram_url TEXT DEFAULT ''");
  }
  if (!launchColNames.has("discord_url")) {
    db.exec("ALTER TABLE launches ADD COLUMN discord_url TEXT DEFAULT ''");
  }

  return db;
}

export function getDb(): Database.Database {
  if (!db) throw new Error("Database not initialized — call initDb() first");
  return db;
}

// ── User operations ──

export interface UserRow {
  telegram_id: string;
  aleo_address: string;
  encrypted_private_key: string;
  created_at: string;
  oauth_provider: string | null;
  oauth_sub: string | null;
}

export function upsertUser(
  telegramId: string,
  aleoAddress: string,
  encryptedKey: string,
): void {
  getDb()
    .prepare(
      `INSERT INTO users (telegram_id, aleo_address, encrypted_private_key)
       VALUES (?, ?, ?)
       ON CONFLICT(telegram_id) DO UPDATE SET
         aleo_address = excluded.aleo_address,
         encrypted_private_key = excluded.encrypted_private_key`,
    )
    .run(telegramId, aleoAddress, encryptedKey);
}

export function getUser(telegramId: string): UserRow | undefined {
  return getDb()
    .prepare("SELECT * FROM users WHERE telegram_id = ?")
    .get(telegramId) as UserRow | undefined;
}

export function updateUserOAuth(
  telegramId: string,
  provider: string,
  sub: string,
): void {
  getDb()
    .prepare(
      "UPDATE users SET oauth_provider = ?, oauth_sub = ? WHERE telegram_id = ?",
    )
    .run(provider, sub, telegramId);
}

export function getUserByOAuth(
  provider: string,
  sub: string,
): UserRow | undefined {
  return getDb()
    .prepare(
      "SELECT * FROM users WHERE oauth_provider = ? AND oauth_sub = ?",
    )
    .get(provider, sub) as UserRow | undefined;
}

// ── Pending orders ──

export interface PendingOrderRow {
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

export function createPendingOrder(
  telegramId: string,
  side: string,
  token: string,
  amount: number,
  targetPrice: number,
): number {
  const info = getDb()
    .prepare(
      `INSERT INTO pending_orders (telegram_id, side, token, amount, target_price)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(telegramId, side, token, amount, targetPrice);
  return Number(info.lastInsertRowid);
}

export function getPendingOrders(): PendingOrderRow[] {
  return getDb()
    .prepare("SELECT * FROM pending_orders WHERE status = 'pending'")
    .all() as PendingOrderRow[];
}

export function getUserPendingOrders(telegramId: string): PendingOrderRow[] {
  return getDb()
    .prepare(
      "SELECT * FROM pending_orders WHERE telegram_id = ? AND status = 'pending' ORDER BY created_at DESC",
    )
    .all(telegramId) as PendingOrderRow[];
}

export function updateOrderStatus(id: number, status: string): void {
  getDb()
    .prepare("UPDATE pending_orders SET status = ? WHERE id = ?")
    .run(status, id);
}

// ── Trade history ──

export interface TradeHistoryRow {
  id: number;
  telegram_id: string;
  action: string;
  token: string;
  amount: number;
  price: number | null;
  tx_hash: string | null;
  timestamp: string;
}

export function recordTrade(
  telegramId: string,
  action: string,
  token: string,
  amount: number,
  price?: number,
  txHash?: string,
): void {
  getDb()
    .prepare(
      `INSERT INTO trade_history (telegram_id, action, token, amount, price, tx_hash)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(telegramId, action, token, amount, price ?? null, txHash ?? null);
}

export function getTradeHistory(telegramId: string): TradeHistoryRow[] {
  return getDb()
    .prepare(
      "SELECT * FROM trade_history WHERE telegram_id = ? ORDER BY timestamp DESC LIMIT 20",
    )
    .all(telegramId) as TradeHistoryRow[];
}

// ── DCA strategies ──

export interface DcaStrategyRow {
  id: number;
  telegram_id: string;
  token: string;
  amount: number;
  interval: string;
  status: string;
  last_executed: string | null;
  created_at: string;
}

export function createDcaStrategy(
  telegramId: string,
  token: string,
  amount: number,
  interval: string,
): number {
  const info = getDb()
    .prepare(
      `INSERT INTO dca_strategies (telegram_id, token, amount, interval)
       VALUES (?, ?, ?, ?)`,
    )
    .run(telegramId, token, amount, interval);
  return Number(info.lastInsertRowid);
}

export function getActiveDcaStrategies(): DcaStrategyRow[] {
  return getDb()
    .prepare("SELECT * FROM dca_strategies WHERE status = 'active'")
    .all() as DcaStrategyRow[];
}

export function getUserDcaStrategies(telegramId: string): DcaStrategyRow[] {
  return getDb()
    .prepare("SELECT * FROM dca_strategies WHERE telegram_id = ? AND status = 'active'")
    .all(telegramId) as DcaStrategyRow[];
}

export function updateDcaLastExecuted(id: number): void {
  getDb()
    .prepare("UPDATE dca_strategies SET last_executed = datetime('now') WHERE id = ?")
    .run(id);
}

export function cancelDcaStrategy(id: number): void {
  getDb()
    .prepare("UPDATE dca_strategies SET status = 'cancelled' WHERE id = ?")
    .run(id);
}

// ── Protection strategies ──

export interface ProtectionRow {
  id: number;
  telegram_id: string;
  threshold: number;
  high_water_mark: number | null;
  status: string;
  created_at: string;
}

export function createProtection(
  telegramId: string,
  threshold: number,
  currentValue: number,
): number {
  const info = getDb()
    .prepare(
      `INSERT INTO protection_strategies (telegram_id, threshold, high_water_mark)
       VALUES (?, ?, ?)`,
    )
    .run(telegramId, threshold, currentValue);
  return Number(info.lastInsertRowid);
}

export function getActiveProtections(): ProtectionRow[] {
  return getDb()
    .prepare("SELECT * FROM protection_strategies WHERE status = 'active'")
    .all() as ProtectionRow[];
}

export function getUserProtections(telegramId: string): ProtectionRow[] {
  return getDb()
    .prepare("SELECT * FROM protection_strategies WHERE telegram_id = ? AND status = 'active'")
    .all(telegramId) as ProtectionRow[];
}

export function updateHighWaterMark(id: number, value: number): void {
  getDb()
    .prepare("UPDATE protection_strategies SET high_water_mark = ? WHERE id = ?")
    .run(value, id);
}

export function triggerProtection(id: number): void {
  getDb()
    .prepare("UPDATE protection_strategies SET status = 'triggered' WHERE id = ?")
    .run(id);
}

// ── Rebalance strategies ──

export interface RebalanceRow {
  id: number;
  telegram_id: string;
  allocations: string; // JSON
  drift_threshold: number;
  status: string;
  last_rebalanced: string | null;
  created_at: string;
}

export function createRebalanceStrategy(
  telegramId: string,
  allocations: Record<string, number>,
  driftThreshold = 5,
): number {
  const info = getDb()
    .prepare(
      `INSERT INTO rebalance_strategies (telegram_id, allocations, drift_threshold)
       VALUES (?, ?, ?)`,
    )
    .run(telegramId, JSON.stringify(allocations), driftThreshold);
  return Number(info.lastInsertRowid);
}

export function getActiveRebalances(): RebalanceRow[] {
  return getDb()
    .prepare("SELECT * FROM rebalance_strategies WHERE status = 'active'")
    .all() as RebalanceRow[];
}

export function getUserRebalances(telegramId: string): RebalanceRow[] {
  return getDb()
    .prepare("SELECT * FROM rebalance_strategies WHERE telegram_id = ? AND status = 'active'")
    .all(telegramId) as RebalanceRow[];
}

export function updateRebalanceLastRun(id: number): void {
  getDb()
    .prepare("UPDATE rebalance_strategies SET last_rebalanced = datetime('now') WHERE id = ?")
    .run(id);
}

// ── Price history ──

export interface PriceHistoryRow {
  id: number;
  token: string;
  price: number;
  timestamp: string;
}

export function recordPrice(token: string, price: number): void {
  getDb()
    .prepare("INSERT INTO price_history (token, price) VALUES (?, ?)")
    .run(token.toUpperCase(), price);
}

export function getPriceHistory(
  token: string,
  limit = 168, // 7 days of hourly candles
): PriceHistoryRow[] {
  return getDb()
    .prepare(
      "SELECT * FROM price_history WHERE token = ? ORDER BY timestamp DESC LIMIT ?",
    )
    .all(token.toUpperCase(), limit) as PriceHistoryRow[];
}

// ── Alerts ──

export interface AlertRow {
  id: number;
  telegram_id: string;
  token: string;
  condition: string; // "drops_pct", "rises_pct", "above", "below"
  threshold: number;
  action_type: string; // "notify", "sell_pct", "buy_amount"
  action_params: string | null; // JSON: { percent: 50 } or { amount: 100 }
  status: string;
  created_at: string;
  triggered_at: string | null;
}

export function createAlert(
  telegramId: string,
  token: string,
  condition: string,
  threshold: number,
  actionType: string,
  actionParams?: Record<string, unknown>,
): number {
  const info = getDb()
    .prepare(
      `INSERT INTO alerts (telegram_id, token, condition, threshold, action_type, action_params)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      telegramId,
      token.toUpperCase(),
      condition,
      threshold,
      actionType,
      actionParams ? JSON.stringify(actionParams) : null,
    );
  return Number(info.lastInsertRowid);
}

export function getActiveAlerts(): AlertRow[] {
  return getDb()
    .prepare("SELECT * FROM alerts WHERE status = 'active'")
    .all() as AlertRow[];
}

export function getUserAlerts(telegramId: string): AlertRow[] {
  return getDb()
    .prepare("SELECT * FROM alerts WHERE telegram_id = ? AND status = 'active'")
    .all(telegramId) as AlertRow[];
}

export function triggerAlert(id: number): void {
  getDb()
    .prepare(
      "UPDATE alerts SET status = 'triggered', triggered_at = datetime('now') WHERE id = ?",
    )
    .run(id);
}

export function cancelAlert(id: number): void {
  getDb()
    .prepare("UPDATE alerts SET status = 'cancelled' WHERE id = ?")
    .run(id);
}

// ── Agent decisions (reasoning log) ──

export interface AgentDecisionRow {
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

export function logDecision(
  telegramId: string,
  userMessage: string | null,
  parsedAction: string,
  marketContext: string | null,
  reasoning: string,
  decision: string,
  txHash?: string,
): number {
  const info = getDb()
    .prepare(
      `INSERT INTO agent_decisions (telegram_id, user_message, parsed_action, market_context, reasoning, decision, tx_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(telegramId, userMessage, parsedAction, marketContext, reasoning, decision, txHash ?? null);
  return Number(info.lastInsertRowid);
}

export function getDecisionHistory(
  telegramId: string,
  limit = 20,
): AgentDecisionRow[] {
  return getDb()
    .prepare(
      "SELECT * FROM agent_decisions WHERE telegram_id = ? ORDER BY timestamp DESC LIMIT ?",
    )
    .all(telegramId, limit) as AgentDecisionRow[];
}

export function getAllDecisions(telegramId: string): AgentDecisionRow[] {
  return getDb()
    .prepare(
      "SELECT * FROM agent_decisions WHERE telegram_id = ? ORDER BY timestamp ASC",
    )
    .all(telegramId) as AgentDecisionRow[];
}

// ── Copy strategies ──

export interface CopyStrategyRow {
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

export function createCopyStrategy(
  followerId: string,
  leaderId: string,
  mode = "proportional",
  fixedAmount?: number,
  maxPerTrade?: number,
): number {
  const info = getDb()
    .prepare(
      `INSERT INTO copy_strategies (follower_id, leader_id, mode, fixed_amount, max_per_trade)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(follower_id, leader_id) DO UPDATE SET
         mode = excluded.mode,
         fixed_amount = excluded.fixed_amount,
         max_per_trade = excluded.max_per_trade,
         status = 'active'`,
    )
    .run(followerId, leaderId, mode, fixedAmount ?? null, maxPerTrade ?? null);
  return Number(info.lastInsertRowid);
}

export function getFollowersOf(leaderId: string): CopyStrategyRow[] {
  return getDb()
    .prepare("SELECT * FROM copy_strategies WHERE leader_id = ? AND status = 'active'")
    .all(leaderId) as CopyStrategyRow[];
}

export function getUserCopyStrategies(followerId: string): CopyStrategyRow[] {
  return getDb()
    .prepare("SELECT * FROM copy_strategies WHERE follower_id = ? AND status = 'active'")
    .all(followerId) as CopyStrategyRow[];
}

export function cancelCopyStrategy(followerId: string, leaderId: string): void {
  getDb()
    .prepare("UPDATE copy_strategies SET status = 'cancelled' WHERE follower_id = ? AND leader_id = ?")
    .run(followerId, leaderId);
}

export function cancelAllCopyStrategies(followerId: string): void {
  getDb()
    .prepare("UPDATE copy_strategies SET status = 'cancelled' WHERE follower_id = ? AND status = 'active'")
    .run(followerId);
}

export function incrementCopyCount(id: number): void {
  getDb()
    .prepare("UPDATE copy_strategies SET total_copied = total_copied + 1 WHERE id = ?")
    .run(id);
}

// ── Launches ──

export interface LaunchRow {
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
  created_at: string;
}

export function insertLaunch(
  launchId: string,
  creatorId: string,
  name: string,
  ticker: string,
  description: string,
  extra?: {
    image_url?: string;
    website_url?: string;
    twitter_url?: string;
    telegram_url?: string;
    discord_url?: string;
  },
): void {
  getDb()
    .prepare(
      `INSERT INTO launches (launch_id, creator_id, name, ticker, description, image_url, website_url, twitter_url, telegram_url, discord_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      launchId,
      creatorId,
      name,
      ticker,
      description,
      extra?.image_url ?? "",
      extra?.website_url ?? "",
      extra?.twitter_url ?? "",
      extra?.telegram_url ?? "",
      extra?.discord_url ?? "",
    );
}

export function getLaunch(launchId: string): LaunchRow | undefined {
  return getDb()
    .prepare("SELECT * FROM launches WHERE launch_id = ?")
    .get(launchId) as LaunchRow | undefined;
}

export function getLaunchByTicker(ticker: string): LaunchRow | undefined {
  return getDb()
    .prepare("SELECT * FROM launches WHERE ticker = ? COLLATE NOCASE")
    .get(ticker) as LaunchRow | undefined;
}

export function getAllLaunches(): LaunchRow[] {
  return getDb()
    .prepare("SELECT * FROM launches ORDER BY created_at DESC")
    .all() as LaunchRow[];
}

// ── Launch trades ──

export interface LaunchTradeRow {
  id: number;
  launch_id: string;
  session_id: string;
  side: string;
  amount: number;
  price_avg: number;
  tx_id: string | null;
  created_at: string;
}

export function insertLaunchTrade(
  launchId: string,
  sessionId: string,
  side: string,
  amount: number,
  priceAvg: number,
  txId?: string,
): number {
  const info = getDb()
    .prepare(
      `INSERT INTO launch_trades (launch_id, session_id, side, amount, price_avg, tx_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(launchId, sessionId, side, amount, priceAvg, txId ?? null);
  return Number(info.lastInsertRowid);
}

export function getLaunchTrades(launchId: string, limit = 20): LaunchTradeRow[] {
  return getDb()
    .prepare(
      "SELECT * FROM launch_trades WHERE launch_id = ? ORDER BY created_at DESC LIMIT ?",
    )
    .all(launchId, limit) as LaunchTradeRow[];
}

export function getLaunchTradeVolume(): number {
  const row = getDb()
    .prepare("SELECT COALESCE(SUM(amount * price_avg), 0) as vol FROM launch_trades")
    .get() as { vol: number };
  return row.vol;
}

// ── Session wallets ──

export interface SessionWalletRow {
  id: number;
  user_id: string;
  shield_address: string;
  session_address: string;
  session_private_key: string;
  funded_amount: number;
  active: number;
  created_at: string;
}

export function insertSessionWallet(
  userId: string,
  shieldAddress: string,
  sessionAddress: string,
  sessionPrivateKey: string,
): number {
  // Deactivate any existing session wallet for this user
  getDb()
    .prepare("UPDATE session_wallets SET active = 0 WHERE user_id = ? AND active = 1")
    .run(userId);

  const info = getDb()
    .prepare(
      `INSERT INTO session_wallets (user_id, shield_address, session_address, session_private_key)
       VALUES (?, ?, ?, ?)`,
    )
    .run(userId, shieldAddress, sessionAddress, sessionPrivateKey);
  return Number(info.lastInsertRowid);
}

export function getSessionWalletRow(userId: string): SessionWalletRow | undefined {
  return getDb()
    .prepare("SELECT * FROM session_wallets WHERE user_id = ? AND active = 1")
    .get(userId) as SessionWalletRow | undefined;
}

export function deactivateSessionWalletRow(userId: string): void {
  getDb()
    .prepare("UPDATE session_wallets SET active = 0 WHERE user_id = ? AND active = 1")
    .run(userId);
}

export function updateSessionWalletFunded(userId: string, amount: number): void {
  getDb()
    .prepare("UPDATE session_wallets SET funded_amount = ? WHERE user_id = ? AND active = 1")
    .run(amount, userId);
}
