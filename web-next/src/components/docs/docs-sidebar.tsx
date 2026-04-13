"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Rocket,
  Network,
  ShieldCheck,
  FileCode2,
  Package,
  Server,
  Eclipse,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const DOCS_NAV = [
  { href: "/docs", label: "Overview", icon: BookOpen, exact: true },
  { href: "/docs/getting-started", label: "Getting Started", icon: Rocket },
  { href: "/docs/architecture", label: "Architecture", icon: Network },
  { href: "/docs/privacy-model", label: "Privacy Model", icon: ShieldCheck },
  { href: "/docs/smart-contracts", label: "Smart Contracts", icon: FileCode2 },
  { href: "/docs/sdk", label: "SDK Reference", icon: Package },
  { href: "/docs/api-reference", label: "API Reference", icon: Server },
];

export function DocsSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navContent = (
    <>
      {DOCS_NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href || pathname === item.href + "/"
          : pathname?.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground/60")} />
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-border/40 bg-card/30 backdrop-blur-xl lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center gap-3 border-b border-border/40 px-5">
            <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs font-mono uppercase tracking-widest">Back to App</span>
            </Link>
          </div>
          <div className="flex items-center gap-2.5 border-b border-border/40 px-5 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
              <Eclipse className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold">Noir Docs</div>
              <div className="text-[10px] font-mono text-muted-foreground">v0.1.0</div>
            </div>
          </div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
            {navContent}
          </nav>
          <div className="border-t border-border/40 p-4">
            <a
              href="https://github.com/shaibuafeez/Noir"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-muted-foreground/60 transition-colors hover:text-primary"
            >
              github.com/shaibuafeez/Noir
            </a>
          </div>
        </div>
      </aside>

      {/* Mobile header + drawer */}
      <div className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-border/40 bg-background/70 px-4 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2">
          <Eclipse className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Noir Docs</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-muted-foreground">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed inset-x-0 top-12 z-30 border-b border-border/40 bg-background/95 p-3 backdrop-blur-xl lg:hidden"
          >
            <nav className="space-y-0.5">{navContent}</nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
