<h1 align="center">Noir</h1>

<p align="center">
  <strong>The First Private AI Trading Agent — Built on Aleo</strong><br/>
  Talk to an AI. It trades for you. Nobody sees a thing.
</p>

<p align="center">
  <a href="https://noiraleo.xyz">Live App</a> &middot;
  <a href="https://app.akindo.io/wave-hacks/gXdXJvJXxTJKBELvo">AKINDO Buildathon</a> &middot;
  <a href="#live-on-testnet">Live on Testnet</a> &middot;
  <a href="#zk-proof-usage">ZK Proof Usage</a> &middot;
  <a href="#quick-start">Quick Start</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Aleo-Testnet_(3_contracts_deployed)-6366f1?style=flat-square" alt="Aleo Testnet" />
  <img src="https://img.shields.io/badge/Leo-v4.0_(18_transitions)-10b981?style=flat-square" alt="Leo v4" />
  <img src="https://img.shields.io/badge/Tests-177%20passing-22c55e?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/AI-Claude_%2B_Gemini_Voice-f59e0b?style=flat-square" alt="Dual AI" />
  <a href="https://www.npmjs.com/package/@noir-protocol/sdk"><img src="https://img.shields.io/npm/v/@noir-protocol/sdk?style=flat-square&color=cb3837&label=SDK" alt="npm" /></a>
</p>

---

## Why Noir Exists

On Ethereum, Solana, and every other transparent chain, your AI trading bot **broadcasts everything** to the world:

- Your buy order? **Front-runners see it first.**
- Your DCA schedule? **Competitors copy it.**
- Your limit order price? **MEV bots sandwich you.**
- Your portfolio? **Anyone can derive your strategy.**

> $1.38B was extracted by MEV bots on Ethereum in 2024 alone.

**Noir makes all of that invisible.** Every trade, every balance, every strategy is protected by zero-knowledge proofs on Aleo. The AI reasons about your portfolio — but the blockchain only ever sees encrypted records and ZK proofs. No one can front-run what they can't see.

---

## Live on Testnet

All 3 smart contracts are deployed and live on Aleo Testnet:

| Contract | Transitions | Status | Explorer |
|----------|-------------|--------|----------|
| `ghost_trade_v3.aleo` | 10 | **Deployed** | [View on Provable](https://explorer.provable.com/transaction/at1gpn6dpkud0r4k4jgdr8ylqm6tscg8llndjq748ha0kc3f5nz6g8qdf2vt5) |
| `ghost_launchpad_v2.aleo` | 5 | **Deployed** | [View on Provable](https://explorer.provable.com/program/ghost_launchpad_v2.aleo) |
| `ghost_zklogin_v2.aleo` | 3 | **Deployed** | [View on Provable](https://explorer.provable.com/program/ghost_zklogin_v2.aleo) |

**18 total transitions** across 3 Leo programs — all producing private Aleo records.

---

## 30-Second Demo

```
You:    "Buy 100 ALEO"
Noir:   "BUY 100 ALEO @ $0.62 — $62.00 total.
         Private swap on testnet. Confirm?"
You:    [Confirm]
Noir:   "Done. Private Holding record created. Tx: at1x7k9..."
```

Or just talk:

```
You:    🎤 "Hey Noir, buy fifty ALEO and set a stop-loss at fifteen percent"
Noir:   🔊 "Done. Bought 50 ALEO privately and set a 15% trailing stop-loss.
             Both are invisible on-chain."
```

**No one sees what you bought. No one sees how much. No one can front-run you.**

---

## ZK Proof Usage

> This section maps directly to the AKINDO **"Privacy Usage"** scoring criterion.

Noir doesn't just run *on* Aleo — it uses zero-knowledge proofs as a core mechanic across the entire product. Here's every ZK interaction:

### 1. Private Trading (ghost_trade_v3.aleo)

Every trade creates **private Aleo records** — encrypted data that only the owner's view key can decrypt.

| Transition | ZK Proof Guarantees |
|-----------|-------------------|
| `init_admin` | Initializes deployer as admin — can only be called once |
| `authorize_minter` | Admin authorizes additional minter addresses |
| `create_holding` | Proves valid token/amount pair — mints encrypted private record |
| `swap` | Proves trade amount ≤ holding, amount ≤ 10K limit — without revealing either value |
| `transfer_private` | Proves sender owns the record — without revealing amount, sender, or recipient |
| `merge_holdings` | Proves ownership of two records — consolidates without revealing amounts |
| `prove_minimum_balance` | Proves balance ≥ threshold — **without revealing the actual balance** |
| `burn_holding` | Proves ownership — destroys record privately |
| `buy_with_usdcx` | Private USDCx payment via `transfer_private` — buyer/seller/amount all hidden |
| `buy_with_usad` | Private USAD payment via `transfer_private` — dual stablecoin support |

**Circuit-level safety** — the AI cannot bypass these constraints. The ZK proof literally fails to generate:

```leo
assert(amount <= 10000u64);       // Max trade size — enforced by the circuit
assert(amount <= holding.amount); // Can't overspend — enforced by the circuit
```

### 2. Private Launchpad (ghost_launchpad_v2.aleo)

Meme coin bonding curve where **your position is private**:

| Transition | ZK Proof Guarantees |
|-----------|-------------------|
| `create_launch` | Proves unique launch ID — initializes bonding curve with on-chain mappings |
| `buy_token` | Proves payment ≤ credits owned, enforces `max_price` slippage — private `LaunchHolding` created |
| `sell_token` | Proves ownership of `LaunchHolding` record — burns it, credits returned privately |
| `merge_holdings` | Proves ownership of two launch holdings — combines privately |
| `claim_creator_fees` | Creator claims accumulated 2% BPS fees from treasury |

The bonding curve math (`price = 1 + supply/1000`) runs on-chain in public mappings, but **who holds how much** is always private.

### 3. zkLogin (ghost_zklogin_v2.aleo)

Sign in with Google, get an Aleo wallet — linked by a ZK commitment, not your email:

| Transition | ZK Proof Guarantees |
|-----------|-------------------|
| `register_zklogin` | Proves knowledge of OAuth `sub` claim → struct-based BHP256 commitment stored on-chain |
| `verify_identity` | Proves existing commitment matches — without revealing the OAuth identity |
| `unregister_zklogin` | Proves ownership of commitment — removes the identity link from chain |

**The chain never sees your Google identity.** It only sees a cryptographic commitment that you can later prove you own.

### 4. Privacy Dashboard (Frontend)

The `/privacy` route gives users a **Privacy Score (0-100)** computed from their actual ZK activity:

- How many trades have on-chain ZK proofs
- Whether zkLogin is active (OAuth → ZK commitment)
- Whether Shield Wallet is connected
- Whether "Go Dark" (public→private transfer) has been used
- Number of active automated strategies

Users can also **generate ZK proofs directly** from the dashboard (e.g., prove minimum balance) via Shield Wallet.

### 5. Go Dark Mode

The most aggressive privacy feature. A single command — `"go dark"` — sweeps all public credits into private records via `transfer_public_to_private`. After going dark, your on-chain footprint is **zero**.

---

## Features

### Dual-AI Agent: Text + Voice
Noir runs two AI models in parallel:

| Mode | Model | How It Works |
|------|-------|-------------|
| **Text** | Claude (Anthropic) | 21 tool definitions → intent parsing → private execution |
| **Voice** | Gemini Live API | Real-time speech → function calls → spoken results |

Talk or type — same 21 intents, same private execution. The voice agent uses Gemini's native audio for sub-second latency while relaying actions to the same backend.

### Private Trading Engine

| Action | What Happens On-Chain | Visible to Others |
|--------|----------------------|-------------------|
| Buy/Sell | Private `Holding` + `Receipt` records | **Nothing** |
| Limit Order | Stored locally, executed when price hits | **Nothing** |
| DCA | Recurring buys with randomized timing jitter | **Nothing** |
| Stop-Loss / Protection | Trailing drawdown monitor, auto-sells | **Nothing** |
| Rebalance | Drift-threshold swaps to target allocation | **Nothing** |
| Go Dark | Public credits → private records | **Zero footprint** |
| Copy Trading | Mirror another trader's moves | **Leader never knows** |

### Meme Coin Launchpad
Create and trade tokens on a ZK-private bonding curve:
- **Bonding Curve**: `price = 1 + supply/1000` (on-chain, verifiable)
- **Graduation**: At 800K of 1M supply, the token graduates
- **Private Positions**: Your holdings are encrypted Aleo records
- **Slippage Protection**: `max_price` enforced at the circuit level

### Market Intelligence
- **Pyth Network** oracle as primary price feed (on-chain, decentralized)
- Technical indicators: RSI, Bollinger Bands, SMA
- Smart alerts with automated trade execution
- AI reasoning traces — ask "why?" after any decision

### 6 Interfaces, 1 Private Backend

| Interface | Tech | Status |
|-----------|------|--------|
| Web Dashboard | Next.js 16, 7 app routes + docs, glassmorphism UI | **Live** |
| Voice Agent | Gemini Live API, real-time audio | **Live** |
| Telegram Bot | grammY, full NL trading | **Live** |
| Discord Bot | discord.js, slash commands | **Live** |
| CLI | Commander.js terminal | **Live** |
| MCP Server | Model Context Protocol (AI-to-AI) | **Live** |

### Session Wallets (Autonomous AI)
Fund a server-side wallet from Shield Wallet. The AI trades autonomously — DCA, alerts, copies — without per-transaction popups. Reclaim funds anytime.

```
Shield Wallet → Fund 1 ALEO → Session Wallet (AI trades autonomously)
                                     ↓
                     User clicks "Reclaim" → funds return
```

### zkLogin (Google OAuth → Aleo Wallet)
Sign in with Google. A ZK commitment links your OAuth identity to a deterministic Aleo address. **The chain never sees your email** — only a hash commitment.

### Auth & Session Modes
Four ways to connect — each with full feature access:

| Method | How It Works | Privacy Level |
|--------|-------------|---------------|
| **zkLogin** | Google OAuth → ZK commitment → deterministic Aleo address | Chain sees only a hash |
| **Shield Wallet** | Browser extension, direct on-chain signing | Full key ownership |
| **Session Wallet** | Server-side key funded from Shield Wallet, AI trades autonomously | Delegated signing |
| **Ephemeral Session** | Auto-generated web session, no login required | Anonymous |

### Web Dashboard

| Route | What It Does |
|-------|-------------|
| `/dashboard` | Portfolio value, ALEO/USDCx balances, holdings, strategy overview, trade history |
| `/chat` | AI text chat + voice agent (mic button), real-time WebSocket |
| `/privacy` | Privacy Score (0-100), ZK breakdown, deployed contracts, proof generation |
| `/launchpad` | Browse/create meme coin launches, bonding curve trades via Shield Wallet |
| `/market` | Live prices (Pyth), RSI, Bollinger Bands, sparkline charts |
| `/strategies` | Manage DCA, limit orders, alerts, stop-loss, rebalance, copy trading |
| `/history` | Full trade log + AI decision reasoning traces |

Every page uses glassmorphism cards, framer-motion animations, and skeleton loading states.

### Developer SDK (`@noir-protocol/sdk`)

Tree-shakeable TypeScript SDK — [published on npm](https://www.npmjs.com/package/@noir-protocol/sdk). 5 subpath exports:

```ts
import { NoirClient } from "@noir-protocol/sdk";

const noir = new NoirClient({ network: "testnet" });

// Private swap
await noir.trade.swap("ALEO", "USDC", 100);

// Prove minimum balance without revealing it
await noir.trade.proveMinimumBalance("ALEO", 1000);

// Launchpad: get bonding curve quote
const quote = noir.launchpad.quoteBuy("launch_id", 500);
console.log(quote.totalCost, quote.avgPrice);

// zkLogin: compute commitment from Google OAuth
const commitment = await noir.zklogin.computeCommitment(oauthSub);

// Technical indicators
const rsi = noir.indicators.rsi(priceHistory);
```

**Modules:**

| Import | What |
|--------|------|
| `@noir-protocol/sdk` | Full client — `NoirClient` with lazy sub-clients |
| `@noir-protocol/sdk/trade` | `TradeClient` — swaps, transfers, proofs, token registry |
| `@noir-protocol/sdk/launchpad` | `LaunchpadClient` — bonding curve math, create/buy/sell |
| `@noir-protocol/sdk/zklogin` | `ZkLoginClient` — commitment computation, registration |
| `@noir-protocol/sdk/indicators` | RSI, Bollinger Bands, SMA — pure functions |
| `@noir-protocol/sdk/network` | `ExplorerClient` — on-chain state reads |

Optional peer dep: `@provablehq/sdk` (only needed for on-chain execution).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  INTERFACES                                                          │
│  Web · Voice · Telegram · Discord · CLI · MCP · Shield Wallet        │
└─────────────────────┬───────────────────────────────────────────────┘
                      │ natural language / voice / commands
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│  DUAL AI AGENT                                                       │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────────────┐  │
│  │ Claude API     │  │ Gemini Live    │  │ Action Handler        │  │
│  │ (text, 21      │  │ (voice, real-  │  │ (trade, dca, alerts,  │  │
│  │  tool defs)    │  │  time audio)   │  │  launch, copy, dark)  │  │
│  └───────┬────────┘  └───────┬────────┘  └──────────┬────────────┘  │
│          └──────── Intent ───┘                       │               │
│                    Parser                            │               │
└──────────────────────────────────────────────────────┼──────────────┘
                                                       │
┌──────────────────────────────────────────────────────┼──────────────┐
│  ALEO LAYER (Testnet — all deployed)                 ▼               │
│  ┌─────────────────┐  ┌────────────────┐  ┌──────────────────────┐  │
│  │ ghost_trade     │  │ ghost_         │  │ ghost_zklogin        │  │
│  │ _v3.aleo        │  │ launchpad      │  │ _v2.aleo             │  │
│  │                 │  │ _v2.aleo       │  │                      │  │
│  │ 10 transitions: │  │ 5 transitions: │  │ 3 transitions:       │  │
│  │ swap, transfer, │  │ create, buy,   │  │ register_zklogin,    │  │
│  │ prove_min_bal,  │  │ sell, merge,   │  │ verify_identity,     │  │
│  │ create, merge,  │  │ claim_fees     │  │ unregister           │  │
│  │ burn, buy_usdcx │  │                │  │                      │  │
│  │ buy_usad, admin │  │                │  │                      │  │
│  └─────────────────┘  └────────────────┘  └──────────────────────┘  │
│                                                                      │
│  Encrypted inputs → ZK proof → on-chain private records              │
│  Pyth Network oracle │ Shield Wallet signing │ Session wallets       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Privacy Guarantees

| What | Public Chains (ETH, SOL) | Noir on Aleo |
|------|--------------------------|---------------|
| Token balances | Visible to everyone | Encrypted private records |
| Trade amounts | Visible to front-runners | Hidden by ZK proof |
| Limit order prices | Visible → front-runnable | Private until executed |
| DCA schedule | Correlatable on-chain | Randomized timing jitter |
| Portfolio composition | Fully derivable | Encrypted, view-key only |
| AI strategy logic | Often leaked via mempool | Local reasoning, never transmitted |
| Copy trading activity | Leader sees followers | **Leader never knows** |
| User identity | Wallet address = identity | **zkLogin: chain sees only a hash** |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Leo 4.0 — 3 programs, 18 transitions, deployed on Aleo Testnet |
| Backend | TypeScript (ESM), Node.js, 28 modules |
| AI — Text | Anthropic Claude API (21 tool definitions + regex fallback) |
| AI — Voice | Google Gemini Live API (real-time native audio) |
| Frontend | Next.js 16, React 19, Tailwind CSS, framer-motion 12 |
| Wallet | Shield Wallet (@provablehq/aleo-wallet-adaptor-shield) |
| Auth | Google OAuth → zkLogin (ZK commitment on-chain) |
| Price Oracle | Pyth Network (primary) + CoinGecko (fallback) |
| Database | SQLite (better-sqlite3), 12 tables |
| Blockchain SDK | @provablehq/sdk |
| Developer SDK | @noir-protocol/sdk (tree-shakeable, 5 subpath exports) |
| Chat | grammY (Telegram), discord.js (Discord), WebSocket (Web) |
| Testing | Vitest — 177 tests, 14 suites + 22 Leo on-chain tests, all passing |
| Protocol | Model Context Protocol (MCP) for AI-to-AI interop |

---

## Quick Start

### Prerequisites
- Node.js 22+
- pnpm
- [Leo CLI](https://developer.aleo.org/getting_started/) (for smart contract development)

### Install & Run

```bash
git clone https://github.com/shaibuafeez/Noir.git
cd Noir
pnpm install

cp .env.example .env
# Required:  ALEO_NETWORK=testnet
# Optional:  ANTHROPIC_API_KEY, GEMINI_API_KEY, TELEGRAM_BOT_TOKEN

pnpm dev
# Web dashboard:  http://localhost:3000
# MCP server:     http://localhost:3001
# Telegram bot:   polling (if token configured)
```

### Build Frontend

```bash
cd web-next && pnpm install && npx next build
```

### Run Tests

```bash
pnpm test    # 177 tests, 14 files, <1s
```

### Build Leo Programs

```bash
cd programs/ghost_trade   && leo build   # ghost_trade_v3.aleo (10 transitions)
cd ../ghost_launchpad     && leo build   # ghost_launchpad_v2.aleo (5 transitions)
cd ../ghost_zklogin       && leo build   # ghost_zklogin_v2.aleo (3 transitions)
```

---

## Project Structure

```
noir/
├── programs/                          # Leo smart contracts (3 programs, 18 transitions)
│   ├── ghost_trade/src/main.leo       # Private swaps, transfers, proofs, USDCx + USAD
│   ├── ghost_launchpad/src/main.leo   # Bonding curve meme coin launchpad
│   └── ghost_zklogin/src/main.leo     # OAuth → ZK commitment registry
│
├── src/                               # Backend (28 TypeScript modules)
│   ├── agent/                         # Dual AI: Claude (text) + Gemini (voice)
│   ├── aleo/                          # Blockchain: trade, wallet, session-wallet, zklogin
│   ├── auth/                          # Google OAuth token exchange + JWT verification
│   ├── chat/                          # 6 interfaces: web, telegram, discord, cli, mcp, voice
│   ├── market/                        # Pyth oracle, indicators, alerts, DCA, copy trading
│   ├── launchpad/                     # Bonding curve engine (on-chain state reads)
│   ├── mcp/                           # Model Context Protocol server
│   └── storage/                       # SQLite (12 tables, inline migrations)
│
├── web-next/                          # Frontend (Next.js 16, 21 components, 7 app routes)
│   └── src/
│       ├── app/                       # /dashboard /chat /privacy /launchpad /market
│       │                              # /strategies /history + root + not-found
│       ├── components/                # Glassmorphism UI, animation primitives, voice controls
│       └── lib/                       # API client, WS context, auth, wallet, Gemini voice
│
├── sdk/                               # @noir-protocol/sdk
│   └── src/                           # Trade, Launchpad, zkLogin, Indicators, Explorer
│       ├── trade/                     # TradeClient + token registry
│       ├── launchpad/                 # LaunchpadClient + bonding curve math
│       ├── zklogin/                   # ZkLoginClient + commitment functions
│       ├── indicators/                # RSI, Bollinger, SMA (pure functions)
│       └── network/                   # ExplorerClient + network config
│
└── tests/                             # Vitest (177 tests, 14 suites)
```

---

## What We Built

| Wave | What Shipped |
|------|-------------|
| 1 | Leo smart contract, Telegram bot, buy/sell/portfolio, **testnet deployment** |
| 2 | DCA, rebalancing, stop-loss, CLI, limit orders |
| 3 | Dark mode (go dark), ZK proof of holdings, Discord bot, web dashboard |
| 4 | Pyth oracle, RSI/Bollinger, smart alerts, reasoning traces, MCP server |
| 5 | Next.js 16 frontend, Shield Wallet, launchpad, copy trading, session wallets, Claude agent |
| 6 | **Gemini Voice Agent**, Privacy Dashboard, zkLogin (Google OAuth), all 3 contracts deployed |
| 7 | **SDK published to npm**, production deployment (Vercel + Railway), custom domain |
| 8 | Privacy audit fixes (struct-based zkLogin hash, private stablecoin transfers), USAD support, TRUST.md |

<p align="center">
  <strong>3 Leo programs</strong> &middot; <strong>18 on-chain transitions</strong> &middot; <strong>28 backend modules</strong> &middot; <strong>21 frontend components</strong> &middot; <strong>1 SDK (npm)</strong> &middot; <strong>177 tests</strong> &middot; <strong>6 interfaces</strong>
</p>

---

## Roadmap

| Timeline | Milestone |
|----------|-----------|
| **Now** | Mainnet deployment after security audit |
| **Q3 2026** | Mobile PWA with push notifications, multi-DEX routing |
| **Q4 2026** | Advanced copy trading with performance scoring, DAO governance |
| **2027** | Freemium model: free tier (5 trades/day) + Pro ($9.99/mo) |

---

## License

MIT

---

<p align="center">
  <strong>Your AI's alpha stays yours.</strong><br/>
  Built on <a href="https://aleo.org">Aleo</a> for the <a href="https://app.akindo.io/wave-hacks/gXdXJvJXxTJKBELvo">Aleo x AKINDO Buildathon</a><br/>
  <a href="https://noiraleo.xyz">noiraleo.xyz</a> &middot; <a href="https://www.npmjs.com/package/@noir-protocol/sdk">npm: @noir-protocol/sdk</a>
</p>
