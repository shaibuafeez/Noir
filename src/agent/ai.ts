/**
 * Claude API integration for natural language intent parsing.
 * Uses Anthropic's tool/function calling to map user messages to one of
 * 21 trading intents, or returns a conversational response for non-command
 * messages.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { ParsedIntent } from "./parser.js";

// ── Types ──

export interface AgentContext {
  sessionId: string;
  walletAddress?: string | null;
  sessionType?: "telegram" | "web" | "oauth";
  hasSessionWallet?: boolean;
}

export type AiResult =
  | { type: "tool"; intent: ParsedIntent }
  | { type: "conversation"; message: string };

// ── Client (lazy singleton) ──

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  }
  return client;
}

// ── System prompt ──

function buildSystemPrompt(ctx: AgentContext): string {
  const lines = [
    "You are Ghost, a private AI trading agent on the Aleo blockchain.",
    "You help users trade tokens, manage strategies, and interact with the Aleo privacy ecosystem.",
    "",
    "Capabilities:",
    "- Buy/sell tokens with private ZK proofs",
    "- Set limit orders, DCA (dollar-cost average), and stop-loss protection",
    "- Price alerts with automatic trade execution",
    "- Copy trading (mirror another trader privately)",
    "- Launchpad: create/buy/sell meme coins on a bonding curve",
    "- Privacy mode: go dark (move credits to private records) or go public",
    "- Portfolio viewing, market analysis (RSI, Bollinger Bands)",
    "- Export trade history",
    "",
    "When the user wants to perform an action, use the appropriate tool.",
    "When the user asks a question or chats conversationally, respond helpfully in plain text.",
    "Keep responses concise and focused.",
    "",
    `User session: ${ctx.sessionId}`,
  ];
  if (ctx.walletAddress) {
    lines.push(`Wallet: ${ctx.walletAddress}`);
  }
  if (ctx.hasSessionWallet) {
    lines.push("Session wallet: active (AI can trade autonomously)");
  }
  return lines.join("\n");
}

// ── Tool definitions ──

const TOOLS: Anthropic.Tool[] = [
  {
    name: "trade_buy",
    description: "Buy a token on Aleo",
    input_schema: {
      type: "object" as const,
      properties: {
        token: { type: "string", description: "Token symbol, e.g. ALEO" },
        amount: { type: "number", description: "Amount to buy" },
      },
      required: ["token", "amount"],
    },
  },
  {
    name: "trade_sell",
    description: "Sell a token on Aleo",
    input_schema: {
      type: "object" as const,
      properties: {
        token: { type: "string", description: "Token symbol" },
        amount: { type: "number", description: "Amount to sell" },
      },
      required: ["token", "amount"],
    },
  },
  {
    name: "view_portfolio",
    description: "Show the user's portfolio, balances, and holdings",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "set_limit_order",
    description: "Set a limit order to buy or sell at a target price",
    input_schema: {
      type: "object" as const,
      properties: {
        side: { type: "string", enum: ["buy", "sell"], description: "Buy or sell" },
        token: { type: "string", description: "Token symbol" },
        amount: { type: "number", description: "Amount" },
        target_price: { type: "number", description: "Target price in USD" },
      },
      required: ["side", "token", "amount", "target_price"],
    },
  },
  {
    name: "send_credits",
    description: "Send/transfer Aleo credits to another address",
    input_schema: {
      type: "object" as const,
      properties: {
        amount: { type: "number", description: "Amount of ALEO to send" },
        recipient: { type: "string", description: "Aleo address (aleo1...)" },
      },
      required: ["amount", "recipient"],
    },
  },
  {
    name: "setup_dca",
    description: "Set up dollar-cost averaging (DCA) — recurring buys of a token",
    input_schema: {
      type: "object" as const,
      properties: {
        token: { type: "string", description: "Token symbol" },
        amount: { type: "number", description: "Amount per buy in USD" },
        interval: { type: "string", enum: ["hourly", "daily", "weekly"], description: "Buy frequency" },
      },
      required: ["token", "amount", "interval"],
    },
  },
  {
    name: "set_protection",
    description: "Set stop-loss protection — auto-sell if portfolio drops by a percentage",
    input_schema: {
      type: "object" as const,
      properties: {
        threshold_percent: { type: "number", description: "Percentage drop to trigger sell" },
      },
      required: ["threshold_percent"],
    },
  },
  {
    name: "view_status",
    description: "View all active strategies (DCA, limits, alerts, protection, copy trading)",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "set_rebalance",
    description: "Set up automatic portfolio rebalancing with target allocations",
    input_schema: {
      type: "object" as const,
      properties: {
        allocations: {
          type: "object",
          description: "Token-to-percentage map, e.g. { \"ALEO\": 60, \"USDC\": 40 }. Must sum to 100.",
          additionalProperties: { type: "number" },
        },
      },
      required: ["allocations"],
    },
  },
  {
    name: "go_dark",
    description: "Activate ghost/privacy mode — move all public credits to private records",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "go_public",
    description: "Deactivate ghost mode — move private records back to public",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "set_alert",
    description: "Set a price alert with optional automatic trade action",
    input_schema: {
      type: "object" as const,
      properties: {
        token: { type: "string", description: "Token symbol" },
        condition: {
          type: "string",
          enum: ["above", "below", "drops_pct", "rises_pct"],
          description: "Alert condition type",
        },
        threshold: { type: "number", description: "Price level or percentage" },
        trade_action: {
          type: "string",
          enum: ["sell_pct", "buy_amount"],
          description: "Optional: auto-trade when triggered",
        },
        trade_value: { type: "number", description: "Percent to sell or amount to buy" },
      },
      required: ["token", "condition", "threshold"],
    },
  },
  {
    name: "explain_decisions",
    description: "Explain recent AI decisions and trade reasoning",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "export_history",
    description: "Export trade history and decisions as CSV",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "view_market",
    description: "View market analysis for a token (price, RSI, Bollinger Bands)",
    input_schema: {
      type: "object" as const,
      properties: {
        token: { type: "string", description: "Token symbol (defaults to ALEO)" },
      },
      required: ["token"],
    },
  },
  {
    name: "list_tokens",
    description: "List all available/tradable tokens and their prices",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "copy_trader",
    description: "Start copy trading — mirror another trader's trades privately",
    input_schema: {
      type: "object" as const,
      properties: {
        leader: { type: "string", description: "Username or ID of the trader to copy" },
      },
      required: ["leader"],
    },
  },
  {
    name: "stop_copy",
    description: "Stop copy trading a specific trader or all traders",
    input_schema: {
      type: "object" as const,
      properties: {
        leader: { type: "string", description: "Trader to stop copying (omit to stop all)" },
      },
    },
  },
  {
    name: "list_copies",
    description: "List all active copy trading strategies",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "create_launch",
    description: "Create a new meme coin on the launchpad bonding curve",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Token name" },
        ticker: { type: "string", description: "Token ticker (1-6 uppercase letters)" },
        description: { type: "string", description: "Token description" },
      },
      required: ["name", "ticker", "description"],
    },
  },
  {
    name: "buy_launch_token",
    description: "Buy tokens from a launchpad coin",
    input_schema: {
      type: "object" as const,
      properties: {
        ticker: { type: "string", description: "Launch token ticker" },
        amount: { type: "number", description: "Amount of tokens to buy" },
      },
      required: ["ticker", "amount"],
    },
  },
  {
    name: "sell_launch_token",
    description: "Sell tokens from a launchpad coin",
    input_schema: {
      type: "object" as const,
      properties: {
        ticker: { type: "string", description: "Launch token ticker" },
        amount: { type: "number", description: "Amount of tokens to sell" },
      },
      required: ["ticker", "amount"],
    },
  },
  {
    name: "list_launches",
    description: "List all active launchpad coins",
    input_schema: { type: "object" as const, properties: {} },
  },
];

// ── Tool result → ParsedIntent mapping ──

export function mapToolToIntent(
  name: string,
  input: Record<string, unknown>,
): ParsedIntent {
  switch (name) {
    case "trade_buy":
      return {
        action: "buy",
        token: String(input.token).toUpperCase(),
        amount: Number(input.amount),
      };
    case "trade_sell":
      return {
        action: "sell",
        token: String(input.token).toUpperCase(),
        amount: Number(input.amount),
      };
    case "view_portfolio":
      return { action: "portfolio" };
    case "set_limit_order":
      return {
        action: "limit",
        side: String(input.side) as "buy" | "sell",
        token: String(input.token).toUpperCase(),
        amount: Number(input.amount),
        targetPrice: Number(input.target_price),
      };
    case "send_credits":
      return {
        action: "send",
        amount: Number(input.amount),
        recipient: String(input.recipient),
      };
    case "setup_dca":
      return {
        action: "stack",
        token: String(input.token).toUpperCase(),
        amount: Number(input.amount),
        interval: String(input.interval) as "hourly" | "daily" | "weekly",
      };
    case "set_protection":
      return {
        action: "protect",
        threshold: Number(input.threshold_percent),
      };
    case "view_status":
      return { action: "status" };
    case "set_rebalance":
      return {
        action: "rebalance",
        allocations: input.allocations as Record<string, number>,
      };
    case "go_dark":
      return { action: "godark" };
    case "go_public":
      return { action: "gopublic" };
    case "set_alert":
      return {
        action: "alert",
        token: String(input.token).toUpperCase(),
        condition: String(input.condition) as "above" | "below" | "drops_pct" | "rises_pct",
        threshold: Number(input.threshold),
        tradeAction: input.trade_action
          ? (String(input.trade_action) as "sell_pct" | "buy_amount")
          : undefined,
        tradeValue: input.trade_value ? Number(input.trade_value) : undefined,
      };
    case "explain_decisions":
      return { action: "why" };
    case "export_history":
      return { action: "export" };
    case "view_market":
      return {
        action: "market",
        token: input.token ? String(input.token).toUpperCase() : "ALEO",
      };
    case "list_tokens":
      return { action: "tokens" };
    case "copy_trader":
      return { action: "copy", leader: String(input.leader) };
    case "stop_copy":
      return {
        action: "stopcopy",
        leader: input.leader ? String(input.leader) : undefined,
      };
    case "list_copies":
      return { action: "copies" };
    case "create_launch":
      return {
        action: "launch",
        name: String(input.name),
        ticker: String(input.ticker).toUpperCase(),
        description: String(input.description ?? ""),
      };
    case "buy_launch_token":
      return {
        action: "launchbuy",
        ticker: String(input.ticker).toUpperCase(),
        amount: Number(input.amount),
      };
    case "sell_launch_token":
      return {
        action: "launchsell",
        ticker: String(input.ticker).toUpperCase(),
        amount: Number(input.amount),
      };
    case "list_launches":
      return { action: "launchlist" };
    default:
      return null;
  }
}

// ── Main entry point (Claude) ──

export async function callClaude(
  text: string,
  context: AgentContext,
): Promise<AiResult | null> {
  try {
    const response = await getClient().messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: buildSystemPrompt(context),
      tools: TOOLS,
      messages: [{ role: "user", content: text }],
    });

    // Check for tool use first
    for (const block of response.content) {
      if (block.type === "tool_use") {
        const intent = mapToolToIntent(
          block.name,
          block.input as Record<string, unknown>,
        );
        if (intent) {
          return { type: "tool", intent };
        }
      }
    }

    // Otherwise, extract text response
    for (const block of response.content) {
      if (block.type === "text" && block.text.trim()) {
        return { type: "conversation", message: block.text.trim() };
      }
    }

    return null;
  } catch (err) {
    console.error("[ai] Claude API error:", err instanceof Error ? err.message : err);
    return null;
  }
}

// ── Gemini text chat (function calling via REST API) ──

function stripUnsupportedFields(obj: any): any {
  if (typeof obj !== "object" || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(stripUnsupportedFields);
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === "additionalProperties") continue;
    result[key] = stripUnsupportedFields(value);
  }
  return result;
}

function buildGeminiTools(): object[] {
  return TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: stripUnsupportedFields(t.input_schema),
  }));
}

export async function callGemini(
  text: string,
  context: AgentContext,
): Promise<AiResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const body = {
      system_instruction: {
        parts: [{ text: buildSystemPrompt(context) }],
      },
      contents: [{ role: "user", parts: [{ text }] }],
      tools: [{ function_declarations: buildGeminiTools() }],
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error("[ai] Gemini API error:", res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
            functionCall?: { name: string; args: Record<string, unknown> };
          }>;
        };
      }>;
    };

    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts) return null;

    // Check for function call first
    for (const part of parts) {
      if (part.functionCall) {
        const intent = mapToolToIntent(part.functionCall.name, part.functionCall.args);
        if (intent) return { type: "tool", intent };
      }
    }

    // Otherwise, extract text response
    for (const part of parts) {
      if (part.text?.trim()) {
        return { type: "conversation", message: part.text.trim() };
      }
    }

    return null;
  } catch (err) {
    console.error("[ai] Gemini API error:", err instanceof Error ? err.message : err);
    return null;
  }
}
