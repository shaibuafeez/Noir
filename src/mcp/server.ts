/**
 * Ghost MCP Server — expose Ghost as an MCP tool provider.
 *
 * Other AI tools (Claude Code, Cursor, custom agents) can interact
 * with Ghost programmatically via MCP protocol.
 *
 * Tools: check_portfolio, execute_trade, place_limit_order, set_alert,
 *        get_reasoning, list_strategies, market_analysis
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { parseIntent } from "../agent/parser.js";
import { handleIntent, executeConfirmedTrade } from "../agent/actions.js";
import {
  getTradeHistory,
  getUserDcaStrategies,
  getUserProtections,
  getUserRebalances,
  getUserAlerts,
  getDecisionHistory,
  createAlert,
} from "../storage/db.js";
import { getPrice } from "../market/prices.js";
import { getMarketContext } from "../market/indicators.js";
import { getNetworkLabel } from "../aleo/network.js";

const MCP_USER = "mcp_agent"; // Default user for MCP sessions

export function startMcpServer(port = 3001): void {
  const mcp = new McpServer(
    { name: "ghost", version: "0.4.0" },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // ── Tool: check_portfolio ──
  mcp.tool(
    "check_portfolio",
    "Get the current portfolio holdings, balances, and recent trade history",
    { user_id: z.string().optional().describe("User/session ID (default: mcp_agent)") },
    async ({ user_id }) => {
      const uid = user_id || MCP_USER;
      const result = await handleIntent(uid, { action: "portfolio" });
      return { content: [{ type: "text", text: result.message }] };
    },
  );

  // ── Tool: execute_trade ──
  mcp.tool(
    "execute_trade",
    `Execute a private buy or sell trade on ${getNetworkLabel()}`,
    {
      action: z.enum(["buy", "sell"]).describe("Trade direction"),
      token: z.string().describe("Token symbol (e.g. ALEO)"),
      amount: z.number().positive().describe("Amount to trade"),
      user_id: z.string().optional().describe("User/session ID"),
    },
    async ({ action, token, amount, user_id }) => {
      const uid = user_id || MCP_USER;
      const price = await getPrice(token);
      const confirmData = JSON.stringify({
        type: "trade",
        action,
        token: token.toUpperCase(),
        amount,
        price,
      });

      const result = await executeConfirmedTrade(uid, confirmData);
      return { content: [{ type: "text", text: result }] };
    },
  );

  // ── Tool: place_limit_order ──
  mcp.tool(
    "place_limit_order",
    "Place a private limit order that executes when the target price is reached",
    {
      side: z.enum(["buy", "sell"]).describe("Order side"),
      token: z.string().describe("Token symbol"),
      amount: z.number().positive().describe("Amount"),
      target_price: z.number().positive().describe("Target price in USD"),
      user_id: z.string().optional(),
    },
    async ({ side, token, amount, target_price, user_id }) => {
      const uid = user_id || MCP_USER;
      const result = await handleIntent(uid, {
        action: "limit",
        side,
        token: token.toUpperCase(),
        amount,
        targetPrice: target_price,
      });
      return { content: [{ type: "text", text: result.message }] };
    },
  );

  // ── Tool: set_alert ──
  mcp.tool(
    "set_alert",
    "Set a price alert that can optionally trigger a trade",
    {
      token: z.string().describe("Token symbol"),
      condition: z.enum(["above", "below", "drops_pct", "rises_pct"]).describe("Alert condition"),
      threshold: z.number().describe("Price threshold or percentage"),
      action_type: z.enum(["notify", "sell_pct", "buy_amount"]).default("notify").describe("Action to take when triggered"),
      action_value: z.number().optional().describe("Percentage to sell or amount to buy"),
      user_id: z.string().optional(),
    },
    async ({ token, condition, threshold, action_type, action_value, user_id }) => {
      const uid = user_id || MCP_USER;
      const params = action_type === "sell_pct"
        ? { percent: action_value ?? 100 }
        : action_type === "buy_amount"
          ? { amount: action_value ?? 0 }
          : undefined;

      const id = createAlert(uid, token, condition, threshold, action_type, params);
      return {
        content: [{
          type: "text",
          text: `Alert #${id} created: ${token} ${condition} ${threshold} → ${action_type}`,
        }],
      };
    },
  );

  // ── Tool: market_analysis ──
  mcp.tool(
    "market_analysis",
    "Get market analysis with RSI, Bollinger Bands, and price changes for a token",
    { token: z.string().describe("Token symbol (e.g. ALEO)") },
    async ({ token }) => {
      const ctx = await getMarketContext(token.toUpperCase());

      let text = `Market Analysis: ${ctx.token}\n`;
      text += `Price: $${ctx.price.toFixed(4)}\n\n`;

      if (ctx.rsi) {
        text += `RSI(${ctx.rsi.periods}): ${ctx.rsi.value} — ${ctx.rsi.signal}\n`;
      } else {
        text += "RSI: Insufficient data\n";
      }

      if (ctx.bollinger) {
        text += `Bollinger Bands(${ctx.bollinger.periods}):\n`;
        text += `  Upper: $${ctx.bollinger.upper}\n`;
        text += `  Middle: $${ctx.bollinger.middle}\n`;
        text += `  Lower: $${ctx.bollinger.lower}\n`;
        text += `  Position: ${ctx.bollinger.position}\n`;
        text += `  Bandwidth: ${(ctx.bollinger.bandwidth * 100).toFixed(2)}%\n`;
      }

      if (ctx.change1h) {
        const dir = ctx.change1h.changePercent >= 0 ? "+" : "";
        text += `\n1h Change: ${dir}${ctx.change1h.changePercent}%\n`;
      }

      if (ctx.change24h) {
        const dir = ctx.change24h.changePercent >= 0 ? "+" : "";
        text += `24h Change: ${dir}${ctx.change24h.changePercent}%\n`;
      }

      return { content: [{ type: "text", text }] };
    },
  );

  // ── Tool: list_strategies ──
  mcp.tool(
    "list_strategies",
    "List all active strategies (DCA, protection, rebalance, alerts)",
    { user_id: z.string().optional() },
    async ({ user_id }) => {
      const uid = user_id || MCP_USER;
      const dcas = getUserDcaStrategies(uid);
      const prots = getUserProtections(uid);
      const rebals = getUserRebalances(uid);
      const alerts = getUserAlerts(uid);

      let text = "Active Strategies:\n\n";

      if (dcas.length > 0) {
        text += "DCA:\n";
        for (const d of dcas) text += `  #${d.id}: $${d.amount} ${d.token} ${d.interval}\n`;
      }

      if (prots.length > 0) {
        text += "\nProtection:\n";
        for (const p of prots) text += `  #${p.id}: ${p.threshold}% drawdown\n`;
      }

      if (rebals.length > 0) {
        text += "\nRebalance:\n";
        for (const r of rebals) {
          const alloc = JSON.parse(r.allocations) as Record<string, number>;
          text += `  #${r.id}: ${Object.entries(alloc).map(([t, p]) => `${p}% ${t}`).join(" / ")}\n`;
        }
      }

      if (alerts.length > 0) {
        text += "\nAlerts:\n";
        for (const a of alerts) {
          text += `  #${a.id}: ${a.token} ${a.condition} ${a.threshold} → ${a.action_type}\n`;
        }
      }

      if (dcas.length === 0 && prots.length === 0 && rebals.length === 0 && alerts.length === 0) {
        text += "No active strategies.";
      }

      return { content: [{ type: "text", text }] };
    },
  );

  // ── Tool: get_reasoning ──
  mcp.tool(
    "get_reasoning",
    "Get the agent's decision history — why it made certain trades or actions",
    {
      user_id: z.string().optional(),
      limit: z.number().optional().default(10).describe("Number of recent decisions to return"),
    },
    async ({ user_id, limit }) => {
      const uid = user_id || MCP_USER;
      const decisions = getDecisionHistory(uid, limit);

      if (decisions.length === 0) {
        return { content: [{ type: "text", text: "No decision history yet." }] };
      }

      let text = "Agent Decision Log:\n\n";
      for (const d of decisions) {
        text += `[${d.timestamp}] ${d.parsed_action}\n`;
        if (d.user_message) text += `  User: "${d.user_message}"\n`;
        if (d.market_context) text += `  Market: ${d.market_context}\n`;
        text += `  Reasoning: ${d.reasoning}\n`;
        text += `  Result: ${d.decision}\n`;
        if (d.tx_hash) text += `  Tx: ${d.tx_hash}\n`;
        text += "\n";
      }

      return { content: [{ type: "text", text }] };
    },
  );

  // ── Tool: natural_language ──
  mcp.tool(
    "natural_language",
    "Send a natural language command to Ghost (e.g. 'buy 100 ALEO', 'stack ALEO $50/week')",
    {
      command: z.string().describe("Natural language command"),
      user_id: z.string().optional(),
    },
    async ({ command, user_id }) => {
      const uid = user_id || MCP_USER;
      const parseResult = await parseIntent(command, { sessionId: uid });

      if (!parseResult) {
        return { content: [{ type: "text", text: "Could not parse command." }] };
      }

      if (parseResult.type === "conversation") {
        return { content: [{ type: "text", text: parseResult.message }] };
      }

      const result = await handleIntent(uid, parseResult.intent);

      if (result.needsConfirmation && result.confirmData) {
        // Auto-confirm for MCP (programmatic access = pre-authorized)
        const execResult = await executeConfirmedTrade(uid, result.confirmData);
        return {
          content: [{ type: "text", text: `${result.message}\n\n[Auto-confirmed]\n${execResult}` }],
        };
      }

      return { content: [{ type: "text", text: result.message }] };
    },
  );

  // ── HTTP Server with session management ──

  const transports = new Map<string, StreamableHTTPServerTransport>();

  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.url !== "/mcp") {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    // Handle session-based transport
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (req.method === "POST") {
      // Check for existing session
      if (sessionId && transports.has(sessionId)) {
        const transport = transports.get(sessionId)!;
        await transport.handleRequest(req, res);
        return;
      }

      // New session
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid) transports.delete(sid);
      };

      await mcp.connect(transport);

      if (transport.sessionId) {
        transports.set(transport.sessionId, transport);
      }

      await transport.handleRequest(req, res);
    } else if (req.method === "GET") {
      // SSE stream for notifications
      if (sessionId && transports.has(sessionId)) {
        const transport = transports.get(sessionId)!;
        await transport.handleRequest(req, res);
      } else {
        res.writeHead(400);
        res.end("Missing or invalid session");
      }
    } else if (req.method === "DELETE") {
      // Session cleanup
      if (sessionId && transports.has(sessionId)) {
        const transport = transports.get(sessionId)!;
        await transport.handleRequest(req, res);
        transports.delete(sessionId);
      } else {
        res.writeHead(404);
        res.end("Session not found");
      }
    } else {
      res.writeHead(405);
      res.end("Method not allowed");
    }
  });

  httpServer.listen(port, () => {
    console.log(`[mcp] Ghost MCP server at http://localhost:${port}/mcp`);
  });
}
