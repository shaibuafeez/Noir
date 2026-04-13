"use client";

import { CodeBlock, InlineCode } from "@/components/docs/code-block";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyModelPage() {
  return (
    <div>
      {/* ── Header ── */}
      <section>
        <Badge variant="default" className="mb-4">
          Core Concept
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight">
          Privacy Model
        </h1>
        <p className="mt-2 text-foreground/80 leading-relaxed">
          How Noir uses zero-knowledge proofs to protect every aspect of your
          trading.
        </p>
      </section>

      {/* ── The Problem with Transparent Chains ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">
          The Problem with Transparent Chains
        </h2>
        <p className="text-foreground/80 leading-relaxed">
          On Ethereum, Solana, and every other transparent blockchain, your
          entire financial life is an open book. Every balance, every swap,
          every limit order, every DCA schedule &mdash; all publicly indexed
          and queryable by anyone with a block explorer.
        </p>
        <p className="mt-4 text-foreground/80 leading-relaxed">
          This transparency has a real cost.{" "}
          <strong className="text-foreground">
            Front-runners and MEV bots extract over $1.38 billion annually
          </strong>{" "}
          by watching the mempool and sandwich-attacking pending transactions.
          Your carefully researched trade becomes someone else&rsquo;s
          guaranteed profit before it even settles.
        </p>
        <p className="mt-4 text-foreground/80 leading-relaxed">
          Now imagine handing an AI agent the keys to your portfolio on a
          transparent chain. Every strategy the bot executes, every signal it
          acts on, every position it builds &mdash; broadcast to the entire
          network in real time. It&rsquo;s like playing poker with your cards
          face up while the dealer copies your hand to the table.
        </p>
      </section>

      {/* ── Aleo's Privacy Model ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">
          Aleo&rsquo;s Privacy Model
        </h2>
        <p className="text-foreground/80 leading-relaxed">
          Aleo takes a fundamentally different approach. Instead of a global
          ledger of account balances, Aleo uses a{" "}
          <strong className="text-foreground">records-based model</strong>{" "}
          inspired by the UTXO pattern but enhanced with zero-knowledge
          cryptography:
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card className="border-border/40 bg-card/30">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground">
                Encrypted Records
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-foreground/70">
                Every piece of data is a{" "}
                <strong className="text-foreground">record</strong> &mdash;
                encrypted with the owner&rsquo;s view key. No one else can
                read it, not even validators.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card/30">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground">
                Consume &amp; Produce
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-foreground/70">
                Transactions consume old records and produce new ones. The
                chain stores ciphertext &mdash; only the owner can decrypt
                what they hold.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card/30">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground">
                ZK Proof Verification
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-foreground/70">
                Validators verify a{" "}
                <strong className="text-foreground">zero-knowledge proof</strong>{" "}
                that the transaction is valid &mdash; without ever seeing the
                inputs, amounts, or participants.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card/30">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground">
                View Key Access
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-foreground/70">
                Only the owner, via their view key, can decrypt their records.
                You can selectively share your view key for auditing &mdash;
                privacy is the default, transparency is opt-in.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── How Noir Uses ZK Proofs ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">
          How Noir Uses ZK Proofs
        </h2>
        <p className="mb-6 text-foreground/80 leading-relaxed">
          Every interaction in Noir generates a cryptographic proof that the
          operation is valid &mdash; without revealing what the operation
          actually is. Here is exactly what is protected and how:
        </p>
        <div className="overflow-x-auto rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20">
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  What
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  How It&rsquo;s Protected
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  ZK Guarantee
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">
                  Token balances
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  Private <InlineCode>Holding</InlineCode> records
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  Proof of ownership without revealing amount
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">
                  Trade amounts
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  <InlineCode>swap</InlineCode> transition
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  Proves amount &le; holding, &le; 10K limit
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">
                  Transfer recipients
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  <InlineCode>transfer_private</InlineCode> transition
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  Proves ownership without revealing sender/recipient
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">
                  Minimum balance
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  <InlineCode>prove_minimum_balance</InlineCode> transition
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  Proves balance &ge; X without revealing actual balance
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">
                  Launchpad positions
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  Private <InlineCode>LaunchHolding</InlineCode> records
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  Who holds how much is never revealed
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">
                  User identity
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  <InlineCode>register_zklogin</InlineCode> transition
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  Chain sees commitment hash, not Google email
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Circuit-Level Safety ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">
          Circuit-Level Safety
        </h2>
        <p className="mb-4 text-foreground/80 leading-relaxed">
          Every constraint is enforced at the circuit level inside the Leo
          program. These are not soft checks that can be bypassed &mdash; they
          are baked into the zero-knowledge proof itself:
        </p>
        <CodeBlock
          language="leo"
          filename="ghost_trade_v3/src/main.leo"
          code={`// Hard limits enforced by the ZK circuit
assert(amount <= 10000u64);       // Max trade size — no single trade can exceed 10K
assert(amount <= holding.amount); // Can't overspend — proves you own what you're trading`}
        />
        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <p className="text-sm leading-relaxed text-foreground">
              <strong>The AI cannot bypass these constraints.</strong> A
              compromised agent, a buggy prompt, or even a malicious operator
              literally cannot generate a valid zero-knowledge proof that
              violates these assertions. The math won&rsquo;t allow it. The
              proof will fail verification, and the transaction will be
              rejected by the network. Your funds are safe by construction,
              not by trust.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ── Go Dark Mode ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">Go Dark Mode</h2>
        <p className="text-foreground/80 leading-relaxed">
          If you hold public Aleo credits, they are visible on-chain just like
          any transparent blockchain. Noir provides a one-command solution:
          <InlineCode>transfer_public_to_private</InlineCode> sweeps all your
          public credits into private records.
        </p>
        <p className="mt-4 text-foreground/80 leading-relaxed">
          Once executed, your on-chain footprint becomes{" "}
          <strong className="text-foreground">zero</strong>. An observer
          scanning the blockchain will see no balances, no holdings, no
          activity linked to your address. Your records still exist &mdash;
          encrypted and accessible only through your view key &mdash; but to
          everyone else, your wallet looks empty.
        </p>
        <CodeBlock
          language="leo"
          filename="credits.aleo (Aleo built-in)"
          code={`transition transfer_public_to_private(
    public receiver: address,
    public amount: u64,
) -> credits {
    // Debits the public credits balance mapping
    // Produces an encrypted credits record
    // On-chain: receiver and amount are visible in this call
    // After: the resulting record is fully private
}`}
        />
        <p className="mt-4 text-foreground/80 leading-relaxed">
          The Noir dashboard includes a &ldquo;Go Dark&rdquo; button that
          triggers this transition through your Shield Wallet &mdash; one
          click and you disappear from the public ledger.
        </p>
      </section>

      {/* ── Privacy Comparison ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">
          Privacy Comparison
        </h2>
        <p className="mb-6 text-foreground/80 leading-relaxed">
          A side-by-side look at what public chains expose versus what Noir on
          Aleo keeps private:
        </p>
        <div className="overflow-x-auto rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20">
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Feature
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Public Chains
                </th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  Noir on Aleo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">
                  Balances
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  <Badge variant="destructive" className="text-[11px]">
                    Visible
                  </Badge>
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  <Badge variant="success" className="text-[11px]">
                    Encrypted records
                  </Badge>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">
                  Trades
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  <Badge variant="destructive" className="text-[11px]">
                    Front-runnable
                  </Badge>
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  <Badge variant="success" className="text-[11px]">
                    ZK proven
                  </Badge>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">
                  Limit orders
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  <Badge variant="destructive" className="text-[11px]">
                    Visible
                  </Badge>
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  <Badge variant="success" className="text-[11px]">
                    Private until executed
                  </Badge>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">
                  DCA schedule
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  <Badge variant="destructive" className="text-[11px]">
                    Correlatable
                  </Badge>
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  <Badge variant="success" className="text-[11px]">
                    Randomized jitter
                  </Badge>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">
                  Portfolio
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  <Badge variant="destructive" className="text-[11px]">
                    Derivable
                  </Badge>
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  <Badge variant="success" className="text-[11px]">
                    View-key only
                  </Badge>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">
                  Identity
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  <Badge variant="destructive" className="text-[11px]">
                    Wallet = identity
                  </Badge>
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  <Badge variant="success" className="text-[11px]">
                    zkLogin hash
                  </Badge>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">
                  Copy trading
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  <Badge variant="destructive" className="text-[11px]">
                    Leader sees followers
                  </Badge>
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  <Badge variant="success" className="text-[11px]">
                    Leader never knows
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Privacy Score ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">Privacy Score</h2>
        <p className="text-foreground/80 leading-relaxed">
          Noir includes a <InlineCode>/privacy</InlineCode> dashboard that
          computes a real-time privacy score from{" "}
          <strong className="text-foreground">0 to 100</strong> based on your
          actual ZK activity on-chain. This is not a static badge &mdash;
          it reflects how you are actually using privacy features:
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border/40 bg-card/30">
            <CardContent className="p-5">
              <div className="text-2xl font-bold text-primary">+20</div>
              <p className="mt-1 text-xs text-foreground/70">
                Private holdings via encrypted records
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card/30">
            <CardContent className="p-5">
              <div className="text-2xl font-bold text-primary">+20</div>
              <p className="mt-1 text-xs text-foreground/70">
                ZK-proven swaps executed through the agent
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card/30">
            <CardContent className="p-5">
              <div className="text-2xl font-bold text-primary">+15</div>
              <p className="mt-1 text-xs text-foreground/70">
                Private transfers sent without revealing sender
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card/30">
            <CardContent className="p-5">
              <div className="text-2xl font-bold text-primary">+15</div>
              <p className="mt-1 text-xs text-foreground/70">
                Balance proofs generated (prove_minimum_balance)
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card/30">
            <CardContent className="p-5">
              <div className="text-2xl font-bold text-primary">+15</div>
              <p className="mt-1 text-xs text-foreground/70">
                Credits swept from public to private
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/40 bg-card/30">
            <CardContent className="p-5">
              <div className="text-2xl font-bold text-primary">+15</div>
              <p className="mt-1 text-xs text-foreground/70">
                zkLogin registered (identity hidden behind hash)
              </p>
            </CardContent>
          </Card>
        </div>
        <p className="mt-6 text-foreground/80 leading-relaxed">
          A score of <strong className="text-foreground">100</strong> means
          you are using every privacy primitive available &mdash; encrypted
          records, private swaps, private transfers, balance proofs,
          dark-mode credits, and zkLogin. The score incentivizes good privacy
          hygiene and gives you a concrete measure of how invisible you are
          on-chain.
        </p>
      </section>

      {/* ── Summary ── */}
      <section className="mt-8">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <h3 className="text-base font-semibold text-foreground">
              Privacy by Default, Transparency by Choice
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-foreground/80">
              On public chains, you start visible and have to fight for
              privacy. On Aleo, you start private and can choose to reveal
              what you want, when you want, to whom you want. Noir is built
              on this principle from the ground up: your AI trading agent
              executes strategies that nobody &mdash; not validators, not MEV
              bots, not even other users &mdash; can observe. The
              zero-knowledge proofs guarantee that every trade is valid
              without ever revealing what the trade was.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
