"use client";

import * as React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
          <div className="max-w-2xl w-full space-y-4">
            <h1 className="text-xl font-bold text-destructive">Runtime Error</h1>
            <pre className="whitespace-pre-wrap break-words rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm font-mono">
              {this.state.error.message}
            </pre>
            <pre className="whitespace-pre-wrap break-words rounded-lg border border-border/40 bg-card/40 p-4 text-xs font-mono text-muted-foreground max-h-64 overflow-auto">
              {this.state.error.stack}
            </pre>
            <button
              onClick={() => this.setState({ error: null })}
              className="rounded-md border border-border/40 px-4 py-2 text-sm hover:bg-accent/30"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
