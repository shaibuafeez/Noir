# @noir-protocol/sdk

TypeScript SDK for **Noir Protocol** — private trading, launchpad bonding curves, zkLogin, and technical indicators on Aleo.

## Install

```bash
npm install @noir-protocol/sdk @provablehq/sdk
```

> `@provablehq/sdk` is a peer dependency. It's only required for on-chain transactions — pure math functions (indicators, bonding curve, commitment) work without it.

## Quick Start

```typescript
import { NoirClient, quoteBuy, rsi, bollinger } from "@noir-protocol/sdk";

// ── Read-only (no private key needed) ──

// Bonding curve quotes
const quote = quoteBuy(0, 1000); // Buy 1000 tokens from 0 supply
console.log(quote.totalCost, quote.averagePrice);

// Technical indicators
const rsiResult = rsi([100, 102, 101, 103, 99, ...], 14);
const bbResult = bollinger(prices, 20, 2);

// On-chain reads
const noir = new NoirClient({ network: "testnet" });
const state = await noir.explorer.getLaunchState("abc123");
console.log(state.supplySold, state.graduated);

// ── On-chain transactions (requires private key) ──

const noir = new NoirClient({
  privateKey: "APrivateKey1...",
  network: "testnet",
});

// Trade
await noir.trade.createHolding("ALEO", 100);
await noir.trade.swap("ALEO", "USDT", 50, 5000); // 5000 bps = $0.50
await noir.trade.transferCredits("aleo1recipient...", 1.5);

// Launchpad
await noir.launchpad.createLaunch("mylaunch123");
await noir.launchpad.buyToken("mylaunch123", 500, 0.05); // 5% slippage
await noir.launchpad.sellToken("mylaunch123", 200);

// zkLogin
import { computeCommitment } from "@noir-protocol/sdk";
const commitment = await computeCommitment("accounts.google.com", "user123");
await noir.zklogin.registerCommitment(commitment);
```

## Tree-Shakeable Imports

Import only what you need:

```typescript
import { rsi, bollinger, sma } from "@noir-protocol/sdk/indicators";
import { quoteBuy, quoteSell, getBondingPrice } from "@noir-protocol/sdk/launchpad";
import { tokenToField, getToken, registerToken } from "@noir-protocol/sdk/trade";
import { computeCommitment } from "@noir-protocol/sdk/zklogin";
import { ExplorerClient } from "@noir-protocol/sdk/network";
```

## API Reference

### NoirClient

| Method | Description |
|---|---|
| `new NoirClient(opts?)` | Create client. `privateKey` or `account` for txns. |
| `.explorer` | Read-only on-chain queries (no account needed) |
| `.trade` | Swaps, holdings, transfers |
| `.launchpad` | Bonding curve buy/sell/create |
| `.zklogin` | Commitment registration/verification |
| `NoirClient.createAccount()` | Generate new Aleo keypair |

### Bonding Curve (pure math)

| Function | Description |
|---|---|
| `getBondingPrice(supply)` | Price at supply level |
| `getBuyCost(supply, amount)` | Cost to buy `amount` tokens |
| `getSellRefund(supply, amount)` | Refund for selling `amount` tokens |
| `quoteBuy(supply, amount)` | Full buy quote with graduation check |
| `quoteSell(supply, amount)` | Full sell quote |
| `getMarketCap(supply)` | Market cap at supply level |
| `getProgress(supply)` | Progress to graduation (0–100%) |
| `isGraduated(supply)` | Whether supply >= 800K threshold |

### Indicators (pure math)

| Function | Description |
|---|---|
| `rsi(prices, period?)` | Relative Strength Index (default: 14) |
| `bollinger(prices, period?, stdDev?)` | Bollinger Bands (default: 20, 2) |
| `sma(prices, period?)` | Simple Moving Average |

All accept `number[]` in chronological order (oldest first).

### Token Registry

| Function | Description |
|---|---|
| `getToken(symbol)` | Get token info by symbol |
| `tokenToField(symbol)` | Symbol → on-chain field ID |
| `fieldToToken(fieldId)` | Field ID → symbol |
| `registerToken(info)` | Add custom token |
| `getAllTokens()` | List all tokens |
| `getTradableTokens()` | Non-stablecoin tokens |

### Constants

```typescript
import { PROGRAMS, LAUNCHPAD, TRADE, NETWORKS } from "@noir-protocol/sdk";

PROGRAMS.TRADE      // "ghost_trade_v2.aleo"
PROGRAMS.LAUNCHPAD  // "ghost_launchpad_v1.aleo"
PROGRAMS.ZKLOGIN    // "ghost_zklogin_v1.aleo"

LAUNCHPAD.MAX_SUPPLY           // 1,000,000
LAUNCHPAD.GRADUATION_THRESHOLD // 800,000
```

### Error Handling

```typescript
import { NoirError, TransactionError, ValidationError } from "@noir-protocol/sdk";

try {
  await noir.trade.createHolding("ALEO", 100);
} catch (err) {
  if (err instanceof TransactionError) {
    console.error("Tx failed:", err.message, err.txHash);
  } else if (err instanceof ValidationError) {
    console.error("Invalid input:", err.message);
  }
}
```

## License

MIT
