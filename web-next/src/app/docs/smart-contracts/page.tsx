"use client";

import { CodeBlock, InlineCode } from "@/components/docs/code-block";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const programs = [
  {
    name: "ghost_trade_v3.aleo",
    transitions: 10,
    description: "Core private trading engine — USDCx + USAD",
  },
  {
    name: "ghost_launchpad_v2.aleo",
    transitions: 5,
    description: "Bonding curve meme coin launchpad",
  },
  {
    name: "ghost_zklogin_v2.aleo",
    transitions: 3,
    description: "OAuth identity commitment registry",
  },
];

export default function SmartContractsPage() {
  return (
    <div>
      {/* ── Header ── */}
      <section>
        <Badge variant="default" className="mb-4">
          On-Chain Programs
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight">
          Smart Contracts
        </h1>
        <p className="mt-2 text-foreground/80 leading-relaxed">
          3 Leo programs, 18 transitions, all deployed on Aleo Testnet.
        </p>
      </section>

      {/* ── Overview Cards ── */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {programs.map((p) => (
          <Card
            key={p.name}
            className="border-border/40 bg-card/30"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-semibold text-foreground">
                  {p.name}
                </h3>
                <Badge variant="success">DEPLOYED</Badge>
              </div>
              <p className="mt-2 text-sm text-foreground/70">
                {p.description}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground/70">
                {p.transitions} transitions
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* ── ghost_trade_v3.aleo ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">ghost_trade_v3.aleo</h2>
        <p className="mb-4 text-foreground/80 leading-relaxed">
          Core trading program. 10 transitions. All state is private Aleo records. Dual stablecoin support (USDCx + USAD).
        </p>

        <div className="overflow-x-auto rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-muted/10">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Transition</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Parameters</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              <tr>
                <td className="px-4 py-3"><InlineCode>init_admin</InlineCode></td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">&mdash;</td>
                <td className="px-4 py-3 text-foreground/70">Initialize deployer as admin (one-time)</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><InlineCode>authorize_minter</InlineCode></td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">minter: address</td>
                <td className="px-4 py-3 text-foreground/70">Admin authorizes additional minter addresses</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><InlineCode>create_holding</InlineCode></td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">token: field, amount: u64</td>
                <td className="px-4 py-3 text-foreground/70">Mint a private token holding record (minters only)</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><InlineCode>swap</InlineCode></td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">holding: Holding, to_token: field, amount: u64, max_slippage: u64</td>
                <td className="px-4 py-3 text-foreground/70">Private token swap with circuit-enforced safety rails</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><InlineCode>transfer_private</InlineCode></td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">holding: Holding, recipient: address, amount: u64</td>
                <td className="px-4 py-3 text-foreground/70">Send tokens without revealing amount or recipient</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><InlineCode>prove_minimum_balance</InlineCode></td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">holding: Holding, threshold: u64</td>
                <td className="px-4 py-3 text-foreground/70">Prove balance {">="} threshold without revealing actual balance</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><InlineCode>merge_holdings</InlineCode></td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">a: Holding, b: Holding</td>
                <td className="px-4 py-3 text-foreground/70">Consolidate two records into one</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><InlineCode>burn_holding</InlineCode></td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">holding: Holding</td>
                <td className="px-4 py-3 text-foreground/70">Destroy a holding record (dust cleanup)</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><InlineCode>buy_with_usdcx</InlineCode></td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">token, amount, cost, seller, Token, MerkleProof[]</td>
                <td className="px-4 py-3 text-foreground/70">Private USDCx purchase via transfer_private</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><InlineCode>buy_with_usad</InlineCode></td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">token, amount, cost, seller, Token, MerkleProof[]</td>
                <td className="px-4 py-3 text-foreground/70">Private USAD purchase via transfer_private</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-6 mb-3 text-sm text-foreground/80 leading-relaxed">
          The <InlineCode>swap</InlineCode> transition enforces safety constraints directly in the ZK circuit:
        </p>
        <CodeBlock
          language="leo"
          filename="ghost_trade_v3/src/main.leo"
          code={`transition swap(holding: Holding, to_token: field, amount: u64) -> (Holding, Holding, Receipt) {
    assert(amount <= 10000u64);        // Max trade size
    assert(amount <= holding.amount);  // Can't overspend
    // ... ZK proof guarantees these constraints
}`}
        />
      </section>

      {/* ── ghost_launchpad_v2.aleo ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">ghost_launchpad_v2.aleo</h2>
        <p className="mb-4 text-foreground/80 leading-relaxed">
          Bonding curve meme coin launchpad. 5 transitions.
        </p>

        <div className="overflow-x-auto rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-muted/10">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Transition</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Parameters</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              <tr>
                <td className="px-4 py-3"><InlineCode>create_launch</InlineCode></td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">launch_id: field</td>
                <td className="px-4 py-3 text-foreground/70">Initialize new token with bonding curve</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><InlineCode>buy_token</InlineCode></td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">launch_id: field, amount: u64, max_price: u64</td>
                <td className="px-4 py-3 text-foreground/70">Buy tokens, price increases along curve</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><InlineCode>sell_token</InlineCode></td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">holding: LaunchHolding, amount: u64, min_price: u64</td>
                <td className="px-4 py-3 text-foreground/70">Sell tokens back to curve</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><InlineCode>merge_holdings</InlineCode></td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">a: LaunchHolding, b: LaunchHolding</td>
                <td className="px-4 py-3 text-foreground/70">Combine two launch holdings</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><InlineCode>claim_creator_fees</InlineCode></td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">launch_id: field</td>
                <td className="px-4 py-3 text-foreground/70">Creator claims accumulated 2% BPS fees</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-6 mb-3 text-foreground/80 leading-relaxed">
          Public mappings track <InlineCode>supply_sold</InlineCode>,{" "}
          <InlineCode>graduated</InlineCode>, and{" "}
          <InlineCode>launch_creators</InlineCode>. But{" "}
          <strong className="text-foreground">who</strong> holds{" "}
          <strong className="text-foreground">how much</strong> is always private.
        </p>

        <p className="mt-4 mb-3 text-sm text-foreground/80 leading-relaxed">
          Bonding curve formula:
        </p>
        <CodeBlock
          language="leo"
          code="price = 1 + supply_sold / 1000"
        />

        <p className="mt-4 text-foreground/80 leading-relaxed">
          Graduation triggers at <strong className="text-foreground">800,000</strong> of a{" "}
          <strong className="text-foreground">1,000,000</strong> max supply. Once graduated, the
          token transitions to a full liquidity pool.
        </p>
      </section>

      {/* ── ghost_zklogin_v2.aleo ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">ghost_zklogin_v2.aleo</h2>
        <p className="mb-4 text-foreground/80 leading-relaxed">
          OAuth identity commitment registry. 3 transitions. Struct-based BHP256 hash prevents collision attacks.
        </p>

        <div className="overflow-x-auto rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-muted/10">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Transition</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Parameters</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              <tr>
                <td className="px-4 py-3"><InlineCode>register_zklogin</InlineCode></td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">commitment: field, addr: address</td>
                <td className="px-4 py-3 text-foreground/70">Register OAuth commitment to address mapping</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><InlineCode>verify_identity</InlineCode></td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">salt, iss_hash, sub_hash, timestamp</td>
                <td className="px-4 py-3 text-foreground/70">Verify existing commitment matches caller</td>
              </tr>
              <tr>
                <td className="px-4 py-3"><InlineCode>unregister_zklogin</InlineCode></td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">salt, iss_hash, sub_hash</td>
                <td className="px-4 py-3 text-foreground/70">Remove commitment — proves ownership of preimage</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-foreground/80 leading-relaxed">
          Sign in with Google &rarr; compute ZK commitment from OAuth{" "}
          <InlineCode>sub</InlineCode> claim &rarr; register on-chain. The chain{" "}
          <strong className="text-foreground">never</strong> sees your Google identity.
        </p>
      </section>

      {/* ── Deployment Info ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">Deployment Info</h2>
        <p className="mb-4 text-foreground/80 leading-relaxed">
          All three programs are deployed and verified on Aleo Testnet.
        </p>

        <div className="overflow-x-auto rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-muted/10">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contract</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Explorer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              <tr>
                <td className="px-4 py-3 font-mono text-sm text-foreground">ghost_trade_v3.aleo</td>
                <td className="px-4 py-3">
                  <a
                    href="https://explorer.provable.com/transaction/at1gpn6dpkud0r4k4jgdr8ylqm6tscg8llndjq748ha0kc3f5nz6g8qdf2vt5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-4 hover:text-primary/80 break-all"
                  >
                    View on Provable Explorer
                  </a>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-sm text-foreground">ghost_launchpad_v2.aleo</td>
                <td className="px-4 py-3">
                  <a
                    href="https://explorer.provable.com/program/ghost_launchpad_v2.aleo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-4 hover:text-primary/80 break-all"
                  >
                    View on Provable Explorer
                  </a>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-sm text-foreground">ghost_zklogin_v2.aleo</td>
                <td className="px-4 py-3">
                  <a
                    href="https://explorer.provable.com/program/ghost_zklogin_v2.aleo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-4 hover:text-primary/80 break-all"
                  >
                    View on Provable Explorer
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
