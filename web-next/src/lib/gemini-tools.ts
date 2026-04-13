/**
 * Gemini Live API tool definitions for Noir voice agent.
 * Tool names match the Anthropic tool names exactly so mapToolToIntent()
 * works without changes.
 */

import type { FunctionDeclaration, Type } from "@google/genai";

const S = "STRING" as Type;
const N = "NUMBER" as Type;
const O = "OBJECT" as Type;

export const NOIR_VOICE_TOOLS: FunctionDeclaration[] = [
  {
    name: "trade_buy",
    description: "Buy a token on Aleo",
    parameters: {
      type: O,
      properties: {
        token: { type: S, description: "Token symbol, e.g. ALEO" },
        amount: { type: N, description: "Amount to buy" },
      },
      required: ["token", "amount"],
    },
  },
  {
    name: "trade_sell",
    description: "Sell a token on Aleo",
    parameters: {
      type: O,
      properties: {
        token: { type: S, description: "Token symbol" },
        amount: { type: N, description: "Amount to sell" },
      },
      required: ["token", "amount"],
    },
  },
  {
    name: "view_portfolio",
    description: "Show the user's portfolio, balances, and holdings",
    parameters: { type: O, properties: {} },
  },
  {
    name: "set_limit_order",
    description: "Set a limit order to buy or sell at a target price",
    parameters: {
      type: O,
      properties: {
        side: { type: S, description: "buy or sell" },
        token: { type: S, description: "Token symbol" },
        amount: { type: N, description: "Amount" },
        target_price: { type: N, description: "Target price in USD" },
      },
      required: ["side", "token", "amount", "target_price"],
    },
  },
  {
    name: "send_credits",
    description: "Send/transfer Aleo credits to another address",
    parameters: {
      type: O,
      properties: {
        amount: { type: N, description: "Amount of ALEO to send" },
        recipient: { type: S, description: "Aleo address (aleo1...)" },
      },
      required: ["amount", "recipient"],
    },
  },
  {
    name: "setup_dca",
    description: "Set up dollar-cost averaging — recurring buys of a token",
    parameters: {
      type: O,
      properties: {
        token: { type: S, description: "Token symbol" },
        amount: { type: N, description: "Amount per buy in USD" },
        interval: { type: S, description: "Buy frequency: hourly, daily, or weekly" },
      },
      required: ["token", "amount", "interval"],
    },
  },
  {
    name: "set_protection",
    description: "Set stop-loss protection — auto-sell if portfolio drops by a percentage",
    parameters: {
      type: O,
      properties: {
        threshold_percent: { type: N, description: "Percentage drop to trigger sell" },
      },
      required: ["threshold_percent"],
    },
  },
  {
    name: "view_status",
    description: "View all active strategies (DCA, limits, alerts, protection, copy trading)",
    parameters: { type: O, properties: {} },
  },
  {
    name: "set_rebalance",
    description: "Set up automatic portfolio rebalancing with target allocations",
    parameters: {
      type: O,
      properties: {
        allocations: {
          type: O,
          description: "Token to percentage map, e.g. ALEO 60, USDC 40. Must sum to 100.",
        },
      },
      required: ["allocations"],
    },
  },
  {
    name: "go_dark",
    description: "Activate ghost/privacy mode — move all public credits to private records",
    parameters: { type: O, properties: {} },
  },
  {
    name: "go_public",
    description: "Deactivate ghost mode — move private records back to public",
    parameters: { type: O, properties: {} },
  },
  {
    name: "set_alert",
    description: "Set a price alert with optional automatic trade action",
    parameters: {
      type: O,
      properties: {
        token: { type: S, description: "Token symbol" },
        condition: { type: S, description: "Alert condition: above, below, drops_pct, or rises_pct" },
        threshold: { type: N, description: "Price level or percentage" },
        trade_action: { type: S, description: "Optional: sell_pct or buy_amount" },
        trade_value: { type: N, description: "Percent to sell or amount to buy" },
      },
      required: ["token", "condition", "threshold"],
    },
  },
  {
    name: "explain_decisions",
    description: "Explain recent AI decisions and trade reasoning",
    parameters: { type: O, properties: {} },
  },
  {
    name: "export_history",
    description: "Export trade history and decisions as CSV",
    parameters: { type: O, properties: {} },
  },
  {
    name: "view_market",
    description: "View market analysis for a token — price, RSI, Bollinger Bands",
    parameters: {
      type: O,
      properties: {
        token: { type: S, description: "Token symbol, defaults to ALEO" },
      },
      required: ["token"],
    },
  },
  {
    name: "list_tokens",
    description: "List all available/tradable tokens and their prices",
    parameters: { type: O, properties: {} },
  },
  {
    name: "copy_trader",
    description: "Start copy trading — mirror another trader's trades privately",
    parameters: {
      type: O,
      properties: {
        leader: { type: S, description: "Username or ID of the trader to copy" },
      },
      required: ["leader"],
    },
  },
  {
    name: "stop_copy",
    description: "Stop copy trading a specific trader or all traders",
    parameters: {
      type: O,
      properties: {
        leader: { type: S, description: "Trader to stop copying, omit to stop all" },
      },
    },
  },
  {
    name: "list_copies",
    description: "List all active copy trading strategies",
    parameters: { type: O, properties: {} },
  },
  {
    name: "create_launch",
    description: "Create a new meme coin on the launchpad bonding curve",
    parameters: {
      type: O,
      properties: {
        name: { type: S, description: "Token name" },
        ticker: { type: S, description: "Token ticker, 1-6 uppercase letters" },
        description: { type: S, description: "Token description" },
      },
      required: ["name", "ticker", "description"],
    },
  },
  {
    name: "buy_launch_token",
    description: "Buy tokens from a launchpad coin",
    parameters: {
      type: O,
      properties: {
        ticker: { type: S, description: "Launch token ticker" },
        amount: { type: N, description: "Amount of tokens to buy" },
      },
      required: ["ticker", "amount"],
    },
  },
  {
    name: "sell_launch_token",
    description: "Sell tokens from a launchpad coin",
    parameters: {
      type: O,
      properties: {
        ticker: { type: S, description: "Launch token ticker" },
        amount: { type: N, description: "Amount of tokens to sell" },
      },
      required: ["ticker", "amount"],
    },
  },
  {
    name: "list_launches",
    description: "List all active launchpad coins",
    parameters: { type: O, properties: {} },
  },
];

export const NOIR_SYSTEM_INSTRUCTION = `You are Noir, a private AI voice agent on the Aleo blockchain.
You help users trade tokens, manage strategies, and interact with the Aleo privacy ecosystem — all by voice.

Pronunciation rules:
- ALEO is pronounced "ah-LEE-oh"
- DCA is spelled out: "D-C-A"
- RSI is spelled out: "R-S-I"
- Always say dollar amounts naturally: "$1,500" becomes "fifteen hundred dollars"
- Read token amounts naturally: "100 ALEO" becomes "one hundred ah-lee-oh"

Behavior:
- Keep responses concise — 1-2 sentences max for confirmations
- For buy/sell actions, always confirm the amount and token before executing
- If the user says "go dark" or "ghost mode", activate privacy mode
- If the user says "show portfolio" or "what do I have", view portfolio
- When quoting numbers, round to 2 decimal places
- Sound confident and professional, like a trading floor assistant

Capabilities:
- Buy/sell tokens privately with ZK proofs
- Limit orders, DCA, stop-loss protection
- Price alerts with auto-trade triggers
- Copy trading (mirror traders privately)
- Launchpad: create/buy/sell meme coins
- Privacy mode: go dark (private) or go public
- Portfolio, market analysis (RSI, Bollinger)
- Export trade history`;
