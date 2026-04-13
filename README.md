<h1 align="center">Ghost</h1>

<p align="center">
  <strong>Private AI Trading Agent on Aleo</strong><br/>
  Your trades are invisible. Your strategies are secret. Your AI alpha stays yours.
</p>

<p align="center">
  <a href="https://app.akindo.io/wave-hacks/gXdXJvJXxTJKBELvo">Aleo x AKINDO Buildathon</a> &middot;
  <a href="#demo">Demo</a> &middot;
  <a href="#architecture">Architecture</a> &middot;
  <a href="#smart-contracts">Smart Contracts</a> &middot;
  <a href="#quick-start">Quick Start</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Aleo-Testnet-6366f1?style=flat-square" alt="Aleo Testnet" />
  <img src="https://img.shields.io/badge/Leo-v4.0-10b981?style=flat-square" alt="Leo v4" />
  <img src="https://img.shields.io/badge/TypeScript-ESM-3178c6?style=flat-square" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tests-136%20passing-22c55e?style=flat-square" alt="Tests" />
</p>

---

## The Problem

Every AI trading agent on every other chain **broadcasts its strategy to the world**. Your buy orders, sell triggers, DCA schedules, and portfolio allocations are fully visible on-chain. Front-runners extract value. Competitors copy your alpha. Your trading edge evaporates the moment you use it.

## The Solution

Ghost is an AI-powered trading agent where **everything is private by default**. Built natively on Aleo, every trade, balance, and strategy is protected by zero-knowledge proofs. The AI reasons locally, acts privately, and proves correctness — without revealing a single detail.

```
You:    "Buy 100 ALEO"
Ghost:  "BUY 100 ALEO @ $0.62 — $62.00 total.
         This will execute a private swap on testnet.
         Confirm?"
You:    [Confirm]
Ghost:  "Done. Private Holding record created.
         Tx: at1x7k9..."
```

No one sees what you bought. No one sees how much. No one can front-run you.

---

## Demo

> Video demo link and live bot coming soon.

**Testnet Deployment:**
- `ghost_trade_v2.aleo` — [Deployed on Aleo Testnet](https://explorer.provable.com/transaction/at1gpn6dpkud0r4k4jgdr8ylqm6tscg8llndjq748ha0kc3f5nz6g8qdf2vt5)
- `ghost_launchpad_v1.aleo` — Built, ready for deployment
- `ghost_zklogin_v1.aleo` — Built, ready for deployment

---

## Features

### Private Trading Engine
Every action produces a ZK-proven Aleo transaction. Amounts, tokens, and prices are all encrypted.

| Action | What Happens On-Chain | Visible to Others |
|--------|----------------------|-------------------|
| Buy/Sell | Private `Holding` + `Receipt` records created | Nothing |
| Limit Order | Stored locally, executed when price hits target | Nothing |
| DCA | Recurring buys with randomized timing | Nothing |
| Rebalance | Batch swaps to target allocation | Nothing |
| Go Dark | All public credits moved to private records | Zero footprint |

### AI Agent (Natural Language)
Talk to Ghost like a human. It understands 21 different intents:

```
"buy 100 ALEO"                      → Private swap
"stack ALEO $50/week"               → Automated DCA
"if ALEO drops 15%, sell half"      → Smart alert with auto-trade
"rebalance 60 ALEO 40 USDC"        → Portfolio rebalancing
"go dark"                           → Move everything to private records
"copy @trader"                      → Mirror trades privately (they never know)
"launch MyCoin MOON 'To the moon'" → Create a meme coin on bonding curve
"why"                               → Explain last AI decisions
```

### Meme Coin Launchpad
Create and trade tokens on a bonding curve — entirely on-chain with ZK privacy:

- **Bonding Curve**: Price = 1 + supply/1000 (increases with demand)
- **Graduation**: At 800K of 1M tokens sold, the coin graduates
- **Private Holdings**: Your position is a private `LaunchHolding` record
- **Slippage Protection**: `max_price` parameter enforced by the Leo circuit

### Multi-Interface
Use Ghost from anywhere:

| Interface | Status |
|-----------|--------|
| Web Dashboard | 9-page Next.js app with glassmorphism UI |
| Telegram Bot | Full NL trading via grammY |
| Discord Bot | Slash commands via discord.js |
| CLI | Commander.js terminal interface |
| MCP Server | Model Context Protocol for AI-to-AI integration |
| Shield Wallet | Browser wallet for direct on-chain signing |

### Session Wallets (Autonomous AI Trading)
Shield Wallet users can fund a server-side session wallet, enabling the AI to trade autonomously without per-transaction popups:

```
Shield Wallet → Fund 1 ALEO → Session Wallet
                                    ↓
                          AI executes trades
                          (DCA, alerts, copies)
                                    ↓
                    User clicks "Reclaim" → funds return
```

### Market Intelligence
- Real-time prices from CoinGecko
- Technical indicators: RSI, Bollinger Bands, SMA
- Price alerts with automated trade execution
- Agent reasoning traces (ask "why?" after any decision)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  INTERFACES                                                  │
│  Telegram · Discord · Web · CLI · MCP · Shield Wallet        │
└─────────────────┬───────────────────────────────────────────┘
                  │ natural language / commands
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  AI AGENT                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Claude API   │  │ Intent       │  │ Action Handler    │  │
│  │ (21 tools)   │→ │ Parser       │→ │ (trade, dca,      │  │
│  │              │  │ + regex      │  │  alerts, launch)  │  │
│  └──────────────┘  └──────────────┘  └─────────┬─────────┘  │
└────────────────────────────────────────────────┼────────────┘
                                                 │
┌────────────────────────────────────────────────┼────────────┐
│  ALEO LAYER                                    ▼             │
│  ┌───────────────┐  ┌────────────┐  ┌────────────────────┐  │
│  │ ghost_trade   │  │ ghost_     │  │ ghost_zklogin      │  │
│  │ _v2.aleo      │  │ launchpad  │  │ _v1.aleo           │  │
│  │               │  │ _v1.aleo   │  │                    │  │
│  │ • swap        │  │ • buy/sell │  │ • register_zklogin │  │
│  │ • transfer    │  │ • create   │  │ • verify_identity  │  │
│  │ • prove_min   │  │ • graduate │  │                    │  │
│  │ • merge/burn  │  │ • merge    │  │                    │  │
│  └───────────────┘  └────────────┘  └────────────────────┘  │
│                                                              │
│  All transactions: encrypted inputs → ZK proof → on-chain    │
└──────────────────────────────────────────────────────────────┘
```

---

## Smart Contracts

### `ghost_trade_v2.aleo` — Deployed on Testnet

The core trading program. All state is private Aleo records.

| Transition | Purpose |
|-----------|---------|
| `create_holding` | Mint a private token holding |
| `swap` | Private token swap with safety rails (max 10K units) |
| `transfer_private` | Send tokens without revealing amount or recipient |
| `prove_minimum_balance` | ZK proof of balance >= threshold (without revealing actual balance) |
| `merge_holdings` | Consolidate fragmented records |
| `burn_holding` | Destroy tokens (dust cleanup) |

**Key safety constraint** — enforced at the circuit level, not by the AI:
```leo
// The AI cannot bypass this. The ZK proof literally fails.
assert(amount <= 10000u64);    // Max trade size
assert(amount <= holding.amount); // Can't spend more than you have
```

### `ghost_launchpad_v1.aleo` — Built

Bonding curve meme coin launchpad with on-chain state.

| Transition | Purpose |
|-----------|---------|
| `create_launch` | Initialize a new token with bonding curve |
| `buy_token` | Buy tokens, price increases along curve |
| `sell_token` | Sell tokens back to the curve |
| `merge_holdings` | Combine LaunchHolding records |

Public mappings track supply (`supply_sold`), graduation status (`graduated`), and creator (`launch_creators`). Holdings are private records.

### `ghost_zklogin_v1.aleo` — Built

Links OAuth identities (Google) to Aleo addresses via on-chain commitment registry.

| Transition | Purpose |
|-----------|---------|
| `register_zklogin` | Register OAuth commitment → address mapping |
| `verify_identity` | Verify an existing commitment |

---

## Privacy Guarantees

| What | Public Chains | Ghost on Aleo |
|------|---------------|---------------|
| Token balances | Visible to everyone | Encrypted in private records |
| Trade amounts | Visible to front-runners | Hidden by ZK proof |
| Limit order prices | Visible (front-runnable) | Private until executed |
| DCA schedule | Correlatable on-chain | Randomized timing jitter |
| Portfolio composition | Fully derivable | Encrypted, view-key only |
| AI strategy logic | Often leaked via API calls | Local reasoning, never transmitted |
| Copy trading activity | Leader sees followers | Leader never knows |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Leo 4.0 (3 programs on Aleo) |
| Backend | TypeScript (ESM), Node.js |
| AI Agent | Anthropic Claude API (21 tool definitions) + regex fallback |
| Frontend | Next.js 16, React 19, Tailwind CSS, framer-motion 12 |
| Wallet | Shield Wallet (@provablehq/aleo-wallet-adaptor-shield) |
| Database | SQLite (better-sqlite3) |
| Blockchain SDK | @provablehq/sdk |
| Chat | grammY (Telegram), discord.js (Discord), WebSocket (Web) |
| Market Data | CoinGecko API |
| Testing | Vitest (136 tests) |
| Protocol | Model Context Protocol (MCP) for AI-to-AI interop |

---

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm
- [Leo CLI](https://developer.aleo.org/getting_started/) (for smart contract development)

### Install & Run

```bash
# Clone
git clone https://github.com/shaibuafeez/Noir.git
cd Noir

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your keys:
#   TELEGRAM_BOT_TOKEN=...     (from @BotFather)
#   ANTHROPIC_API_KEY=...      (optional, for AI agent)
#   ALEO_NETWORK=testnet

# Run
pnpm dev

# The server starts:
#   Web dashboard: http://localhost:3000
#   MCP server:    http://localhost:3001
#   Telegram bot:  polling
```

### Build Frontend

```bash
cd web-next
pnpm install
npx next build    # Static export to out/
```

### Run Tests

```bash
pnpm test         # 136 tests across 12 files
```

### Build Leo Programs

```bash
cd programs/ghost_trade
leo build         # Compile ghost_trade_v2.aleo

cd ../ghost_launchpad
leo build         # Compile ghost_launchpad_v1.aleo

cd ../ghost_zklogin
leo build         # Compile ghost_zklogin_v1.aleo
```

---

## Project Structure

```
ghost/
├── programs/                          # Leo smart contracts (on-chain)
│   ├── ghost_trade/src/main.leo       # Private swaps, transfers, proofs
│   ├── ghost_launchpad/src/main.leo   # Bonding curve meme coin launchpad
│   └── ghost_zklogin/src/main.leo     # OAuth identity commitment registry
│
├── src/                               # Backend (TypeScript)
│   ├── agent/                         # AI agent core
│   │   ├── ai.ts                      # Claude API integration (21 tools)
│   │   ├── parser.ts                  # Intent parsing (AI → LLM → regex)
│   │   └── actions.ts                 # Action handlers for all 21 intents
│   ├── aleo/                          # Blockchain layer
│   │   ├── client.ts                  # Aleo SDK initialization
│   │   ├── trade.ts                   # On-chain trade execution
│   │   ├── wallet.ts                  # Account & key management
│   │   ├── session-wallet.ts          # Autonomous session wallets
│   │   └── zklogin.ts                 # zkLogin commitment computation
│   ├── chat/                          # Multi-interface layer
│   │   ├── telegram.ts                # Telegram bot (grammY)
│   │   ├── discord.ts                 # Discord bot (discord.js)
│   │   ├── web-server.ts             # HTTP + WebSocket server
│   │   ├── web-api.ts                # REST API (20+ endpoints)
│   │   └── cli.ts                     # Terminal interface
│   ├── market/                        # Market intelligence
│   │   ├── prices.ts                  # CoinGecko price feeds
│   │   ├── indicators.ts             # RSI, Bollinger Bands, SMA
│   │   ├── alerts.ts                  # Price alert engine
│   │   ├── strategies.ts             # DCA, rebalance, stop-loss
│   │   └── copy.ts                    # Copy trading engine
│   ├── launchpad/                     # Meme coin bonding curve
│   │   └── engine.ts                  # On-chain state + pricing
│   ├── mcp/                           # AI-to-AI protocol
│   │   └── server.ts                  # MCP server (StreamableHTTP)
│   └── storage/
│       └── db.ts                      # SQLite (12 tables, inline migrations)
│
├── web-next/                          # Frontend (Next.js 16)
│   └── src/
│       ├── app/                       # 9 routes (dashboard, chat, market, etc.)
│       ├── components/                # UI components + animation primitives
│       └── lib/                       # API client, WebSocket context, auth
│
├── tests/                             # Vitest (136 tests, 12 files)
├── sdk/                               # @noir-protocol/sdk (tree-shakeable)
├── PLAN.md                            # 5-wave development plan
└── BUILD.md                           # Build plan & architecture decisions
```

---

## How It Works

### 1. User sends a message
Via Telegram, Discord, Web chat, CLI, or MCP.

### 2. AI parses intent
Claude API with 21 tool definitions maps natural language to structured actions. Falls back to regex for offline/no-API operation.

### 3. Agent executes
Builds Aleo transaction inputs, generates ZK proof locally, signs with user's key (or session wallet for autonomous trading).

### 4. Private on-chain execution
Encrypted transaction + ZK proof submitted to Aleo network. Validators verify the proof without seeing any inputs. Private records are created/consumed.

### 5. User gets confirmation
"Done. Bought 100 ALEO privately. Tx: at1x7k9..."

**The smart contract babysits the AI.** Even a compromised agent can't violate position limits or spend more than the user holds — the ZK proof literally fails to generate.

---

## Competitive Positioning

```
                HIGH PRIVACY
                     │
                     │
          Ghost ★    │
                     │
                     │
LOW UX ──────────────┼────────────────── HIGH UX
                     │
                     │          ○ Bankr
                     │          ○ Griffain
                     │          ○ Hey Anon
                     │
                LOW PRIVACY
```

Ghost is the **only product** that combines consumer-grade UX with real cryptographic privacy. Every competitor operates on transparent chains where all trading activity is public.

---

## What We Built (Buildathon Progress)

| Wave | Features Shipped |
|------|-----------------|
| 1 | Leo program, Telegram bot, buy/sell/portfolio, testnet deployment |
| 2 | DCA, rebalancing, stop-loss, CLI, limit orders |
| 3 | Ghost mode, proof of holdings, Discord, web dashboard |
| 4 | Market intelligence, RSI/Bollinger, alerts, reasoning traces, MCP |
| 5 | Next.js 16 frontend, Shield Wallet, launchpad, copy trading, session wallets, AI agent (Claude) |

**3 Leo programs** &middot; **27 backend modules** &middot; **34 frontend components** &middot; **136 tests** &middot; **5 interfaces**

---

## Roadmap

- [ ] Deploy `ghost_launchpad_v1.aleo` to testnet
- [ ] Mainnet deployment with security audit
- [ ] Mobile PWA with push notifications
- [ ] Multi-DEX routing (best price across Aleo liquidity)
- [ ] Advanced copy trading with performance scoring
- [ ] Freemium model: free tier (5 trades/day) + Pro ($9.99/mo)

---

## License

MIT

---

<p align="center">
  <strong>Your AI's alpha stays yours.</strong><br/>
  Built on <a href="https://aleo.org">Aleo</a> for the <a href="https://app.akindo.io/wave-hacks/gXdXJvJXxTJKBELvo">AKINDO Buildathon</a>
</p>
