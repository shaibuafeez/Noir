# Noir: Private AI Trading Agent Powered by Zero-Knowledge Proofs

## The Problem

On-chain AI agents are broken by design. Every trade they make is public the moment it hits the chain.

- **$1.2B+ extracted by MEV bots** in 2024 alone — every visible trade is a front-running opportunity
- **100% of AI agent strategies are copyable** — competitors watch your bot's transactions and clone your alpha in real-time
- **DCA schedules are trivially detectable** — recurring buys at predictable intervals invite sandwich attacks
- **Portfolio composition is fully exposed** — anyone can derive your positions, risk exposure, and liquidation thresholds from on-chain data

The result: AI agents on transparent chains are the most profitable targets for value extraction. The smarter your strategy, the more others extract from it. Your AI works for you — but its profits go to bots.

## The Solution

**Noir** is an AI-powered trading agent where every action — trades, balances, strategies, and reasoning — is **invisible by default**. Built natively on Aleo's zero-knowledge architecture, Ghost wraps the entire trading lifecycle in encrypted records and ZK proofs.

Users interact via natural language — "buy 100 ALEO", "stack ALEO $50/week", "if ALEO drops 15% sell half" — across Telegram, Discord, Web, or CLI. The AI parses intent using Claude function calling (21 tool definitions), builds a transaction, generates a ZK proof locally, and submits it to the Aleo network. Validators verify the proof is correct without ever seeing what was traded, how much, or by whom.

### How It Works

1. **User sends a natural language command** — via Telegram, Discord, Web chat, or CLI
2. **AI agent parses intent using Claude function calling** — 21 tool definitions map natural language to structured trading actions with full conversational fallback
3. **Agent builds an Aleo transaction** — consumes encrypted `Holding` records, constructs transition inputs, and generates a ZK proof locally. The proof attests that all safety constraints are satisfied without revealing any values
4. **Encrypted transaction hits the Aleo network** — validators verify the ZK proof and update private state. No one sees the trade amount, token, price, or counterparty. Not even the validators
5. **User gets confirmation** — an encrypted `Receipt` record is stored on-chain as proof of execution

### Why Aleo Is Essential

This product **cannot exist on any transparent chain**. Ethereum, Solana, and Base expose every transaction to the world. Mixers and privacy layers are bolted-on afterthoughts that leak metadata. Only Aleo provides:

- **Private records** — token balances are encrypted state owned by the user, not public mappings readable by anyone
- **ZK-proven execution** — trades are verified as correct without revealing inputs, outputs, or amounts
- **Leo safety constraints** — hard limits (max trade size, balance checks) are enforced at the circuit level. A compromised AI literally cannot generate a valid proof that violates them
- **Selective disclosure** — prove you hold >=1000 ALEO without revealing your actual balance, via `prove_minimum_balance`

The privacy isn't a feature — it's the execution layer.

## Technical Architecture

### Smart Contracts (Leo on Aleo)

Three programs deployed/built on Aleo testnet:

- **ghost_trade_v2.aleo** (Deployed) — Core trading: private swaps with safety rails, private transfers, ZK proof-of-balance, record merging/burning. All state is private `Holding` and `Receipt` records
- **ghost_launchpad_v1.aleo** (Built) — Bonding curve meme coin launchpad with private `LaunchHolding` records, on-chain supply tracking, and graduation mechanics at 800K/1M tokens
- **ghost_zklogin_v1.aleo** (Built) — OAuth identity commitment registry linking Google accounts to Aleo addresses via on-chain `commitments` mapping

### Key ZK Constraints

```leo
// The AI cannot bypass this — the ZK proof fails to generate
assert(amount <= 10000u64);        // Max trade size enforced at circuit level
assert(amount <= holding.amount);  // Can't spend more than you hold

// Private swap: produces encrypted records, not public state
let leftover: Holding = Holding { owner: self.caller, token: holding.token, amount: remaining };
let acquired: Holding = Holding { owner: self.caller, token: token_out, amount: amount_out };
let receipt:  Receipt  = Receipt  { owner: self.caller, trade_type: 1u8, amount: amount_out };
```

Every transition consumes private records and produces new private records. No public state is modified. No observer can determine what happened.

### AI Agent (TypeScript + Claude API)

- **21 tool definitions** via Anthropic function calling — buy, sell, limit orders, DCA, rebalance, alerts, copy trading, launchpad, noir mode, and more
- **3-tier parsing**: Claude API -> OpenAI-compatible LLM -> regex fallback. Works with or without an API key
- **Session wallets**: Shield Wallet users fund a server-side account, enabling the AI to execute DCA, alerts, and copy trades autonomously without per-transaction popups

### Frontend (Next.js 16 + Shield Wallet)

- **9-route Next.js 16 app**: Dashboard, Chat, Market, Strategies, History, Launchpad — glassmorphism UI with framer-motion animations
- **Shield Wallet integration**: Browser-based signing for direct on-chain execution via `@provablehq/aleo-wallet-adaptor-shield`
- **Real-time WebSocket chat**: Natural language trading with confirmation flows and voice input

## Use Cases

- **Private Portfolio Management** — AI manages your positions without exposing holdings to chain analysts or competitors
- **MEV-Proof DCA** — Recurring buys with randomized timing that sandwich bots cannot detect or exploit
- **Invisible Copy Trading** — Mirror a trader's moves privately. They never know they have followers
- **Fair Token Launches** — Bonding curve meme coins where your buy amount is a private record, preventing whale-watching
- **Institutional Privacy** — Trade without exposing strategy, position size, or entry/exit points to the market
- **Proof Without Disclosure** — Prove you hold >=X tokens for DAO governance or airdrop eligibility without revealing your actual balance

## What Makes This Different

| Feature | AI Agents on Public Chains | Noir on Aleo |
|---------|---------------------------|---------------|
| Trade Visibility | Public to everyone, front-runnable | Encrypted in ZK-proven records |
| Portfolio Exposure | Fully derivable from chain data | Private records, view-key only |
| Strategy Leakage | Competitors copy in real-time | AI reasons locally, acts privately |
| DCA Detection | Trivial pattern matching | Randomized timing, encrypted amounts |
| Safety Guarantees | API-level (bypassable) | Circuit-level (ZK proof fails) |
| Copy Trading | Leader sees follower activity | Leader never knows |
| User Interface | Wallet + DEX UI | Natural language (Telegram/Discord/Web) |

## Progress

- **3 Leo smart contracts**: ghost_trade_v2 deployed to testnet, launchpad and zklogin built and ready
- **27 backend TypeScript modules**: Full agent with 21 AI-powered intents, market intelligence (RSI, Bollinger Bands), alert engine, DCA/rebalance/stop-loss automation, copy trading, session wallets
- **34 frontend components**: Next.js 16 with 9 routes, Shield Wallet integration, glassmorphism design system
- **5 interfaces**: Telegram, Discord, Web, CLI, MCP (AI-to-AI protocol)
- **136 tests passing** across 12 test files
- **Testnet deployment**: `at1gpn6dpkud0r4k4jgdr8ylqm6tscg8llndjq748ha0kc3f5nz6g8qdf2vt5`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Leo 4.0 — 3 programs on Aleo testnet |
| Blockchain SDK | @provablehq/sdk (proof generation, record decryption) |
| AI Agent | Anthropic Claude API (21 tool definitions) + regex fallback |
| Backend | TypeScript (ESM), Node.js 22+ |
| Frontend | Next.js 16, React 19, Tailwind CSS, framer-motion 12 |
| Wallet | Shield Wallet (@provablehq/aleo-wallet-adaptor-shield) |
| Chat Interfaces | grammY (Telegram), discord.js (Discord), WebSocket (Web) |
| Market Data | CoinGecko API, local technical analysis engine |
| Database | SQLite (better-sqlite3, 12 tables) |
| Protocol | Model Context Protocol (MCP) for AI-to-AI interop |
| Testing | Vitest (136 tests, 12 files) |

---

Built on [Aleo](https://aleo.org) for the [Aleo x AKINDO Buildathon](https://app.akindo.io/wave-hacks/gXdXJvJXxTJKBELvo) | Privacy is not a feature — it's the execution layer.
