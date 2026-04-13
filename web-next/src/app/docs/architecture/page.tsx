"use client";

import { CodeBlock, InlineCode } from "@/components/docs/code-block";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const architectureDiagram = `┌─────────────────────────────────────────────────────────────┐
│  INTERFACES                                                  │
│  Web · Voice · Telegram · Discord · CLI · MCP                │
└──────────────────────┬──────────────────────────────────────┘
                       │ natural language / voice / commands
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  DUAL AI AGENT                                               │
│  Claude (text, 21 tools) + Gemini Live (voice, real-time)    │
│  Intent Parser → Action Handler                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────────────┐
│  ALEO LAYER          ▼                                       │
│  ghost_trade_v3 · ghost_launchpad_v2 · ghost_zklogin_v2     │
│  Encrypted inputs → ZK proof → private on-chain records      │
└─────────────────────────────────────────────────────────────┘`;

const backendModules = [
  {
    path: "src/agent/",
    description: "AI agent core — Claude for text reasoning, Gemini for real-time voice. Intent parsing, tool definitions, and action dispatch.",
  },
  {
    path: "src/aleo/",
    description: "Blockchain layer — trade execution, wallet management, session wallets, and zkLogin commitment registry.",
  },
  {
    path: "src/auth/",
    description: "Google OAuth token exchange, JWT verification via jose, and session derivation for zkLogin.",
  },
  {
    path: "src/chat/",
    description: "Six interface adapters — web-server (HTTP + WebSocket), telegram, discord, cli, web-api, and MCP server.",
  },
  {
    path: "src/market/",
    description: "Pyth oracle price feeds, RSI and Bollinger Band indicators, price alerts, DCA scheduler, and copy trading.",
  },
  {
    path: "src/launchpad/",
    description: "Bonding curve engine — launch creation, token buy/sell with price = 1 + supply/1000, graduation at 800K.",
  },
  {
    path: "src/mcp/",
    description: "Model Context Protocol server — exposes Noir capabilities to external AI agents and tools.",
  },
  {
    path: "src/storage/",
    description: "SQLite via better-sqlite3 — 12 tables, inline migrations with column existence checks.",
  },
];

const dataFlowSteps = [
  {
    step: "1",
    title: "User Message",
    description: "A natural-language message, voice command, or structured API call arrives through any of the six interfaces.",
  },
  {
    step: "2",
    title: "AI Parses Intent",
    description: "Claude (text) or Gemini Live (voice) analyzes the input and maps it to one of 21 tool definitions — e.g., trade, launch, set_alert.",
  },
  {
    step: "3",
    title: "Agent Builds Transaction",
    description: "The action handler constructs an Aleo transaction with encrypted inputs and the correct Leo program transition.",
  },
  {
    step: "4",
    title: "ZK Proof Generated",
    description: "Aleo's snarkVM generates a zero-knowledge proof that the transaction is valid without revealing inputs, amounts, or strategy logic.",
  },
  {
    step: "5",
    title: "Private Record On-Chain",
    description: "The proof is verified by validators and an encrypted record is stored on-chain — visible only to the record owner.",
  },
];

export default function ArchitecturePage() {
  return (
    <div className="space-y-14">
      {/* ── Header ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-widest">
            Architecture
          </Badge>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Architecture
        </h1>
        <p className="max-w-2xl text-base text-foreground/80 leading-relaxed">
          How Noir's components work together — from user interfaces through dual-AI
          intent parsing to zero-knowledge proof generation on Aleo.
        </p>
      </section>

      {/* ── System Overview ── */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight">System Overview</h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Noir is built on a three-layer architecture. Every user interaction — whether
          it originates from the web dashboard, a voice command, a Telegram message, or
          a programmatic API call — follows the same path through these layers.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border/40 bg-card/30">
            <CardContent className="space-y-2 p-5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 font-mono text-xs font-bold text-primary">
                  1
                </div>
                <h3 className="text-sm font-semibold">Interfaces Layer</h3>
              </div>
              <p className="text-xs leading-relaxed text-foreground/70">
                Six interfaces — <strong className="text-foreground/80">Web</strong>,{" "}
                <strong className="text-foreground/80">Voice</strong>,{" "}
                <strong className="text-foreground/80">Telegram</strong>,{" "}
                <strong className="text-foreground/80">Discord</strong>,{" "}
                <strong className="text-foreground/80">CLI</strong>, and{" "}
                <strong className="text-foreground/80">MCP</strong> — all feed into the
                same backend through a unified message protocol. No interface has
                privileged access; they all share the same capabilities.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/30">
            <CardContent className="space-y-2 p-5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 font-mono text-xs font-bold text-primary">
                  2
                </div>
                <h3 className="text-sm font-semibold">AI Agent Layer</h3>
              </div>
              <p className="text-xs leading-relaxed text-foreground/70">
                Dual AI processing —{" "}
                <strong className="text-foreground/80">Claude</strong> handles text
                with 21 tool definitions for structured reasoning, while{" "}
                <strong className="text-foreground/80">Gemini Live</strong> handles
                real-time voice with streaming audio. Both parse intents and call the
                exact same action handlers.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/30">
            <CardContent className="space-y-2 p-5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 font-mono text-xs font-bold text-primary">
                  3
                </div>
                <h3 className="text-sm font-semibold">Aleo Layer</h3>
              </div>
              <p className="text-xs leading-relaxed text-foreground/70">
                Three Leo programs deployed on testnet —{" "}
                <InlineCode>ghost_trade_v3</InlineCode>,{" "}
                <InlineCode>ghost_launchpad_v2</InlineCode>, and{" "}
                <InlineCode>ghost_zklogin_v2</InlineCode>. Every transaction produces
                encrypted private records and zero-knowledge proofs. Nothing leaks
                on-chain.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Architecture Diagram ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Architecture Diagram</h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          The full request path from user input to on-chain proof.
        </p>
        <CodeBlock
          code={architectureDiagram}
          language="text"
          filename="system-architecture"
        />
      </section>

      {/* ── Data Flow ── */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight">Data Flow</h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Every action — trade, launch, alert, or strategy — follows this five-step
          pipeline from human intent to private on-chain state.
        </p>

        <div className="space-y-3">
          {dataFlowSteps.map((s) => (
            <div
              key={s.step}
              className="flex gap-4 rounded-lg border border-border/40 bg-card/20 p-4"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-sm font-bold text-primary">
                {s.step}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">{s.title}</h3>
                <p className="text-xs leading-relaxed text-foreground/70">
                  {s.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Backend Modules ── */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight">Backend Modules</h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          The <InlineCode>src/</InlineCode> directory is organized into focused modules.
          Each module owns a single domain and exposes functions consumed by the AI agent
          layer.
        </p>

        <div className="overflow-hidden rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-card/40">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Module
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {backendModules.map((m, i) => (
                <tr
                  key={m.path}
                  className={
                    i < backendModules.length - 1
                      ? "border-b border-border/20"
                      : ""
                  }
                >
                  <td className="whitespace-nowrap px-4 py-3 align-top">
                    <InlineCode>{m.path}</InlineCode>
                  </td>
                  <td className="px-4 py-3 text-xs leading-relaxed text-foreground/70">
                    {m.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Frontend ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Frontend</h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          The web frontend is a standalone Next.js 16 application using React 19, built
          as a static export and served from the{" "}
          <InlineCode>web-next/</InlineCode> directory.
        </p>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs">
            <span className="font-mono font-semibold">7</span>
            <span className="text-muted-foreground">App Routes</span>
          </Badge>
          <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs">
            <span className="font-mono font-semibold">21</span>
            <span className="text-muted-foreground">Components</span>
          </Badge>
          <Badge variant="default" className="gap-1.5 px-3 py-1 text-xs">
            Next.js 16
          </Badge>
          <Badge variant="default" className="gap-1.5 px-3 py-1 text-xs">
            React 19
          </Badge>
          <Badge variant="default" className="gap-1.5 px-3 py-1 text-xs">
            framer-motion
          </Badge>
        </div>

        <Card className="border-border/40 bg-card/30">
          <CardContent className="space-y-3 p-5">
            <p className="text-xs leading-relaxed text-foreground/70">
              The UI follows a glassmorphism design system with an obsidian dark
              background (<InlineCode>#050507</InlineCode>), indigo primary accent
              (<InlineCode>#7c7cff</InlineCode>), translucent cards with backdrop blur,
              and gradient borders. All pages are wrapped with{" "}
              <InlineCode>PageWrapper</InlineCode> for entry animations, and loading
              states use the <InlineCode>Shimmer</InlineCode> skeleton component.
            </p>
            <p className="text-xs leading-relaxed text-foreground/70">
              framer-motion 12 powers all animations using{" "}
              <InlineCode>[number, number, number, number]</InlineCode> easing tuples.
              Reusable animation primitives live in{" "}
              <InlineCode>src/components/motion.tsx</InlineCode> — including{" "}
              <InlineCode>FadeIn</InlineCode>,{" "}
              <InlineCode>StaggerContainer</InlineCode>,{" "}
              <InlineCode>AnimatedNumber</InlineCode>, and{" "}
              <InlineCode>GlassCard</InlineCode>.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ── Database ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Database</h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Noir uses SQLite via <InlineCode>better-sqlite3</InlineCode> for all
          persistent state. The database contains 12 tables covering sessions, trades,
          alerts, strategies, positions, launches, and user preferences.
        </p>

        <Card className="border-border/40 bg-card/30">
          <CardContent className="space-y-3 p-5">
            <p className="text-xs leading-relaxed text-foreground/70">
              Migrations are handled inline in the <InlineCode>initDb()</InlineCode>{" "}
              function using column existence checks — no migration framework required.
              The primary key across all session types is{" "}
              <InlineCode>telegram_id</InlineCode>, which also serves as the identifier
              for web ephemeral sessions and OAuth sessions (OAuth users receive a
              synthetic ID like{" "}
              <InlineCode>oauth_google_&#123;sub&#125;</InlineCode> so all foreign key
              references remain consistent).
            </p>
            <p className="text-xs leading-relaxed text-foreground/70">
              On-chain state is <strong className="text-foreground/80">not</strong>{" "}
              duplicated in the database. For example, the{" "}
              <InlineCode>launches</InlineCode> table stores only metadata (name,
              ticker, description, image URL) while supply and graduation status are
              always fetched from the Aleo blockchain via the Provable explorer API.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
