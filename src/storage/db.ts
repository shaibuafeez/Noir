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
  `);

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
