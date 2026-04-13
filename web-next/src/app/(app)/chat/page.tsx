"use client";

import * as React from "react";
import {
  Send,
  Sparkles,
  Trash2,
  Check,
  X,
  Zap,
  Terminal,
  Headset,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence } from "framer-motion";
import { FadeIn, PageWrapper, PulseGlow, motion } from "@/components/motion";
import { cn } from "@/lib/utils";
import { useWs } from "@/lib/ws-context";
import { SessionWalletBanner } from "@/components/session-wallet";
import { VoiceControls } from "@/components/voice-controls";
import { useVoiceSession } from "@/lib/use-voice-session";

const SUGGESTIONS = [
  { icon: Sparkles, label: "Portfolio", prompt: "show my portfolio" },
  { icon: Zap, label: "DCA setup", prompt: "dca $25 into ALEO every day" },
  { icon: Terminal, label: "Limit order", prompt: "buy 500 ALEO if price drops to $0.45" },
  { icon: Sparkles, label: "Go Dark", prompt: "go dark" },
  { icon: Sparkles, label: "Alert", prompt: "alert me when ALEO goes above $1.00" },
  { icon: Sparkles, label: "Copy trader", prompt: "copy trader whale_0x" },
];

export default function ChatPage() {
  const { connected, walletAddress, messages, send, confirm, cancel, clearMessages, sendVoiceAction, onVoiceResponse } =
    useWs();
  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const [voiceMode, setVoiceMode] = React.useState(false);

  const voice = useVoiceSession({ sendVoiceAction });

  // Register voice response callback when voice mode is active
  React.useEffect(() => {
    if (voiceMode) {
      onVoiceResponse((message) => {
        voice.handleActionResult(message);
        // Also show in chat
        // (messages are added via the fallback in ws-context if no callback)
      });
    } else {
      onVoiceResponse(null);
    }
    return () => onVoiceResponse(null);
  }, [voiceMode, onVoiceResponse, voice.handleActionResult]);

  const handleVoiceToggle = React.useCallback(() => {
    if (voiceMode) {
      voice.disconnect();
      setVoiceMode(false);
    } else {
      voice.connect();
      setVoiceMode(true);
    }
  }, [voiceMode, voice]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    send(trimmed);
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <PageWrapper className="flex h-[calc(100vh-8rem)] flex-col gap-4 md:h-[calc(100vh-3rem)]">
      {/* Header */}
      <FadeIn className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Chat</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Talk to your agent in natural language
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={connected ? "success" : "destructive"} className="gap-1.5">
            <PulseGlow color={connected ? "success" : "destructive"} size={4} />
            {connected ? "live" : "offline"}
          </Badge>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearMessages}>
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </FadeIn>

      {/* Chat surface */}
      <Card className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          {/* Voice overlay */}
          <AnimatePresence>
            {voiceMode && voice.state !== "idle" && (
              <VoiceControls
                state={voice.state}
                transcript={voice.transcript}
                isMuted={voice.isMuted}
                onToggleMic={voice.toggleMic}
                onDisconnect={() => {
                  voice.disconnect();
                  setVoiceMode(false);
                }}
              />
            )}
          </AnimatePresence>
          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto px-4 py-6 md:px-6"
          >
            {messages.length === 0 ? (
              <EmptyState
                walletAddress={walletAddress}
                connected={connected}
                onSuggest={(p) => {
                  setInput(p);
                  inputRef.current?.focus();
                }}
              />
            ) : (
              messages.map((m, i) => (
                <MessageBubble
                  key={m.id}
                  sender={m.sender}
                  text={m.text}
                  confirmKey={m.confirmKey}
                  onConfirm={confirm}
                  onCancel={cancel}
                  index={i}
                />
              ))
            )}
          </div>

          {/* Session wallet + Input */}
          <div className="border-t border-border/40 bg-background/30 p-3 backdrop-blur-sm md:p-4">
            <SessionWalletBanner />
            <div className="flex items-end gap-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2 backdrop-blur-sm transition-all focus-within:border-primary/40 focus-within:shadow-[0_0_16px_hsl(var(--primary)/0.08)]">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  connected
                    ? "Ask anything: buy, sell, dca, status, copy..."
                    : "Reconnecting..."
                }
                disabled={!connected}
                rows={1}
                className="min-h-[24px] flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 disabled:opacity-50"
                style={{ maxHeight: "160px" }}
              />
              <Button
                size="sm"
                variant={voiceMode ? "destructive" : "outline"}
                onClick={handleVoiceToggle}
                disabled={!connected}
                className="h-8 shrink-0 gap-1.5 px-2.5"
                title={voiceMode ? "End voice chat" : "Start live voice chat"}
              >
                <Headset className="h-3.5 w-3.5" />
                <span className="text-[11px] hidden sm:inline">
                  {voiceMode ? "End" : "Voice"}
                </span>
              </Button>
              <Button
                size="sm"
                onClick={handleSend}
                disabled={!connected || !input.trim()}
                className="h-8 shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-muted-foreground/60">
              <span>
                <kbd className="rounded border border-border/40 bg-muted/40 px-1 py-0.5 font-mono text-[10px]">
                  Enter
                </kbd>{" "}
                to send ·{" "}
                <kbd className="rounded border border-border/40 bg-muted/40 px-1 py-0.5 font-mono text-[10px]">
                  Shift+Enter
                </kbd>{" "}
                newline
              </span>
              <span className="font-mono">
                {input.length > 0 ? `${input.length} chars` : "\u00A0"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}

function EmptyState({
  walletAddress,
  connected,
  onSuggest,
}: {
  walletAddress: string | null;
  connected: boolean;
  onSuggest: (prompt: string) => void;
}) {
  return (
    <FadeIn className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/8">
        <Terminal className="h-6 w-6 text-primary" />
        <div className="absolute -inset-2 -z-10 rounded-3xl bg-primary/5 blur-xl" />
      </div>
      <h3 className="mt-5 text-lg font-semibold">Welcome to Noir</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Your private Aleo trading agent. Type a command below, or try one of these:
      </p>
      {walletAddress && (
        <div className="mt-4 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 font-mono text-[11px] text-muted-foreground backdrop-blur-sm">
          {walletAddress.slice(0, 10)}…{walletAddress.slice(-6)}
        </div>
      )}
      <div className="mt-8 grid w-full grid-cols-2 md:grid-cols-3 gap-2">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.label}
            disabled={!connected}
            onClick={() => onSuggest(s.prompt)}
            className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/30 px-3 py-3 text-left text-xs backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-primary/5 disabled:opacity-50"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
          >
            <s.icon className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span>{s.label}</span>
          </motion.button>
        ))}
      </div>
    </FadeIn>
  );
}

function MessageBubble({
  sender,
  text,
  confirmKey,
  onConfirm,
  onCancel,
  index,
}: {
  sender: "user" | "bot";
  text: string;
  confirmKey?: string;
  onConfirm: (key: string) => void;
  onCancel: (key: string) => void;
  index: number;
}) {
  const isUser = sender === "user";
  return (
    <motion.div
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-bold",
          isUser
            ? "bg-primary/12 text-primary ring-1 ring-primary/20"
            : "bg-muted text-muted-foreground",
        )}
      >
        {isUser ? "YOU" : "N"}
      </div>
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-2",
          isUser && "items-end",
        )}
      >
        <div
          className={cn(
            "rounded-xl px-4 py-3 text-sm",
            isUser
              ? "bg-primary/10 text-foreground ring-1 ring-primary/15"
              : "border border-border/40 bg-card/40 backdrop-blur-sm",
          )}
        >
          <pre className="whitespace-pre-wrap break-words font-sans leading-relaxed">
            {text}
          </pre>
        </div>
        {confirmKey && (
          <motion.div
            className="flex gap-2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Button
              size="sm"
              onClick={() => onConfirm(confirmKey)}
              className="h-7 bg-[hsl(var(--success))] text-background hover:bg-[hsl(var(--success))]/90"
            >
              <Check className="h-3.5 w-3.5" />
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCancel(confirmKey)}
              className="h-7"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
