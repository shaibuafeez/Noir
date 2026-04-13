# Noir Protocol — Trust Model & Assumptions

This document describes the security model, trust assumptions, and known
limitations of the Noir Protocol. It is written for hackathon judges, auditors,
and anyone evaluating the project's privacy claims.

---

## Architecture Overview

| Component | Trust Level | Description |
|-----------|-------------|-------------|
| Aleo L1 | Trustless | Zero-knowledge proofs, on-chain program execution |
| Shield Wallet | Non-custodial | User signs every transaction locally |
| Backend server | **Trusted** | Holds custodial wallets, executes trades, stores metadata |
| SQLite database | **Trusted** | Stores keys, trade history, strategies |
| Price oracles | Semi-trusted | Pyth Network + CoinGecko with staleness checks |

---

## Trust Assumptions

### 1. Backend Wallet Authority

The backend creates and stores Aleo private keys for **Telegram, Discord, and
anonymous web** users. These are custodial wallets managed by the server.

- Private keys are stored in SQLite in the `encrypted_private_key` column
  (currently **plaintext** despite the column name — encryption is a TODO).
- The backend signs and submits transactions on behalf of custodial users.
- **Risk**: Server compromise exposes all custodial wallet private keys.
- **Mitigation path**: Shield Wallet (non-custodial) support is live for web
  users. The long-term goal is to move all flows to client-side signing and
  deprecate server-held keys.

### 2. Price Oracle

Price feeds drive limit orders, DCA execution, stop-loss protection, and
portfolio valuations.

| Source | Assets | Cache TTL | Usage |
|--------|--------|-----------|-------|
| Pyth Network | BTC, ETH, SOL, DOGE | 10 s | Primary |
| CoinGecko API | All tokens + ALEO | 60 s | Fallback |

- **Risk**: Oracle manipulation could trigger incorrect limit order execution or
  DCA at bad prices.
- **Mitigation**: Dual-source with staleness checks. Pyth provides on-chain
  confidence intervals. CoinGecko is a widely-used aggregator.

### 3. On-Chain Execution

| User Type | Signing | Trust |
|-----------|---------|-------|
| Shield Wallet (web) | Client-side | **Trustless** — user controls keys |
| zkLogin (Google OAuth) | Server-side | **Trusted** — server holds derived keys |
| Telegram / Discord | Server-side | **Trusted** — server holds keys |
| Anonymous web | Server-side | **Trusted** — server holds ephemeral keys |

All transactions produce ZK proofs on Aleo regardless of who signs them. Privacy
is guaranteed by the protocol; custody is the trust variable.

### 4. Identity — zkLogin

- Google OAuth JWT is verified server-side using the `jose` library (JWKS
  fetched from Google).
- A BHP256 commitment `hash(ZkLoginPreimage { salt, iss_hash, sub_hash })` is
  stored on-chain in `ghost_zklogin_v2.aleo`. The struct-based hash prevents
  field-addition collisions (e.g. different (salt, iss, sub) tuples that sum to
  the same value now produce distinct commitments).
- The salt is server-generated and stored in the SQLite database.
- **Risk**: The server knows the mapping between a Google identity and the
  derived Aleo address. If the server is compromised, this mapping is exposed.
- **Mitigation path**: Move salt generation and storage to the client (e.g.,
  encrypted in browser storage or derived from a user-chosen password).

### 5. AI Agent

- The Claude-based text agent and Gemini-based voice agent receive user commands
  and translate them into intents (buy, sell, DCA, etc.).
- The agent can only invoke pre-defined intents — it cannot execute arbitrary
  code or access keys directly.
- **Risk**: Prompt injection could cause unintended trades. All agent decisions
  are logged in the `agent_decisions` table for auditability.
- **Mitigation**: Intent parsing has a fixed schema. The agent cannot bypass
  balance checks or smart contract constraints.

---

## Smart Contract Safety

All three Leo programs compile on Leo 4.0.1 and are deployed on Aleo testnet.

### ghost_trade_v3.aleo (10 transitions)
- Admin/minter access control (hardcoded admin address)
- Overflow guards on all arithmetic (Leo enforces by default)
- Minimum output on swaps (slippage protection)
- Cross-program **USDCx** and **USAD** buy via `transfer_private` — both
  buyer/seller addresses and payment amount are hidden in encrypted records
- Dual stablecoin support: `buy_with_usdcx` + `buy_with_usad`

### ghost_launchpad_v1.aleo (5 transitions)
- Treasury accounting — all funds tracked in on-chain mappings
- Creator fees capped at 2% (200 BPS)
- **Irreversible graduation** — once a token graduates, the `graduated` mapping
  cannot be flipped back (no rug-pull after graduation)
- Overflow guards on bonding curve math

### ghost_zklogin_v2.aleo (3 transitions)
- BHP256 struct-based commitment proofs (`ZkLoginPreimage { salt, iss_hash, sub_hash }`)
  — prevents field-addition collision attacks
- Unregister requires ownership proof (must know the preimage)
- No admin backdoor — only the commitment owner can unregister

---

## What's Private (Guaranteed by Aleo)

- All token balances (stored as Aleo records, not public mappings)
- Trade amounts and prices (ZK-proven, not visible to observers)
- Portfolio composition (never stored on-chain in plaintext)
- Bonding curve purchases (amount and buyer hidden in records)

## What's NOT Private

- **Transaction existence**: The fact that a transaction occurred is visible
  on-chain (Aleo is a public blockchain; only the contents are hidden).
- **Backend visibility**: The server operator can see custodial users' trade
  history, strategies, and wallet balances (stored in SQLite).
- **Google identity link**: For zkLogin users, the server knows which Google
  account maps to which Aleo address.
- **Price feed queries**: External API calls to Pyth/CoinGecko are not private
  (standard HTTPS, IP visible to the oracle provider).

---

## Known Limitations (Hackathon Scope)

1. **No key encryption at rest** — The `encrypted_private_key` column stores
   plaintext keys. Production would use envelope encryption (e.g., AWS KMS).
2. **Single-server architecture** — No replication, no HSM. The SQLite DB is
   the single point of failure.
3. **Testnet only** — All contracts are deployed on Aleo testnet. Mainnet
   deployment requires audit and key management hardening.
4. **No rate limiting on trade execution** — A compromised session could
   rapid-fire trades. Production would add per-session rate limits.
5. **Oracle latency** — Pyth cache is 10s, CoinGecko is 60s. Fast market moves
   could trigger stale-price execution.

---

## Audit Status

- **Smart contracts**: Not formally audited. Code-reviewed internally.
- **Backend**: Not penetration-tested. Standard Node.js security practices.
- **Dependencies**: npm audit clean at time of submission.
