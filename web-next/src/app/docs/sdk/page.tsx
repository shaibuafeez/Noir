"use client";

import { CodeBlock, InlineCode } from "@/components/docs/code-block";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const subpathExports = [
  {
    import: "@noir-protocol/sdk",
    module: "NoirClient",
    description: "Main client with lazy sub-clients",
  },
  {
    import: "@noir-protocol/sdk/trade",
    module: "TradeClient",
    description: "Swaps, transfers, proofs, token registry",
  },
  {
    import: "@noir-protocol/sdk/launchpad",
    module: "LaunchpadClient",
    description: "Bonding curve math, create/buy/sell",
  },
  {
    import: "@noir-protocol/sdk/zklogin",
    module: "ZkLoginClient",
    description: "Commitment computation, registration",
  },
  {
    import: "@noir-protocol/sdk/indicators",
    module: "Indicators",
    description: "RSI, Bollinger Bands, SMA (pure functions)",
  },
  {
    import: "@noir-protocol/sdk/network",
    module: "ExplorerClient",
    description: "On-chain state reads",
  },
];

const tradeMethods = [
  {
    method: "swap(from, to, amount)",
    description: "Private token swap",
  },
  {
    method: "transferPrivate(token, recipient, amount)",
    description: "Private transfer",
  },
  {
    method: "proveMinimumBalance(token, threshold)",
    description: "ZK balance proof",
  },
  {
    method: "createHolding(token, amount)",
    description: "Mint holding",
  },
  {
    method: "mergeHoldings(a, b)",
    description: "Combine records",
  },
  {
    method: "burnHolding(holding)",
    description: "Destroy record",
  },
];

const launchpadMethods = [
  {
    method: "createLaunch(launchId)",
    description: "Create bonding curve launch",
  },
  {
    method: "buyToken(launchId, amount, maxPrice)",
    description: "Buy on curve",
  },
  {
    method: "sellToken(holding, amount, minPrice)",
    description: "Sell back",
  },
  {
    method: "quoteBuy(launchId, amount)",
    description: "Get buy cost quote",
  },
  {
    method: "quoteSell(launchId, amount)",
    description: "Get sell refund quote",
  },
];

const launchpadUtils = [
  {
    fn: "getBondingPrice(supply)",
    description: "Current price at a given supply level",
  },
  {
    fn: "getMarketCap(supply)",
    description: "Total market cap at supply",
  },
  {
    fn: "getProgress(supply)",
    description: "Graduation progress (0 \u2013 1)",
  },
  {
    fn: "isGraduated(supply)",
    description: "Whether the token has graduated",
  },
];

const zkLoginMethods = [
  {
    method: "computeCommitment(oauthSub)",
    description: "Compute ZK commitment from OAuth sub",
  },
  {
    method: "register(commitment, address)",
    description: "Register on-chain",
  },
  {
    method: "verify(commitment)",
    description: "Verify existing commitment",
  },
];

const indicatorFns = [
  {
    fn: "rsi(prices, period?)",
    description: "Relative Strength Index (default period 14)",
  },
  {
    fn: "bollinger(prices, period?, stdDevs?)",
    description: "Bollinger Bands (upper, middle, lower)",
  },
  {
    fn: "sma(prices, period)",
    description: "Simple Moving Average",
  },
];

const errorHierarchy = [
  { name: "NoirError", description: "Base error class" },
  { name: "NetworkError", description: "Connection issues" },
  { name: "TransactionError", description: "On-chain failures" },
  { name: "ValidationError", description: "Invalid inputs" },
  { name: "InsufficientFundsError", description: "Not enough balance" },
  { name: "LaunchpadError", description: "Bonding curve errors" },
];

export default function SdkReferencePage() {
  return (
    <div>
      {/* ── Header ── */}
      <section>
        <Badge variant="default" className="mb-4">
          npm package
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight">
          SDK Reference
        </h1>
        <p className="mt-2 text-foreground/80 leading-relaxed">
          <InlineCode>@noir-protocol/sdk</InlineCode> &mdash; TypeScript SDK for
          building on Noir Protocol
        </p>
      </section>

      {/* ── Installation ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">Installation</h2>
        <CodeBlock
          language="bash"
          code={`npm install @noir-protocol/sdk
# or
pnpm add @noir-protocol/sdk`}
        />
      </section>

      {/* ── Quick Start ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">Quick Start</h2>
        <p className="mb-4 text-foreground/80 leading-relaxed">
          Create a client, execute a private swap, and generate a balance proof
          in a few lines:
        </p>
        <CodeBlock
          language="typescript"
          filename="example.ts"
          code={`import { NoirClient } from "@noir-protocol/sdk";

const noir = new NoirClient({ network: "testnet" });

// Private swap
const result = await noir.trade.swap("ALEO", "USDC", 100);

// Check balance proof
await noir.trade.proveMinimumBalance("ALEO", 1000);`}
        />
      </section>

      {/* ── Subpath Exports ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">Subpath Exports</h2>
        <p className="mb-4 text-foreground/80 leading-relaxed">
          Import only the module you need. The main entry point lazily
          initialises sub-clients on first access.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/10">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Import
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Module
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {subpathExports.map((row) => (
                <tr
                  key={row.import}
                  className="border-b border-border/20 last:border-0"
                >
                  <td className="px-4 py-3">
                    <InlineCode>{row.import}</InlineCode>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-primary/80">
                    {row.module}
                  </td>
                  <td className="px-4 py-3 text-foreground/70">
                    {row.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── TradeClient ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">TradeClient</h2>
        <p className="mb-4 text-foreground/80 leading-relaxed">
          Handles private swaps, transfers, zero-knowledge balance proofs, and
          record management. Access via{" "}
          <InlineCode>noir.trade</InlineCode> or import directly from{" "}
          <InlineCode>@noir-protocol/sdk/trade</InlineCode>.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/10">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Method
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {tradeMethods.map((row) => (
                <tr
                  key={row.method}
                  className="border-b border-border/20 last:border-0"
                >
                  <td className="px-4 py-3">
                    <InlineCode>{row.method}</InlineCode>
                  </td>
                  <td className="px-4 py-3 text-foreground/70">
                    {row.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6">
          <CodeBlock
            language="typescript"
            filename="trade-example.ts"
            code={`import { NoirClient } from "@noir-protocol/sdk";

const noir = new NoirClient({ network: "testnet" });

// Execute a private swap: 50 ALEO -> USDC
const tx = await noir.trade.swap("ALEO", "USDC", 50);
console.log("Transaction ID:", tx.id);
console.log("Received:", tx.outputAmount, tx.outputToken);`}
          />
        </div>
      </section>

      {/* ── LaunchpadClient ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">LaunchpadClient</h2>
        <p className="mb-4 text-foreground/80 leading-relaxed">
          Create and interact with bonding-curve token launches. Includes both
          on-chain methods and pure utility functions for price calculations.
        </p>

        <h3 className="text-base font-semibold mb-3">Methods</h3>
        <div className="overflow-x-auto rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/10">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Method
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {launchpadMethods.map((row) => (
                <tr
                  key={row.method}
                  className="border-b border-border/20 last:border-0"
                >
                  <td className="px-4 py-3">
                    <InlineCode>{row.method}</InlineCode>
                  </td>
                  <td className="px-4 py-3 text-foreground/70">
                    {row.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="text-base font-semibold mt-6 mb-3">
          Pure Utility Functions
        </h3>
        <div className="overflow-x-auto rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/10">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Function
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {launchpadUtils.map((row) => (
                <tr
                  key={row.fn}
                  className="border-b border-border/20 last:border-0"
                >
                  <td className="px-4 py-3">
                    <InlineCode>{row.fn}</InlineCode>
                  </td>
                  <td className="px-4 py-3 text-foreground/70">
                    {row.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <CodeBlock
            language="typescript"
            filename="launchpad-example.ts"
            code={`import { quoteBuy, getBondingPrice } from "@noir-protocol/sdk/launchpad";

const quote = quoteBuy("launch_123", 500);
console.log(quote.totalCost, quote.avgPrice);

const currentPrice = getBondingPrice(50000); // price at 50K supply`}
          />
        </div>
      </section>

      {/* ── ZkLoginClient ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">ZkLoginClient</h2>
        <p className="mb-4 text-foreground/80 leading-relaxed">
          Compute and register zero-knowledge commitments derived from OAuth
          identities. This links a Google (or other OAuth) account to an Aleo
          address without revealing the underlying identity.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/10">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Method
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {zkLoginMethods.map((row) => (
                <tr
                  key={row.method}
                  className="border-b border-border/20 last:border-0"
                >
                  <td className="px-4 py-3">
                    <InlineCode>{row.method}</InlineCode>
                  </td>
                  <td className="px-4 py-3 text-foreground/70">
                    {row.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6">
          <CodeBlock
            language="typescript"
            filename="zklogin-example.ts"
            code={`import { ZkLoginClient } from "@noir-protocol/sdk/zklogin";

const zk = new ZkLoginClient({ network: "testnet" });

// Compute commitment from Google OAuth sub
const commitment = await zk.computeCommitment("google_sub_abc123");

// Register commitment on-chain
await zk.register(commitment, "aleo1...");

// Verify later
const isValid = await zk.verify(commitment);`}
          />
        </div>
      </section>

      {/* ── Indicators ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">Indicators</h2>
        <p className="mb-4 text-foreground/80 leading-relaxed">
          Pure functions for technical analysis. No side effects, no network
          calls &mdash; pass in price arrays and get results back.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/10">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Function
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {indicatorFns.map((row) => (
                <tr
                  key={row.fn}
                  className="border-b border-border/20 last:border-0"
                >
                  <td className="px-4 py-3">
                    <InlineCode>{row.fn}</InlineCode>
                  </td>
                  <td className="px-4 py-3 text-foreground/70">
                    {row.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6">
          <CodeBlock
            language="typescript"
            filename="indicators-example.ts"
            code={`import { rsi, bollinger, sma } from "@noir-protocol/sdk/indicators";

const prices = [42, 43, 44, 42, 45, 47, 46, 48, 50, 49, 51, 52, 50, 53, 55];

const rsiValue = rsi(prices);          // default period = 14
const bands = bollinger(prices, 20, 2); // { upper, middle, lower }
const avg = sma(prices, 7);            // 7-period moving average`}
          />
        </div>
      </section>

      {/* ── Error Handling ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">Error Handling</h2>
        <p className="mb-4 text-foreground/80 leading-relaxed">
          The SDK uses a structured error hierarchy. All errors extend{" "}
          <InlineCode>NoirError</InlineCode>, which itself extends the native{" "}
          <InlineCode>Error</InlineCode> class. Catch specific subtypes for
          granular handling.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 mb-6">
          {errorHierarchy.map((err) => (
            <Card
              key={err.name}
              className="border-border/40 bg-card/30"
            >
              <CardContent className="p-4">
                <p className="font-mono text-sm text-primary/90">
                  {err.name}
                </p>
                <p className="mt-1 text-xs text-foreground/70">
                  {err.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <CodeBlock
          language="typescript"
          filename="error-handling.ts"
          code={`import { NoirClient, InsufficientFundsError, TransactionError } from "@noir-protocol/sdk";

const noir = new NoirClient({ network: "testnet" });

try {
  await noir.trade.swap("ALEO", "USDC", 1000);
} catch (err) {
  if (err instanceof InsufficientFundsError) {
    console.error("Not enough balance:", err.available, err.required);
  } else if (err instanceof TransactionError) {
    console.error("Transaction failed:", err.txId, err.reason);
  } else {
    throw err; // re-throw unexpected errors
  }
}`}
        />
      </section>

      {/* ── Peer Dependencies ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">
          Peer Dependencies
        </h2>
        <Card className="border-border/40 bg-card/30">
          <CardContent className="p-5">
            <p className="text-foreground/80 leading-relaxed">
              <InlineCode>@provablehq/sdk</InlineCode> is an{" "}
              <strong className="text-foreground">optional</strong> peer
              dependency. It is only required when executing on-chain
              transactions (swaps, transfers, launchpad operations). Pure
              functions like indicators, bonding-curve math, and quote
              calculations work without it.
            </p>
            <CodeBlock
              className="mt-4"
              language="bash"
              code={`# Only needed for on-chain execution
pnpm add @provablehq/sdk`}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
