# Ghost — Private AI Agent for Aleo

> "Your AI reasons in private, acts in private, proves correctness — without revealing a single detail."

## Overview

Ghost is a consumer-facing AI agent that manages crypto portfolios on Aleo with full privacy. Users interact via natural language (Telegram/Discord/Web). Every trade, balance, and strategy is invisible to the outside world — powered by Aleo's zero-knowledge proofs.

No ZK jargon. No DEX UIs. No seed phrase tutorials. Just text what you want and it happens — privately.

---

## Why This Wins

### Market Gap

| Existing Product | What It Lacks |
|-----------------|---------------|
| Griffain (Solana) | No privacy — all trades visible on-chain |
| Hey Anon (Multi-chain) | NL interface but public execution |
| Bankr (Base/ETH) | Great UX but zero privacy |
| Wayfinder (Multi) | Public transactions, copyable strategies |

**Ghost = Bankr-level UX + Aleo-level privacy. Nobody has built this.**

### Hackathon Fit (Aleo x AKINDO Buildathon)

- **Prize pool:** $50,000 USDT across 10 waves (14 days each)
- **Track:** Privacy-Preserving AI & Data / Private Finance (DeFi)
- **Judging:** Privacy implementation, technical execution, UX, real-world practicality, innovation
- **Bonus:** Top teams pitch at ETHDenver / EthCC Demo Days

---

## Target User

**"Crypto-curious but DEX-intimidated"**

- Holds some tokens, wants to grow them
- Doesn't want to learn Aleo, ZK, or DeFi interfaces
- Cares about privacy but doesn't want to think about it
- Comfortable texting a bot on Telegram/Discord
- Wants set-and-forget automation

**Secondary:** Power users who want MEV protection and strategy privacy on Aleo.

---

## Core Principle

**Privacy is the benefit, not the feature.**

Never say:
- "Zero-knowledge proofs"
- "Encrypted records"
- "ZK-SNARK verification"

Instead say:
- "Your trades are invisible to front-runners"
- "Your portfolio is only visible to you"
- "Nobody can copy your strategy"
- "Your limit order price is hidden until it fills"

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                     USER DEVICE                         │
│                                                         │
│  ┌──────────────────┐     ┌─────────────────────────┐  │
│  │  Telegram / Web   │────▶│  Ghost Agent Server     │  │
│  │  (Chat Interface) │◀────│                         │  │
│  └──────────────────┘     │  ┌───────────────────┐  │  │
│                           │  │  Gemma 4 26B MoE  │  │  │
│                           │  │  (Local LLM)      │  │  │
│                           │  │  - Parses intent   │  │  │
│                           │  │  - Picks strategy   │  │  │
│                           │  │  - Risk assessment  │  │  │
│                           │  └────────┬──────────┘  │  │
│                           │           │              │  │
│                           │  ┌────────▼──────────┐  │  │
│                           │  │  Aleo SDK (TS)    │  │  │
│                           │  │  - Build tx        │  │  │
│                           │  │  - Generate proof  │  │  │
│                           │  │  - Sign + submit   │  │  │
│                           │  └────────┬──────────┘  │  │
│                           └───────────┼─────────────┘  │
└───────────────────────────────────────┼─────────────────┘
                                        │ encrypted tx + ZK proof
                                        ▼
                          ┌──────────────────────────┐
                          │       ALEO NETWORK       │
                          │                          │
                          │  Verifies proof ✓        │
                          │  Updates private records  │
                          │  Nobody sees the intent   │
                          └──────────────────────────┘
```

### Components

| Component | Tech | Purpose |
|-----------|------|---------|
| Chat Interface | Telegram Bot API / Discord.js / Web UI | Natural language input/output |
| Agent Server | Node.js + TypeScript | Orchestrates everything |
| Local LLM | Gemma 4 26B MoE via llama.cpp | Reasoning + intent parsing + function calling |
| Aleo SDK | @provablehq/sdk | Transaction building, proof generation, record decryption |
| Leo Programs | Leo (Rust-like) | On-chain logic with hard safety constraints |
| Market Data | Public APIs (CoinGecko, etc.) | Price feeds, volume, on-chain metrics |
| Local DB | SQLite (encrypted) | Reasoning traces, trade history, user preferences |

### Privacy Guarantees

| What | Public Chains | Ghost on Aleo |
|------|--------------|---------------|
| Token balances | Visible | Encrypted in records |
| Trade amounts | Visible | Hidden by ZK proof |
| Limit order prices | Visible (front-runnable) | Private until executed |
| Strategy logic | On-chain or API logs | Local LLM, never transmitted |
| Portfolio composition | Derivable | Encrypted, view-key only |
| Trade timing patterns | Correlatable | Randomized jitter |

---

## Feature Set

### 1. Natural Language Commands

Users text the bot. The bot does things.

```
User: "Buy 100 ALEO every Monday"
Ghost: "DCA set up. I'll buy 100 ALEO every Monday at market price.
        Your orders are private — nobody can see your accumulation."

User: "What's my portfolio worth?"
Ghost: "5,200 ALEO ($3,120) + 2,000 USDC. Up 12% this month."

User: "If ALEO drops below $0.50, buy $500 worth"
Ghost: "Private limit order placed. Price target hidden from the network."

User: "Rebalance to 60/40 ALEO/stables"
Ghost: "Done. 3 swaps executed privately. 60.2% ALEO / 39.8% USDC."

User: "Go dark"
Ghost: "Ghost mode activated. All public balances moved to private records."
```

### 2. One-Message Onboarding

```
User: /start
Ghost: "Hey. I'm Ghost — your private crypto autopilot on Aleo.

        Text me things like:
        • 'buy 50 ALEO'
        • 'show my portfolio'
        • 'set a limit order at $0.45'

        Everything I do is private by default.
        Your trades, balances, and strategies are
        invisible to everyone except you.

        Let's start — what do you want to do?"
```

- Agent generates a key pair automatically
- Backs up encrypted to user's account
- Power users can import their own private key
- No wallet setup flow, no seed phrases shown

### 3. Pre-Built Strategies (One-Tap)

| Strategy | Command | What Happens |
|----------|---------|-------------|
| **Stack** | "Stack ALEO" | Weekly DCA, private, randomized timing |
| **Protect** | "Protect my portfolio" | Auto stop-loss + rebalance on drawdown > X% |
| **Yield** | "Make my USDC work" | Auto-stake idle stables, compound rewards |
| **Snipe** | "Buy ALEO at $0.45" | Private limit order, invisible until fill |
| **Ghost** | "Go dark" | Consolidate all to private records, zero public footprint |
| **Rebalance** | "Keep 60/40" | Maintain target allocation automatically |

Strategy selection is stored as encrypted `strategy_id` in Aleo records. Nobody knows which strategy you're running.

### 4. Private Transaction Engine

Every action produces a ZK-proven Aleo transaction:

- **Private Swaps** — amount, tokens, price all encrypted
- **Private Limit Orders** — target price hidden, zero front-running
- **Private DCA** — recurring buys with randomized timing (anti-correlation)
- **Private Rebalancing** — batch swaps in single tx (up to 32 transitions)
- **Private Staking/Unstaking** — yield actions invisible to observers

### 5. On-Chain Safety Rails (Leo-Enforced)

The LLM can suggest anything. The Leo program is the law. If the AI tries to break a rule, the ZK proof literally fails to generate.

```leo
program ghost.aleo {
    const MAX_TRADE_SIZE: u64 = 10000u64;
    const MAX_DAILY_TRADES: u8 = 20u8;
    const MIN_COOLDOWN_BLOCKS: u32 = 10u32;
    const MAX_CONCENTRATION: u64 = 40u64;

    record Portfolio {
        owner: address,
        token: field,
        amount: u64,
        last_trade_block: u32,
        trades_today: u8,
    }

    record TradeReceipt {
        owner: address,
        token_in: field,
        token_out: field,
        amount_in: u64,
        amount_out: u64,
        block: u32,
    }

    transition execute_trade(
        private portfolio: Portfolio,
        private token_out: field,
        private amount: u64,
        private price: u64,
    ) -> (Portfolio, TradeReceipt) {
        // Hard safety rails — ZK-enforced, AI cannot bypass
        assert(amount <= MAX_TRADE_SIZE);
        assert(portfolio.trades_today < MAX_DAILY_TRADES);
        assert(block.height - portfolio.last_trade_block >= MIN_COOLDOWN_BLOCKS);
        assert(amount * 100u64 / portfolio.amount <= MAX_CONCENTRATION);

        let updated: Portfolio = Portfolio {
            owner: portfolio.owner,
            token: token_out,
            amount: amount * price / 1_000_000u64,
            last_trade_block: block.height,
            trades_today: portfolio.trades_today + 1u8,
        };

        let receipt: TradeReceipt = TradeReceipt {
            owner: portfolio.owner,
            token_in: portfolio.token,
            token_out,
            amount_in: amount,
            amount_out: updated.amount,
            block: block.height,
        };

        return (updated, receipt);
    }
}
```

**The smart contract babysits the AI.** Even a jailbroken LLM can't violate position limits, trade frequency caps, or concentration rules.

### 6. Portfolio Management (Encrypted State)

All balances are encrypted Aleo records — decrypted locally via view key:

- Total value calculation (local decrypt + public price data)
- Per-token allocation percentages
- P&L tracking per position
- Historical performance (local encrypted SQLite)
- Drawdown alerts

### 7. Private Audit Trail

- Every trade produces an encrypted `TradeReceipt` on-chain
- Local DB stores LLM reasoning trace per decision
- User can export full history (decrypted locally) for taxes
- **Selective disclosure** — share proof of a specific trade with an auditor without revealing anything else

### 8. Social Privacy Features

- **Ghost Mode** — move all public balances to private records, one command
- **Proof of Holdings** — ZK proof that you own > X ALEO without revealing exact balance (for DAOs, airdrops)
- **Private OTC** — send tokens without amount or recipient visible on-chain

### 9. Alerts That Act

Not notifications — automated responses:

- "ALEO up 20%" → auto-takes partial profit (if configured)
- "High gas detected" → delays non-urgent trades
- "Whale accumulation detected" → flags opportunity, user says "follow" or ignores

### 10. Market Data Privacy

Agent needs market data but fetching can leak intent:

- Bulk data fetching (pull full feeds, not just your tokens)
- Local caching to reduce request frequency
- Optional proxy rotation
- Public data in → private decisions out

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (ESM, Node 22+) |
| LLM | Gemma 4 26B MoE via llama.cpp (local, OpenAI-compatible API) |
| Blockchain | Aleo (Leo programs, @provablehq/sdk) |
| Chat | Telegram Bot API (grammY framework) / Discord.js |
| Web UI | React + Vite (client-side only, no backend sees data) |
| Database | SQLite (better-sqlite3, encrypted at rest) |
| Market Data | CoinGecko API, public on-chain data |
| Testing | Vitest |
| Deployment | Desktop (local), VPS (self-hosted), or Docker |

---

## Leo Programs

### ghost_trade.aleo
Core trading logic — swaps, limit orders, rebalancing with safety constraints.

### ghost_portfolio.aleo
Portfolio record management — create, update, merge, split position records.

### ghost_dca.aleo
DCA intent records — encrypted schedule, amount, target token. Agent fulfills progressively.

### ghost_social.aleo
Social features — proof of holdings, ghost mode (public→private migration), private OTC transfers.

---

## Agent Reasoning Flow

```
1. USER MESSAGE (natural language)
        │
        ▼
2. INTENT PARSING (Gemma 4 function calling)
   → Extract: action, token, amount, conditions
   → Output: structured JSON action
        │
        ▼
3. RISK ASSESSMENT (Gemma 4 chain-of-thought)
   → Position size vs portfolio %
   → Historical volatility check
   → Slippage estimate
   → Gas cost vs trade value
   → Decision: proceed / warn user / reject
        │
        ▼
4. TRANSACTION BUILD (Aleo SDK)
   → Decrypt relevant records (local, view key)
   → Build Leo transition inputs
   → Generate ZK proof (local)
   → Sign transaction
        │
        ▼
5. SUBMIT (Aleo Network)
   → Encrypted tx + proof sent to network
   → Network verifies proof, updates state
   → Nobody sees inputs, outputs, or intent
        │
        ▼
6. CONFIRM TO USER
   → "Done. Bought 100 ALEO privately. New balance: 5,300 ALEO."
   → Receipt stored locally + encrypted on-chain
```

---

## Wave-by-Wave Build Plan

### Wave 1 (Days 1-14) — MVP

**Goal:** Working Telegram bot that executes private trades on Aleo testnet.

- [ ] Project scaffolding (TS, ESM, pnpm)
- [ ] Gemma 4 26B local setup via llama.cpp
- [ ] Agent reasoning with function calling (buy, sell, portfolio)
- [ ] Aleo SDK integration — create account, build transactions
- [ ] Leo program: `ghost_trade.aleo` — basic private swap with safety rails
- [ ] Telegram bot with grammY — /start, natural language commands
- [ ] Deploy to Aleo testnet
- [ ] Record demo video

**Deliverable:** Bot that handles "buy X ALEO", "show portfolio", "limit order at $Y" — all private.

### Wave 2 (Days 15-28) — Strategies

**Goal:** Pre-built strategies + DCA automation.

- [ ] Leo program: `ghost_dca.aleo` — encrypted DCA intent records
- [ ] DCA execution loop with randomized timing
- [ ] Strategy profiles: Stack, Protect, Snipe
- [ ] Rebalancing logic (multi-swap in single tx)
- [ ] Progress changelog showing Wave 1 → Wave 2 improvements

**Deliverable:** "Stack ALEO" and "Rebalance to 60/40" working end-to-end.

### Wave 3 (Days 29-42) — Social Privacy

**Goal:** Ghost mode + proof of holdings.

- [ ] Leo program: `ghost_social.aleo`
- [ ] Ghost mode: consolidate public → private records
- [ ] Proof of holdings (ZK proof of balance > X without revealing exact amount)
- [ ] Private OTC transfers
- [ ] Selective disclosure for trade receipts

**Deliverable:** "Go dark" command + shareable holding proofs.

### Wave 4 (Days 43-56) — Intelligence

**Goal:** Smarter agent + alerts that act.

- [ ] Market data integration (CoinGecko, on-chain metrics)
- [ ] Alert system with automated responses
- [ ] Agent risk scoring per trade
- [ ] Strategy backtesting (local, historical data)
- [ ] Reasoning trace export

**Deliverable:** Agent that proactively manages positions based on market conditions.

### Wave 5+ — Polish & Scale

- [ ] Web UI (React, client-side only)
- [ ] Discord bot integration
- [ ] Multi-token portfolio support
- [ ] Mainnet deployment
- [ ] Performance optimization (proof generation speed)
- [ ] Mobile companion app (view-only)

---

## Competitive Positioning

```
                    HIGH PRIVACY
                         │
                         │
              Ghost ◆    │
                         │
                         │
LOW UX ──────────────────┼────────────────── HIGH UX
                         │
                         │          ◆ Bankr
                         │          ◆ Griffain
                         │          ◆ Hey Anon
                         │          ◆ Wayfinder
                         │
                    LOW PRIVACY
```

Ghost is the **only product in the top-right quadrant** — consumer-grade UX with real cryptographic privacy.

---

## Monetization (Post-Hackathon)

| Model | How |
|-------|-----|
| **Freemium** | Free: 5 trades/day, 1 strategy. Pro: unlimited, $9.99/mo |
| **Fee on trades** | 0.1% on executed swaps (invisible, built into Leo program) |
| **Premium strategies** | Advanced algo strategies as paid add-ons |
| **API access** | MCP server for developers to build on Ghost |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| LLM hallucinates bad trade | Leo program enforces hard limits — proof fails if violated |
| Aleo testnet instability | Graceful error handling, retry logic, user-facing status messages |
| Slow proof generation | Cache proving keys, parallelize where possible, optimize Leo programs |
| User loses private key | Encrypted backup on first setup, recovery flow via Telegram account |
| Regulatory concerns | No custody — user holds their own key. Agent is a tool, not a service |
| Low LLM quality on financial reasoning | Conservative defaults, confirmation mode for high-value trades |

---

## Success Metrics

| Metric | Wave 1 Target | Wave 5 Target |
|--------|---------------|---------------|
| Working commands | 3 (buy, portfolio, limit) | 15+ |
| Avg response time | < 10s | < 5s |
| Private tx success rate | > 90% | > 99% |
| Demo video views | 100+ | 1,000+ |
| Testnet transactions | 50+ | 1,000+ |
| Community votes (AKINDO) | Top 5 | Top 3 |

---

## File Structure

```
ghost/
├── PLAN.md                          # This file
├── package.json
├── tsconfig.json
├── .env.example                     # ALEO_PRIVATE_KEY, TELEGRAM_BOT_TOKEN
│
├── programs/                        # Leo programs (on-chain)
│   ├── ghost_trade/
│   │   └── src/
│   │       └── main.leo             # Swap, limit order, safety rails
│   ├── ghost_dca/
│   │   └── src/
│   │       └── main.leo             # DCA intent records
│   ├── ghost_portfolio/
│   │   └── src/
│   │       └── main.leo             # Portfolio record management
│   └── ghost_social/
│       └── src/
│           └── main.leo             # Ghost mode, proof of holdings, OTC
│
├── src/
│   ├── index.ts                     # Entry point
│   ├── agent/
│   │   ├── reasoning.ts             # LLM interface (Gemma 4 via llama.cpp)
│   │   ├── actions.ts               # Action definitions (buy, sell, dca, etc.)
│   │   ├── risk.ts                  # Risk assessment per trade
│   │   └── strategies.ts            # Pre-built strategy definitions
│   │
│   ├── aleo/
│   │   ├── client.ts                # Aleo SDK wrapper (ProgramManager, etc.)
│   │   ├── records.ts               # Record decryption + management
│   │   ├── transactions.ts          # Transaction building + submission
│   │   └── programs.ts              # Leo program interaction helpers
│   │
│   ├── chat/
│   │   ├── telegram.ts              # Telegram bot (grammY)
│   │   ├── discord.ts               # Discord bot (discord.js)
│   │   └── web.ts                   # WebSocket chat for web UI
│   │
│   ├── market/
│   │   ├── prices.ts                # Price feed aggregation
│   │   ├── alerts.ts                # Alert engine + automated responses
│   │   └── cache.ts                 # Local market data cache
│   │
│   ├── storage/
│   │   ├── db.ts                    # SQLite setup (encrypted)
│   │   ├── history.ts               # Trade history + reasoning traces
│   │   └── preferences.ts           # User settings + strategy configs
│   │
│   └── utils/
│       ├── privacy.ts               # Bulk data fetch, timing jitter
│       ├── retry.ts                 # Transaction retry with gas escalation
│       └── format.ts                # Response formatting for chat
│
├── web/                             # Client-side web UI (React + Vite)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Chat.tsx
│   │   │   ├── Portfolio.tsx
│   │   │   └── Strategies.tsx
│   │   └── hooks/
│   │       └── useAleo.ts           # Client-side record decryption
│   └── index.html
│
└── test/
    ├── agent.test.ts
    ├── aleo.test.ts
    └── strategies.test.ts
```

---

## The Pitch

> Every AI agent on every other chain broadcasts its strategy to the world.
> Ghost reasons locally, acts privately, and proves correctness —
> without revealing a single detail.
>
> Your AI's alpha stays yours.
>
> Text "buy 100 ALEO" — and it just happens. Privately.

---

## References

- [Aleo Developer Docs](https://developer.aleo.org)
- [Aleo Records (Private State)](https://developer.aleo.org/concepts/fundamentals/records/)
- [Aleo TypeScript SDK](https://developer.aleo.org/sdk/typescript/overview/)
- [Provable SDK (npm)](https://www.npmjs.com/package/@provablehq/sdk)
- [Aleo x AKINDO Buildathon](https://app.akindo.io/wave-hacks/gXdXJvJXxTJKBELvo)
- [Buildathon Details (CompeteHub)](https://www.competehub.dev/en/competitions/urls0d16a084c52c6060aa2953c8b3a27aee)
- [Gemma 4 (Hugging Face)](https://huggingface.co/blog/gemma4)
- [Bankr + Zerion Agent](https://zerion.io/blog/build-best-ai-crypto-agent/)
- [DeFAI Overview (PANews)](https://www.panewslab.com/en/articles/fjwbcw4b)
- [Coinbase Agentic Wallets](https://www.coinbase.com/developer-platform/discover/launches/agentic-wallets)
