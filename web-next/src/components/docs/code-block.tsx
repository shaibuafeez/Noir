"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function CodeBlock({
  code,
  language = "typescript",
  filename,
  className,
}: {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("group relative rounded-lg border border-border/40 bg-[#0a0a12] overflow-hidden", className)}>
      {filename && (
        <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
          <span className="font-mono text-[11px] text-gray-400">{filename}</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-gray-500">{language}</span>
        </div>
      )}
      <div className="relative">
        <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
          <code className="font-mono text-gray-200">{code}</code>
        </pre>
        <button
          onClick={copy}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md border border-gray-700 bg-gray-800/60 text-gray-400 opacity-0 backdrop-blur-sm transition-all hover:border-primary/30 hover:text-primary group-hover:opacity-100"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[hsl(var(--success))]" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md border border-border/40 bg-muted/30 px-1.5 py-0.5 font-mono text-[13px] text-primary/90">
      {children}
    </code>
  );
}
