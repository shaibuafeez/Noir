/**
 * Intent parser — two modes:
 * 1. LLM mode: POST to an OpenAI-compatible endpoint with function-calling
 * 2. Regex fallback: simple pattern matching for "buy 100 ALEO" style commands
 */

export interface TradeIntent {
  action: "buy" | "sell";
  token: string;
  amount: number;
}

export interface LimitIntent {
  action: "limit";
  side: "buy" | "sell";
  token: string;
  amount: number;
  targetPrice: number;
}

export interface PortfolioIntent {
  action: "portfolio";
}

export interface SendIntent {
  action: "send";
  amount: number;
  recipient: string;
}

export interface StackIntent {
  action: "stack";
  token: string;
  amount: number;
  interval: "hourly" | "daily" | "weekly";
}

export interface ProtectIntent {
  action: "protect";
  threshold: number;
}

export interface StatusIntent {
  action: "status";
}

export interface RebalanceIntent {
  action: "rebalance";
  allocations: Record<string, number>; // e.g. { ALEO: 60, USDC: 40 }
}

export interface GoDarkIntent {
  action: "godark";
}

export interface GoPublicIntent {
  action: "gopublic";
}

export interface AlertIntent {
  action: "alert";
  token: string;
  condition: "above" | "below" | "drops_pct" | "rises_pct";
  threshold: number;
  tradeAction?: "sell_pct" | "buy_amount";
  tradeValue?: number;
}

export interface WhyIntent {
  action: "why";
}

export interface ExportIntent {
  action: "export";
}

export interface MarketIntent {
  action: "market";
  token: string;
}

export interface TokensIntent {
  action: "tokens";
}

export type ParsedIntent =
  | TradeIntent
  | LimitIntent
  | PortfolioIntent
  | SendIntent
  | StackIntent
  | ProtectIntent
  | StatusIntent
  | RebalanceIntent
  | GoDarkIntent
  | GoPublicIntent
  | AlertIntent
  | WhyIntent
  | ExportIntent
  | MarketIntent
  | TokensIntent
  | null;

// ── Regex fallback parser ──

const BUY_RE = /\b(?:buy|long|get|acquire)\s+(\d+(?:\.\d+)?)\s+(\w+)/i;
const SELL_RE = /\b(?:sell|short|dump|exit)\s+(\d+(?:\.\d+)?)\s+(\w+)/i;
const PORTFOLIO_RE = /\b(?:portfolio|balance|holdings|positions|wallet)\b/i;
const LIMIT_RE =
  /\blimit\s+(buy|sell)\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:at|@)\s+\$?(\d+(?:\.\d+)?)/i;
const SEND_RE =
  /\b(?:send|transfer)\s+(\d+(?:\.\d+)?)\s+(?:ALEO|credits?)\s+(?:to\s+)?(aleo1[a-z0-9]{58})/i;
const STACK_RE =
  /\b(?:stack|dca)\s+(\w+)\s+\$?(\d+(?:\.\d+)?)\s*\/?\s*(hour(?:ly)?|day|daily|week(?:ly)?)/i;
const PROTECT_RE =
  /\b(?:protect|stop.?loss|guard)\s+(?:at\s+)?(\d+(?:\.\d+)?)\s*%/i;
const STATUS_RE = /\b(?:status|strategies|active)\b/i;
// "rebalance 60/40 ALEO/USDC" or "keep 60 ALEO 40 USDC"
const REBALANCE_RE =
  /\b(?:rebalance|keep|balance)\s+(\d+)\s*[/%]?\s*(\w+)\s+(\d+)\s*[/%]?\s*(\w+)/i;
const GODARK_RE = /\b(?:go\s*dark|ghost\s*mode|hide)\b/i;
const GOPUBLIC_RE = /\b(?:go\s*public|uncloak|unhide|reveal)\b/i;
// "if ALEO drops 15%, sell half" or "alert if ALEO drops 15 sell 50%"
const ALERT_SELL_RE =
  /\b(?:if|alert|when)\s+(\w+)\s+(?:drops?|falls?)\s+(\d+(?:\.\d+)?)\s*%.*?sell\s+(?:(\d+)\s*%|half|all)/i;
// "if ALEO rises 20%, notify me" or "alert ALEO rises 20%"
const ALERT_CHANGE_RE =
  /\b(?:if|alert|when)\s+(\w+)\s+(?:(drops?|falls?)|(rises?|gains?))\s+(\d+(?:\.\d+)?)\s*%/i;
// "notify me when ALEO hits $1" or "alert when ALEO above $1"
const ALERT_PRICE_RE =
  /\b(?:notify|alert|tell)\b.*?(\w+)\s+(?:hits?|reaches?|above|over)\s+\$?(\d+(?:\.\d+)?)/i;
// "alert if ALEO below $0.40"
const ALERT_BELOW_RE =
  /\b(?:notify|alert|tell)\b.*?(\w+)\s+(?:below|under)\s+\$?(\d+(?:\.\d+)?)/i;
const WHY_RE = /\b(?:why\s+did|why\s+was|explain|reasoning|why)\b/i;
const EXPORT_RE = /\b(?:export|download|csv)\s*(?:history|trades|decisions)?/i;
const MARKET_RE = /\b(?:market|analysis|analyze|indicators?|rsi|bollinger)\s+(\w+)/i;
const MARKET_SHORT_RE = /\b(?:market|analysis|indicators?)\b/i;
const TOKENS_RE = /\b(?:tokens|coins|what\s+can\s+i\s+trade|supported\s+tokens|available\s+tokens)\b/i;

export function parseWithRegex(text: string): ParsedIntent {
  // Check limit orders first (more specific)
  const limitMatch = text.match(LIMIT_RE);
  if (limitMatch) {
    return {
      action: "limit",
      side: limitMatch[1]!.toLowerCase() as "buy" | "sell",
      amount: parseFloat(limitMatch[2]!),
      token: limitMatch[3]!.toUpperCase(),
      targetPrice: parseFloat(limitMatch[4]!),
    };
  }

  const buyMatch = text.match(BUY_RE);
  if (buyMatch) {
    return {
      action: "buy",
      amount: parseFloat(buyMatch[1]!),
      token: buyMatch[2]!.toUpperCase(),
    };
  }

  const sellMatch = text.match(SELL_RE);
  if (sellMatch) {
    return {
      action: "sell",
      amount: parseFloat(sellMatch[1]!),
      token: sellMatch[2]!.toUpperCase(),
    };
  }

  if (PORTFOLIO_RE.test(text)) {
    return { action: "portfolio" };
  }

  const sendMatch = text.match(SEND_RE);
  if (sendMatch) {
    return {
      action: "send",
      amount: parseFloat(sendMatch[1]!),
      recipient: sendMatch[2]!,
    };
  }

  const stackMatch = text.match(STACK_RE);
  if (stackMatch) {
    const raw = stackMatch[3]!.toLowerCase();
    const interval: "hourly" | "daily" | "weekly" =
      raw.startsWith("hour") ? "hourly" : raw.startsWith("day") ? "daily" : "weekly";
    return {
      action: "stack",
      token: stackMatch[1]!.toUpperCase(),
      amount: parseFloat(stackMatch[2]!),
      interval,
    };
  }

  const protectMatch = text.match(PROTECT_RE);
  if (protectMatch) {
    return {
      action: "protect",
      threshold: parseFloat(protectMatch[1]!),
    };
  }

  if (STATUS_RE.test(text)) {
    return { action: "status" };
  }

  const rebalanceMatch = text.match(REBALANCE_RE);
  if (rebalanceMatch) {
    const allocations: Record<string, number> = {};
    allocations[rebalanceMatch[2]!.toUpperCase()] = parseFloat(rebalanceMatch[1]!);
    allocations[rebalanceMatch[4]!.toUpperCase()] = parseFloat(rebalanceMatch[3]!);
    return { action: "rebalance", allocations };
  }

  if (GODARK_RE.test(text)) {
    return { action: "godark" };
  }

  if (GOPUBLIC_RE.test(text)) {
    return { action: "gopublic" };
  }

  // "if ALEO drops 15%, sell half"
  const alertSellMatch = text.match(ALERT_SELL_RE);
  if (alertSellMatch) {
    const pctText = alertSellMatch[3];
    const sellPct = pctText ? parseInt(pctText, 10) : text.match(/half/i) ? 50 : 100;
    return {
      action: "alert",
      token: alertSellMatch[1]!.toUpperCase(),
      condition: "drops_pct",
      threshold: parseFloat(alertSellMatch[2]!),
      tradeAction: "sell_pct",
      tradeValue: sellPct,
    };
  }

  // "if ALEO drops/rises 20%"
  const alertChangeMatch = text.match(ALERT_CHANGE_RE);
  if (alertChangeMatch) {
    const isDrop = !!alertChangeMatch[2];
    return {
      action: "alert",
      token: alertChangeMatch[1]!.toUpperCase(),
      condition: isDrop ? "drops_pct" : "rises_pct",
      threshold: parseFloat(alertChangeMatch[4]!),
    };
  }

  // "notify me when ALEO hits $1"
  const alertPriceMatch = text.match(ALERT_PRICE_RE);
  if (alertPriceMatch) {
    return {
      action: "alert",
      token: alertPriceMatch[1]!.toUpperCase(),
      condition: "above",
      threshold: parseFloat(alertPriceMatch[2]!),
    };
  }

  // "alert if ALEO below $0.40"
  const alertBelowMatch = text.match(ALERT_BELOW_RE);
  if (alertBelowMatch) {
    return {
      action: "alert",
      token: alertBelowMatch[1]!.toUpperCase(),
      condition: "below",
      threshold: parseFloat(alertBelowMatch[2]!),
    };
  }

  if (WHY_RE.test(text)) {
    return { action: "why" };
  }

  if (EXPORT_RE.test(text)) {
    return { action: "export" };
  }

  if (TOKENS_RE.test(text)) {
    return { action: "tokens" };
  }

  const marketMatch = text.match(MARKET_RE);
  if (marketMatch) {
    return { action: "market", token: marketMatch[1]!.toUpperCase() };
  }

  if (MARKET_SHORT_RE.test(text)) {
    return { action: "market", token: "ALEO" };
  }

  return null;
}

// ── LLM-based parser ──

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "buy",
      description: "Buy a token",
      parameters: {
        type: "object",
        properties: {
          token: { type: "string", description: "Token symbol, e.g. ALEO" },
          amount: { type: "number", description: "Amount to buy" },
        },
        required: ["token", "amount"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "sell",
      description: "Sell a token",
      parameters: {
        type: "object",
        properties: {
          token: { type: "string", description: "Token symbol" },
          amount: { type: "number", description: "Amount to sell" },
        },
        required: ["token", "amount"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "portfolio",
      description: "Show portfolio / balances",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "limit_order",
      description: "Set a limit order to buy or sell at a target price",
      parameters: {
        type: "object",
        properties: {
          side: { type: "string", enum: ["buy", "sell"] },
          token: { type: "string" },
          amount: { type: "number" },
          target_price: { type: "number" },
        },
        required: ["side", "token", "amount", "target_price"],
      },
    },
  },
];

export async function parseWithLLM(
  text: string,
  llmUrl: string,
): Promise<ParsedIntent> {
  try {
    const res = await fetch(`${llmUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "local",
        messages: [
          {
            role: "system",
            content:
              "You are a trading assistant. Parse the user's message into a tool call. " +
              "If the message is not a trading command, respond normally without tool calls.",
          },
          { role: "user", content: text },
        ],
        tools: TOOLS,
        tool_choice: "auto",
      }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      choices: Array<{
        message: {
          tool_calls?: Array<{
            function: { name: string; arguments: string };
          }>;
        };
      }>;
    };

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return null;

    const fn = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;

    switch (fn) {
      case "buy":
        return {
          action: "buy",
          token: String(args.token).toUpperCase(),
          amount: Number(args.amount),
        };
      case "sell":
        return {
          action: "sell",
          token: String(args.token).toUpperCase(),
          amount: Number(args.amount),
        };
      case "portfolio":
        return { action: "portfolio" };
      case "limit_order":
        return {
          action: "limit",
          side: String(args.side) as "buy" | "sell",
          token: String(args.token).toUpperCase(),
          amount: Number(args.amount),
          targetPrice: Number(args.target_price),
        };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * Parse user message — tries LLM first, falls back to regex.
 */
export async function parseIntent(
  text: string,
  llmUrl?: string,
): Promise<ParsedIntent> {
  if (llmUrl) {
    const llmResult = await parseWithLLM(text, llmUrl);
    if (llmResult) return llmResult;
  }
  return parseWithRegex(text);
}
