# Ghost — Build Plan

## Principles

- Ship ugly, ship fast. Polish is Wave 3+.
- Never build what exists. Wrap it, don't rebuild it.
- Every feature must work end-to-end before starting the next one.
- One developer. No abstractions until the third time you repeat something.
- Test on Aleo testnet only until Wave 5.

---

## Pre-Work (Day 0)

### Environment

```bash
# Aleo
curl -sSf https://install.provable.com/ | sh        # Leo CLI
npm install @provablehq/sdk                           # Aleo TS SDK

# LLM
brew install llama.cpp
# Download Gemma 4 26B MoE Q4_K_M GGUF
llama-server -hf ggml-org/gemma-4-26b-a4b-it-GGUF:Q4_K_M

# Project
mkdir ghost && cd ghost
pnpm init
pnpm add @provablehq/sdk grammy better-sqlite3
pnpm add -D typescript @types/node vitest
```

### Accounts

- Aleo testnet wallet (Leo CLI generates one)
- Telegram bot token from @BotFather
- Fund testnet wallet from Aleo faucet

---

## Wave 1 — Walk (Days 1-14)

**Goal:** Telegram bot that executes private trades on Aleo testnet.

### Day 1-2: Leo Program

Write `ghost_trade.aleo` — the on-chain core. Nothing else matters until this works.

```
ghost_trade/
└── src/
    └── main.leo
```

Records:
- `Holding` — owner, token (field), amount (u64)
- `Receipt` — owner, token_in, token_out, amount_in, amount_out, block

Transitions:
- `create_holding` — mint a new holding record (for testnet seeding)
- `transfer_holding` — private transfer between addresses
- `swap` — consume holding A, produce holding B at a given price

Safety constraints (hardcoded in the circuit):
- Max trade size: 10,000 units
- Max daily trades: 20

Deploy to testnet. Verify it works with Leo CLI.

### Day 3-4: Aleo SDK Wrapper

```
src/aleo/
├── client.ts          # ProgramManager setup, network client
├── wallet.ts          # Account creation, key storage, record decryption
└── trade.ts           # Build + submit swap transition
```

`client.ts` — initialize ProgramManager with AleoKeyProvider, NetworkRecordProvider, connect to testnet API.

`wallet.ts` — create new Account, store private key encrypted in SQLite, decrypt user's holding records using view key.

`trade.ts` — take (token_out, amount, price), find user's holding record, build `swap` transition inputs, call `programManager.execute()`, return tx hash.

Test: run a swap from a script. Confirm the record is consumed and a new one is created.

### Day 5-7: Agent Reasoning

```
src/agent/
├── llm.ts             # llama.cpp OpenAI-compatible client
├── parser.ts          # Intent parsing via function calling
└── actions.ts         # Action definitions
```

`llm.ts` — POST to `http://localhost:8080/v1/chat/completions`. Wrapper that takes messages array + tools, returns structured output.

`parser.ts` — system prompt that defines Ghost's personality. Tools:

```typescript
const TOOLS = [
  {
    name: 'buy',
    description: 'Buy a token',
    parameters: { token: 'string', amount: 'number' }
  },
  {
    name: 'sell',
    description: 'Sell a token',
    parameters: { token: 'string', amount: 'number' }
  },
  {
    name: 'portfolio',
    description: 'Show current holdings',
    parameters: {}
  },
  {
    name: 'limit_order',
    description: 'Place a private limit order',
    parameters: { token: 'string', amount: 'number', price: 'number' }
  }
]
```

Feed user message → get structured action → execute.

`actions.ts` — map each tool name to a function that calls `trade.ts` or `wallet.ts`.

Test: pipe "buy 100 ALEO" through the parser, confirm it outputs `{ name: 'buy', args: { token: 'ALEO', amount: 100 } }`.

### Day 8-10: Telegram Bot

```
src/chat/
└── telegram.ts
```

Use `grammy`. Minimal:

- `/start` → create wallet, store in SQLite, respond with address
- Any other message → pass to agent parser → execute action → respond with result

Confirmation flow:
1. User: "buy 100 ALEO"
2. Ghost: "Buy 100 ALEO at $0.62? [Confirm] [Cancel]"
3. User taps Confirm → execute → "Done. Bought 100 ALEO privately."

Inline keyboard for confirm/cancel. No typing "yes".

### Day 11-12: Portfolio View

Decrypt all user's holding records locally. Sum by token. Fetch prices from CoinGecko (public API, no key needed for basic use). Format:

```
Your portfolio:
500 ALEO     $310    (100%)
Total: $310
```

### Day 13-14: Demo + Submit

- Record 2-minute demo video: /start → fund wallet → buy → portfolio → limit order
- Write progress changelog
- Deploy bot so judges can test it (run on a VPS or ngrok)
- Submit to AKINDO

### Wave 1 Deliverables

```
ghost/
├── programs/
│   └── ghost_trade/
│       ├── program.json
│       └── src/main.leo
├── src/
│   ├── index.ts
│   ├── aleo/
│   │   ├── client.ts
│   │   ├── wallet.ts
│   │   └── trade.ts
│   ├── agent/
│   │   ├── llm.ts
│   │   ├── parser.ts
│   │   └── actions.ts
│   ├── chat/
│   │   └── telegram.ts
│   ├── market/
│   │   └── prices.ts
│   └── storage/
│       └── db.ts
├── package.json
├── tsconfig.json
└── .env.example
```

Working: buy, sell, portfolio, limit order. All private on Aleo testnet.

---

## Wave 2 — Run (Days 15-28)

**Goal:** Automated strategies. DCA + rebalance + protection.

### Day 15-17: DCA (Stack)

New Leo program: `ghost_dca.aleo`

Records:
- `DcaIntent` — owner, token, amount_per_interval, interval_blocks, remaining_count, last_executed_block

Transitions:
- `create_dca` — create intent record
- `execute_dca` — consume intent, produce updated intent + execute swap
- `cancel_dca` — consume intent, return remaining funds

Agent side:
- Background loop (setInterval) checks all active DCA intents
- If current_block - last_executed_block >= interval, execute
- Add randomized jitter (±20% of interval) to prevent timing correlation

User: "stack ALEO $50/week" → create DCA intent → agent handles the rest.

### Day 18-20: Rebalance

No new Leo program needed — uses `ghost_trade.aleo` swap transition.

Agent side:
- `strategies.ts` — `RebalanceStrategy` class
- User sets target allocation: `{ ALEO: 60, USDC: 40 }`
- Agent checks current allocation hourly
- If drift > 5%, calculate required swaps
- Batch execute as sequential transitions in one tx
- Confirm to user: "Rebalanced. 60.2% ALEO / 39.8% USDC."

Store target allocation in SQLite per user.

### Day 21-23: Protection (Stop-Loss)

Agent side:
- `ProtectionStrategy` class
- User sets threshold: "protect at 20% drawdown"
- Agent tracks portfolio high-water mark in SQLite
- If current value drops > threshold from peak, auto-sell to stables
- Uses swap transition — same Leo program
- Notify user after execution with before/after comparison

### Day 24-25: CLI

```
src/chat/
└── cli.ts
```

Reuse the same agent core. Minimal commander.js wrapper:

```bash
ghost buy 100 ALEO
ghost portfolio
ghost stack ALEO --amount 50 --interval weekly
ghost protect --threshold 20
ghost stop stacking
```

### Day 26-28: Polish + Submit

- Strategy status command: "status" → shows active DCA, rebalance targets, protection settings
- Progress changelog (Wave 1 → Wave 2 diff)
- Update demo video
- Submit

---

## Wave 3 — Fly (Days 29-42)

**Goal:** Ghost mode + social privacy features.

### Day 29-31: Ghost Mode

New Leo program: `ghost_social.aleo`

Transition: `go_dark` — takes public mapping balance, converts to private record.

Agent side:
- "go dark" → find all public balances → execute go_dark for each → confirm
- "go public" → reverse (private record → public mapping)

### Day 32-34: Proof of Holdings

Transition: `prove_minimum_balance` — takes private holding record + threshold, outputs a public boolean (balance >= threshold) without revealing the amount.

User: "prove I hold more than 1000 ALEO"
Agent: generates proof, returns verifiable proof hash.

### Day 35-37: Private OTC

Transition: `private_send` — consume sender's holding record, produce new record owned by recipient. Amount, sender, and recipient all private.

User: "send 500 ALEO to aleo1abc...def privately"
Agent: execute private_send → confirm to sender.

### Day 38-39: Discord Bot

```
src/chat/
└── discord.ts
```

Same agent core, discord.js adapter. Slash commands: `/buy`, `/portfolio`, `/stack`, `/dark`.

### Day 40-42: Web Dashboard (Basic)

```
web/
├── index.html
├── src/
│   ├── App.tsx
│   ├── Chat.tsx          # Same NL interface as Telegram
│   └── Portfolio.tsx     # Balances + P&L chart
```

Client-side only. Connects to agent via WebSocket. Decrypts records in browser using view key (via @provablehq/sdk WASM). No backend server sees any data.

Submit with updated demo + changelog.

---

## Wave 4 — Think (Days 43-56)

**Goal:** Smarter agent. Market awareness. Reasoning transparency.

### Day 43-46: Market Data Integration

```
src/market/
├── prices.ts            # Already exists — expand
├── indicators.ts        # RSI, Bollinger bands, volume analysis
└── alerts.ts            # Threshold-based alert engine
```

Pull hourly candles from CoinGecko. Compute basic indicators locally. Store in SQLite.

Agent now has market context in its reasoning: "ALEO RSI is 28 (oversold), volume is 3x average."

### Day 47-49: Alerts That Act

User: "if ALEO drops 15%, sell half"
Agent: creates alert rule in SQLite. Background loop checks price every minute. When triggered, executes the trade and notifies user.

User: "notify me when ALEO hits $1"
Agent: passive alert, just sends a message, no trade.

### Day 50-52: Reasoning Transparency

Store every agent decision in SQLite:
```
{ timestamp, user_message, parsed_action, market_context, reasoning, decision, tx_hash }
```

User: "why did you sell yesterday?"
Agent: queries history, feeds context to LLM, generates explanation.

User: "export history"
Agent: generates CSV from SQLite, sends as file.

### Day 53-54: MCP Server

```
src/mcp/
└── server.ts
```

Expose Ghost as an MCP server (StreamableHTTPServerTransport — we already fixed this pattern with suins-mcp).

Tools: `check_portfolio`, `execute_trade`, `place_limit_order`, `get_reasoning`, `list_strategies`, `activate_strategy`.

Other AI tools (Claude Code, Cursor, custom agents) can now interact with Ghost programmatically.

### Day 55-56: Submit

Changelog, updated demo showing market-aware reasoning and "why did you do that?" feature.

---

## Wave 5 — Scale (Days 57-70)

**Goal:** Production readiness.

### Day 57-60: Performance

- Cache Leo proving keys (biggest bottleneck)
- Parallelize independent proof generation
- Optimize record scanning (index by token type in SQLite)
- Benchmark: target < 5s from command to confirmation

### Day 61-63: Multi-Token

Expand beyond ALEO/USDC pair:
- Support all tokens on Aleo DEXs
- Token discovery: "what tokens are available?"
- Auto-route through best liquidity

### Day 64-66: Mainnet Prep

- Mainnet Leo program deployment
- Mainnet RPC endpoints
- Fee calibration (real gas costs)
- Security audit of Leo programs (self-review + community review)

### Day 67-68: PWA Mobile

Wrap the web dashboard as an installable PWA. Service worker for offline portfolio viewing (last cached state). Push notifications for alerts and fills.

### Day 69-70: Final Submit

Full demo: Telegram + Discord + Web + CLI + MCP all working. Mainnet deployment. Complete changelog across all 5 waves.

---

## Daily Routine

```
Morning:
  1. Check what broke overnight (testnet resets, API changes)
  2. Fix blockers first
  3. Build one feature end-to-end

Afternoon:
  4. Test the feature manually (use the bot yourself)
  5. Fix edge cases
  6. Commit working code

Evening:
  7. Plan tomorrow's feature
  8. Update changelog
  9. Post progress on social (builds community votes)
```

---

## Risk Contingencies

| If This Happens | Do This |
|-----------------|---------|
| Aleo testnet is down | Build + test locally with Leo CLI offline execution |
| Gemma 4 is too slow on your hardware | Drop to E4B (8B params, 12GB RAM) — less smart but still function-calls |
| Leo proof generation takes > 30s | Cache proving keys aggressively, warn user "generating proof..." |
| No Aleo DEX has liquidity | Simulate swaps with mock prices for demo, use real DEX when available |
| Telegram bot gets rate-limited | Add request queue with backpressure |
| Can't finish a Wave feature in time | Ship what works. Incomplete > unsubmitted |
| LLM hallucinates bad action | Confirmation mode catches it. Leo safety rails catch the rest. |

---

## What "Done" Looks Like Per Wave

| Wave | Done When |
|------|-----------|
| 1 | A stranger can /start the bot, buy ALEO, and see their portfolio. All transactions are private on testnet. Demo video exists. |
| 2 | "Stack ALEO $50/week" runs autonomously. Rebalance works. Stop-loss triggers on price drop. CLI works. |
| 3 | "Go dark" moves all balances to private records. Proof of holdings generates a verifiable proof. Private OTC sends work. Web dashboard shows portfolio. |
| 4 | Agent references market data in reasoning. Alerts trigger trades. User can ask "why?" and get an answer. MCP server works. |
| 5 | Mainnet deployment. < 5s response time. PWA installable. Multi-token support. Full feature set across all interfaces. |

---

## Tech Decisions Log

| Decision | Choice | Why |
|----------|--------|-----|
| Bot framework | grammY | Fastest TS Telegram framework. Good types. |
| Database | better-sqlite3 | Synchronous, zero config, single file. Perfect for single-user agent. |
| LLM serving | llama.cpp | OpenAI-compatible API, runs Gemma 4 26B MoE quantized on Mac. |
| Aleo SDK | @provablehq/sdk | Official. Only option. |
| Leo programs | Separate per domain | ghost_trade, ghost_dca, ghost_social — keeps each program small and auditable. |
| Web framework | React + Vite | Fast to scaffold. Client-side only. |
| MCP transport | StreamableHTTP (session-based) | We already debugged this pattern with suins-mcp. Known working. |
| Testing | Vitest | Fast, ESM-native, zero config. |
| Package manager | pnpm | Faster than npm, strict deps. |
