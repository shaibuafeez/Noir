"use client";

import Link from "next/link";
import { CodeBlock, InlineCode } from "@/components/docs/code-block";
import { Badge } from "@/components/ui/badge";

export default function GettingStartedPage() {
  return (
    <div>
      {/* ── Header ── */}
      <section>
        <Badge variant="default" className="mb-4">
          Quick Start
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight">
          Getting Started
        </h1>
        <p className="mt-2 text-foreground/80 leading-relaxed">
          Get Noir running locally in under 5 minutes.
        </p>
      </section>

      {/* ── Prerequisites ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">Prerequisites</h2>
        <ul className="list-disc list-inside space-y-2 text-foreground/80 leading-relaxed">
          <li>
            <InlineCode>Node.js 22+</InlineCode> &mdash; runtime for the
            backend and frontend tooling
          </li>
          <li>
            <InlineCode>pnpm</InlineCode> &mdash; fast, disk-efficient package
            manager
          </li>
          <li>
            <InlineCode>Leo CLI</InlineCode> &mdash; the Aleo smart-contract
            compiler.{" "}
            <a
              href="https://developer.aleo.org/getting_started/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Install Leo
            </a>
          </li>
        </ul>
      </section>

      {/* ── Installation ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">Installation</h2>
        <p className="mb-4 text-foreground/80 leading-relaxed">
          Clone the repository and install dependencies:
        </p>
        <CodeBlock
          language="bash"
          code={`git clone https://github.com/shaibuafeez/Noir.git
cd Noir
pnpm install`}
        />
      </section>

      {/* ── Configuration ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">Configuration</h2>
        <p className="mb-4 text-foreground/80 leading-relaxed">
          Copy the example environment file and fill in the values you need:
        </p>
        <CodeBlock
          language="bash"
          filename=".env"
          code={`cp .env.example .env
# Required
ALEO_NETWORK=testnet
# Optional
ANTHROPIC_API_KEY=sk-ant-...    # Claude AI agent
GEMINI_API_KEY=AIza...          # Voice agent
TELEGRAM_BOT_TOKEN=...          # Telegram interface
DISCORD_TOKEN=...               # Discord interface`}
        />
        <p className="mt-4 text-foreground/80 leading-relaxed">
          Only <InlineCode>ALEO_NETWORK</InlineCode> is required. The optional
          keys enable their respective integrations&mdash;the server starts fine
          without them.
        </p>
      </section>

      {/* ── Start the Server ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">Start the Server</h2>
        <CodeBlock language="bash" code="pnpm dev" />
        <p className="mt-4 text-foreground/80 leading-relaxed">
          This single command boots three services:
        </p>
        <ul className="mt-2 list-disc list-inside space-y-2 text-foreground/80 leading-relaxed">
          <li>
            <strong className="text-foreground">Web dashboard</strong> on{" "}
            <InlineCode>:3000</InlineCode> &mdash; HTTP API + WebSocket server
          </li>
          <li>
            <strong className="text-foreground">MCP server</strong> on{" "}
            <InlineCode>:3001</InlineCode> &mdash; Model Context Protocol
            endpoint
          </li>
          <li>
            <strong className="text-foreground">Telegram bot</strong> &mdash;
            long-polling (if <InlineCode>TELEGRAM_BOT_TOKEN</InlineCode> is set)
          </li>
        </ul>
      </section>

      {/* ── Build Frontend ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">Build Frontend</h2>
        <p className="mb-4 text-foreground/80 leading-relaxed">
          The Next.js frontend lives in <InlineCode>web-next/</InlineCode> and
          compiles to a static export:
        </p>
        <CodeBlock
          language="bash"
          code={`cd web-next && pnpm install && npx next build`}
        />
      </section>

      {/* ── Run Tests ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">Run Tests</h2>
        <CodeBlock language="bash" code="pnpm test" />
        <p className="mt-4 text-foreground/80 leading-relaxed">
          The full suite runs <strong className="text-foreground">136 tests</strong> across{" "}
          <strong className="text-foreground">12 suites</strong> in under 1 second.
        </p>
      </section>

      {/* ── Build Leo Programs ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">
          Build Leo Programs
        </h2>
        <p className="mb-4 text-foreground/80 leading-relaxed">
          Compile the three on-chain programs with the Leo CLI:
        </p>
        <CodeBlock
          language="bash"
          code={`leo build --path programs/ghost_trade_v3
leo build --path programs/ghost_zklogin_v2
leo build --path programs/ghost_launchpad`}
        />
      </section>

      {/* ── Next Steps ── */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mt-12 mb-4">Next Steps</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/docs/architecture"
            className="group rounded-lg border border-border/40 bg-card/30 p-5 transition-colors hover:border-primary/30 hover:bg-card/50"
          >
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              Architecture
            </h3>
            <p className="mt-1 text-sm text-foreground/70">
              How the backend, frontend, and smart contracts fit together.
            </p>
          </Link>
          <Link
            href="/docs/smart-contracts"
            className="group rounded-lg border border-border/40 bg-card/30 p-5 transition-colors hover:border-primary/30 hover:bg-card/50"
          >
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              Smart Contracts
            </h3>
            <p className="mt-1 text-sm text-foreground/70">
              Leo programs for trading, zkLogin, and the launchpad.
            </p>
          </Link>
          <Link
            href="/docs/sdk"
            className="group rounded-lg border border-border/40 bg-card/30 p-5 transition-colors hover:border-primary/30 hover:bg-card/50"
          >
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              SDK Reference
            </h3>
            <p className="mt-1 text-sm text-foreground/70">
              TypeScript SDK for interacting with Noir programmatically.
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
