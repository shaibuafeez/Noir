"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import {
  Rocket,
  Network,
  ShieldCheck,
  FileCode2,
  Package,
  Server,
  ArrowRight,
  Eclipse,
} from "lucide-react";

const sections = [
  {
    href: "/docs/getting-started",
    icon: Rocket,
    title: "Getting Started",
    description:
      "Install the CLI, connect your wallet, and execute your first private trade in under five minutes.",
  },
  {
    href: "/docs/architecture",
    icon: Network,
    title: "Architecture",
    description:
      "Dual-LLM agent, WebSocket relay, SQLite state, and three Leo programs working in concert.",
  },
  {
    href: "/docs/privacy-model",
    icon: ShieldCheck,
    title: "Privacy Model",
    description:
      "How zero-knowledge proofs, record encryption, and zkLogin keep your strategies invisible on-chain.",
  },
  {
    href: "/docs/smart-contracts",
    icon: FileCode2,
    title: "Smart Contracts",
    description:
      "Reference for ghost_trade_v3, ghost_zklogin_v2, and ghost_launchpad_v2 — every transition and record type.",
  },
  {
    href: "/docs/sdk",
    icon: Package,
    title: "SDK Reference",
    description:
      "TypeScript SDK for programmatic access: trades, strategies, proofs, and launchpad operations.",
  },
  {
    href: "/docs/api",
    icon: Server,
    title: "API Reference",
    description:
      "REST and WebSocket endpoints — authentication, request schemas, response types, and error codes.",
  },
];

const stats = [
  { label: "Leo Programs", value: "3" },
  { label: "Transitions", value: "13" },
  { label: "Interfaces", value: "6" },
  { label: "Tests", value: "136" },
  { label: "Backend Modules", value: "28" },
  { label: "SDK (npm)", value: "1" },
];

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 py-12">
      {/* ── Hero ── */}
      <section className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/25">
          <Eclipse className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Noir Documentation
        </h1>
        <p className="mx-auto max-w-xl text-base text-foreground/80">
          The private AI trading agent built on Aleo. Trade with zero-knowledge
          proofs — your strategies stay invisible.
        </p>
      </section>

      {/* ── Section Cards ── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="group">
            <Card className="h-full border border-border/40 bg-card/30 hover:bg-accent/30 hover:border-border/60 transition-all">
              <CardContent className="flex h-full flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8 text-primary/70">
                    <s.icon className="h-4.5 w-4.5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-semibold">{s.title}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-foreground/70">
                    {s.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      {/* ── Quick Numbers ── */}
      <section className="space-y-4">
        <h2 className="text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Quick Numbers
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {stats.map((s) => (
            <Badge
              key={s.label}
              variant="outline"
              className="gap-1.5 px-3 py-1 text-xs"
            >
              <span className="font-mono font-semibold">{s.value}</span>
              <span className="text-muted-foreground">{s.label}</span>
            </Badge>
          ))}
        </div>
      </section>
    </div>
  );
}
