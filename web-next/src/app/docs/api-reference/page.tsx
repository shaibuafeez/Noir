"use client";

import { CodeBlock, InlineCode } from "@/components/docs/code-block";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function Endpoint({
  method,
  path,
  description,
}: {
  method: "GET" | "POST";
  path: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-card/20 p-4">
      <div className="flex items-start gap-3">
        <Badge
          variant={method === "GET" ? "success" : "default"}
          className="mt-0.5 shrink-0 font-mono text-[11px]"
        >
          {method}
        </Badge>
        <div>
          <code className="font-mono text-sm text-foreground/90">{path}</code>
          <p className="mt-1 text-sm text-foreground/80 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function ApiReferencePage() {
  return (
    <div>
      {/* ── Header ── */}
      <section>
        <Badge variant="default" className="mb-4">
          Reference
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight">
          API Reference
        </h1>
        <p className="mt-2 text-foreground/80 leading-relaxed">
          REST and WebSocket APIs for the Noir backend.
        </p>
      </section>

      {/* ── Base URL ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">Base URL</h2>
        <p className="text-foreground/80 leading-relaxed">
          In development the backend runs at{" "}
          <InlineCode>http://localhost:3000</InlineCode>. The production URL is
          configurable via environment variables.
        </p>
        <p className="mt-3 text-foreground/80 leading-relaxed">
          All endpoints return a consistent envelope:
        </p>
        <CodeBlock
          language="json"
          code={`// Success
{ "ok": true, "data": { ... } }

// Error
{ "ok": false, "error": "Human-readable message" }`}
        />
      </section>

      {/* ── Authentication ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">Authentication</h2>
        <p className="text-foreground/80 leading-relaxed">
          Every authenticated endpoint accepts a{" "}
          <InlineCode>sessionId</InlineCode> query parameter. Session IDs come
          in three flavours:
        </p>
        <ul className="mt-3 list-disc list-inside space-y-2 text-foreground/80 leading-relaxed">
          <li>
            <strong className="text-foreground">Web ephemeral</strong> &mdash;{" "}
            <InlineCode>web_xxx</InlineCode> (generated on first visit)
          </li>
          <li>
            <strong className="text-foreground">OAuth</strong> &mdash;{" "}
            <InlineCode>oauth_google_xxx</InlineCode> (Google sign-in via
            zkLogin)
          </li>
          <li>
            <strong className="text-foreground">Telegram</strong> &mdash;
            numeric Telegram user ID
          </li>
        </ul>
        <CodeBlock
          language="bash"
          className="mt-4"
          code={`curl "http://localhost:3000/api/session?sessionId=web_abc123"`}
        />
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  REST Endpoints                                              */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">REST Endpoints</h2>

        {/* ── Portfolio & Balance ── */}
        <h3 className="text-lg font-semibold mt-8 mb-3">
          Portfolio &amp; Balance
        </h3>
        <div className="space-y-3">
          <Endpoint
            method="GET"
            path="/api/session?sessionId=x"
            description="Get session info including wallet address and hasWallet flag."
          />
          <Endpoint
            method="GET"
            path="/api/holdings?sessionId=x"
            description="Portfolio summary: totalValue, change24h, holdings array, and portfolioSeries for charting."
          />
          <Endpoint
            method="GET"
            path="/api/balance?sessionId=x"
            description="ALEO balance via on-chain read from credits.aleo."
          />
          <Endpoint
            method="GET"
            path="/api/balance/usdcx?sessionId=x"
            description="USDCx stablecoin balance."
          />
        </div>

        <CodeBlock
          language="bash"
          className="mt-4"
          code={`curl "http://localhost:3000/api/holdings?sessionId=web_abc123"`}
        />
        <CodeBlock
          language="json"
          className="mt-2"
          code={`{
  "ok": true,
  "data": {
    "totalValue": 4820.50,
    "change24h": 3.12,
    "holdings": [
      { "token": "ALEO", "amount": 1200, "value": 3600 },
      { "token": "USDCx", "amount": 1220.50, "value": 1220.50 }
    ],
    "portfolioSeries": [
      { "ts": 1712880000, "value": 4650 },
      { "ts": 1712883600, "value": 4720 }
    ]
  }
}`}
        />

        {/* ── Trading ── */}
        <h3 className="text-lg font-semibold mt-10 mb-3">Trading</h3>
        <div className="space-y-3">
          <Endpoint
            method="GET"
            path="/api/trades?sessionId=x"
            description="Full trade history for the session."
          />
          <Endpoint
            method="GET"
            path="/api/strategies?sessionId=x"
            description="All active strategies: DCA, limit orders, price alerts, protection stops, rebalance rules, and copy-trade configs."
          />
          <Endpoint
            method="GET"
            path="/api/decisions?sessionId=x"
            description="AI decision reasoning log (last 50 entries)."
          />
        </div>

        <CodeBlock
          language="bash"
          className="mt-4"
          code={`curl "http://localhost:3000/api/trades?sessionId=web_abc123"`}
        />
        <CodeBlock
          language="json"
          className="mt-2"
          code={`{
  "ok": true,
  "data": [
    {
      "id": 42,
      "token": "ALEO",
      "side": "buy",
      "amount": 100,
      "price": 3.05,
      "timestamp": "2026-04-12T14:32:00Z"
    }
  ]
}`}
        />

        {/* ── Market ── */}
        <h3 className="text-lg font-semibold mt-10 mb-3">Market</h3>
        <div className="space-y-3">
          <Endpoint
            method="GET"
            path="/api/market"
            description="All token prices with RSI, Bollinger bands, 24h and 1h change. Powered by Pyth oracle."
          />
          <Endpoint
            method="GET"
            path="/api/market/history?token=ALEO&limit=48"
            description="Price history for charting. Accepts token name and optional limit (default 48)."
          />
        </div>

        <CodeBlock
          language="bash"
          className="mt-4"
          code={`curl "http://localhost:3000/api/market"`}
        />
        <CodeBlock
          language="json"
          className="mt-2"
          code={`{
  "ok": true,
  "data": [
    {
      "token": "ALEO",
      "price": 3.05,
      "change24h": 2.4,
      "change1h": 0.3,
      "rsi": 58.2,
      "bollingerUpper": 3.20,
      "bollingerLower": 2.90
    }
  ]
}`}
        />

        {/* ── Launchpad ── */}
        <h3 className="text-lg font-semibold mt-10 mb-3">Launchpad</h3>
        <div className="space-y-3">
          <Endpoint
            method="GET"
            path="/api/launches"
            description="List all launches with on-chain stats (supply sold, graduated flag, market cap)."
          />
          <Endpoint
            method="POST"
            path="/api/launches?sessionId=x"
            description="Create a new meme-coin launch. Body: { name, ticker, description }."
          />
          <Endpoint
            method="GET"
            path="/api/launches/:id"
            description="Launch detail: supply, current price, market cap, and recent trades."
          />
          <Endpoint
            method="POST"
            path="/api/launches/:id/trade?sessionId=x"
            description="Buy or sell tokens on the bonding curve. Body: { side, amount }."
          />
        </div>

        <CodeBlock
          language="bash"
          className="mt-4"
          code={`# Create a new launch
curl -X POST "http://localhost:3000/api/launches?sessionId=web_abc123" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Moon Dog","ticker":"MDOG","description":"To the moon"}'`}
        />
        <CodeBlock
          language="json"
          className="mt-2"
          code={`{
  "ok": true,
  "data": {
    "id": 7,
    "name": "Moon Dog",
    "ticker": "MDOG",
    "description": "To the moon",
    "supply_sold": 0,
    "graduated": false,
    "price": 1.0,
    "marketCap": 0
  }
}`}
        />

        <CodeBlock
          language="bash"
          className="mt-4"
          code={`# Buy tokens on the bonding curve
curl -X POST "http://localhost:3000/api/launches/7/trade?sessionId=web_abc123" \\
  -H "Content-Type: application/json" \\
  -d '{"side":"buy","amount":500}'`}
        />
        <CodeBlock
          language="json"
          className="mt-2"
          code={`{
  "ok": true,
  "data": {
    "side": "buy",
    "amount": 500,
    "price": 1.25,
    "totalCost": 625.0
  }
}`}
        />

        {/* ── Privacy ── */}
        <h3 className="text-lg font-semibold mt-10 mb-3">Privacy</h3>
        <div className="space-y-3">
          <Endpoint
            method="GET"
            path="/api/privacy/summary?sessionId=x"
            description="Privacy score, category breakdown, deployed contracts, and proof capabilities."
          />
        </div>

        <CodeBlock
          language="bash"
          className="mt-4"
          code={`curl "http://localhost:3000/api/privacy/summary?sessionId=web_abc123"`}
        />
        <CodeBlock
          language="json"
          className="mt-2"
          code={`{
  "ok": true,
  "data": {
    "score": 92,
    "breakdown": {
      "encryption": 100,
      "proofs": 85,
      "contracts": 90
    },
    "contracts": ["ghost_trade_v3.aleo", "ghost_zklogin_v2.aleo"],
    "proofCapabilities": ["trade_proof", "balance_proof", "identity_proof"]
  }
}`}
        />

        {/* ── Session Wallet ── */}
        <h3 className="text-lg font-semibold mt-10 mb-3">Session Wallet</h3>
        <div className="space-y-3">
          <Endpoint
            method="GET"
            path="/api/session-wallet?sessionId=x"
            description="Get session wallet info (address, balance, linked Shield address)."
          />
          <Endpoint
            method="POST"
            path="/api/session-wallet?sessionId=x"
            description="Create a session wallet linked to your Shield Wallet. Body: { shieldAddress }."
          />
          <Endpoint
            method="POST"
            path="/api/session-wallet/reclaim?sessionId=x"
            description="Reclaim all funds from the session wallet back to the Shield Wallet."
          />
        </div>

        <CodeBlock
          language="bash"
          className="mt-4"
          code={`# Create a session wallet
curl -X POST "http://localhost:3000/api/session-wallet?sessionId=web_abc123" \\
  -H "Content-Type: application/json" \\
  -d '{"shieldAddress":"aleo1q6q..."}'`}
        />
        <CodeBlock
          language="json"
          className="mt-2"
          code={`{
  "ok": true,
  "data": {
    "address": "aleo1xyz...",
    "shieldAddress": "aleo1q6q...",
    "balance": 0
  }
}`}
        />

        {/* ── Other ── */}
        <h3 className="text-lg font-semibold mt-10 mb-3">Other</h3>
        <div className="space-y-3">
          <Endpoint
            method="GET"
            path="/api/tokens"
            description="List of all tradable tokens with metadata."
          />
          <Endpoint
            method="GET"
            path="/api/gemini/config"
            description="Gemini API configuration for the voice agent (API key delivered to frontend)."
          />
        </div>

        <CodeBlock
          language="bash"
          className="mt-4"
          code={`curl "http://localhost:3000/api/tokens"`}
        />
        <CodeBlock
          language="json"
          className="mt-2"
          code={`{
  "ok": true,
  "data": [
    { "symbol": "ALEO", "name": "Aleo", "decimals": 6 },
    { "symbol": "USDCx", "name": "USDCx Stablecoin", "decimals": 6 }
  ]
}`}
        />
      </section>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  WebSocket API                                               */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">WebSocket API</h2>
        <p className="text-foreground/80 leading-relaxed">
          Connect to <InlineCode>ws://localhost:3000</InlineCode> for real-time
          communication with the AI agent. All messages are JSON with a{" "}
          <InlineCode>type</InlineCode> field.
        </p>

        {/* ── Message Types ── */}
        <h3 className="text-lg font-semibold mt-8 mb-3">Message Types</h3>

        <div className="space-y-3">
          <div className="rounded-lg border border-border/40 bg-card/20 p-4">
            <div className="flex items-start gap-3">
              <Badge variant="default" className="mt-0.5 shrink-0 font-mono text-[11px]">
                SEND
              </Badge>
              <div>
                <code className="font-mono text-sm text-foreground/90">auth</code>
                <p className="mt-1 text-sm text-foreground/80 leading-relaxed">
                  Authenticate the WebSocket connection by sending your{" "}
                  <InlineCode>sessionId</InlineCode>. Must be the first message
                  after connecting.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border/40 bg-card/20 p-4">
            <div className="flex items-start gap-3">
              <Badge variant="default" className="mt-0.5 shrink-0 font-mono text-[11px]">
                SEND
              </Badge>
              <div>
                <code className="font-mono text-sm text-foreground/90">chat</code>
                <p className="mt-1 text-sm text-foreground/80 leading-relaxed">
                  Send a text message to the AI agent. The agent will parse
                  intent, execute actions, and reply with a{" "}
                  <InlineCode>response</InlineCode> message.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border/40 bg-card/20 p-4">
            <div className="flex items-start gap-3">
              <Badge variant="success" className="mt-0.5 shrink-0 font-mono text-[11px]">
                RECV
              </Badge>
              <div>
                <code className="font-mono text-sm text-foreground/90">response</code>
                <p className="mt-1 text-sm text-foreground/80 leading-relaxed">
                  AI agent response containing the result text and any
                  structured data from the executed action.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border/40 bg-card/20 p-4">
            <div className="flex items-start gap-3">
              <Badge variant="default" className="mt-0.5 shrink-0 font-mono text-[11px]">
                SEND
              </Badge>
              <div>
                <code className="font-mono text-sm text-foreground/90">voice_action</code>
                <p className="mt-1 text-sm text-foreground/80 leading-relaxed">
                  Relay a Gemini voice function call to the backend. Used by the
                  voice agent to execute actions (trades, balance checks, etc.)
                  via the same intent system.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border/40 bg-card/20 p-4">
            <div className="flex items-start gap-3">
              <Badge variant="success" className="mt-0.5 shrink-0 font-mono text-[11px]">
                RECV
              </Badge>
              <div>
                <code className="font-mono text-sm text-foreground/90">voice_response</code>
                <p className="mt-1 text-sm text-foreground/80 leading-relaxed">
                  Backend response to a voice action. Contains the result that
                  Gemini will speak back to the user.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border/40 bg-card/20 p-4">
            <div className="flex items-start gap-3">
              <Badge variant="success" className="mt-0.5 shrink-0 font-mono text-[11px]">
                RECV
              </Badge>
              <div>
                <code className="font-mono text-sm text-foreground/90">session</code>
                <p className="mt-1 text-sm text-foreground/80 leading-relaxed">
                  Session state update pushed by the server. Contains wallet
                  address, connection status, and other session metadata.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Example ── */}
        <h3 className="text-lg font-semibold mt-8 mb-3">Example</h3>
        <CodeBlock
          language="typescript"
          code={`const ws = new WebSocket("ws://localhost:3000");

// 1. Authenticate
ws.send(JSON.stringify({ type: "auth", sessionId: "web_abc123" }));

// 2. Send a chat message
ws.send(JSON.stringify({ type: "chat", message: "buy 100 ALEO" }));

// 3. Listen for responses
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);

  switch (msg.type) {
    case "response":
      console.log("Agent:", msg.text);
      break;
    case "session":
      console.log("Wallet:", msg.address);
      break;
    case "voice_response":
      console.log("Voice result:", msg.data);
      break;
  }
};`}
        />

        {/* ── Voice Action Example ── */}
        <h3 className="text-lg font-semibold mt-8 mb-3">
          Voice Action Example
        </h3>
        <p className="mb-4 text-foreground/80 leading-relaxed">
          When the Gemini voice agent issues a function call, the frontend
          relays it to the backend over WebSocket:
        </p>
        <CodeBlock
          language="typescript"
          code={`// Frontend relays Gemini function call
ws.send(JSON.stringify({
  type: "voice_action",
  tool: "get_balance",
  args: {}
}));

// Backend responds with voice_response
// { type: "voice_response", data: { balance: 1200, token: "ALEO" } }`}
        />
      </section>
    </div>
  );
}
