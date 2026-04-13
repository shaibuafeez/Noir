"use client";

import * as React from "react";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VoiceState } from "@/lib/use-voice-session";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ── VoiceOrb: animated state indicator ── */
function VoiceOrb({ state }: { state: VoiceState }) {
  const colorMap: Record<VoiceState, string> = {
    idle: "bg-muted",
    connecting: "bg-yellow-500/60",
    listening: "bg-primary",
    thinking: "bg-amber-400",
    speaking: "bg-emerald-400",
  };

  const glowMap: Record<VoiceState, string> = {
    idle: "",
    connecting: "shadow-[0_0_24px_hsl(45,90%,50%,0.3)]",
    listening: "shadow-[0_0_32px_hsl(var(--primary)/0.4)]",
    thinking: "shadow-[0_0_24px_hsl(45,90%,50%,0.3)]",
    speaking: "shadow-[0_0_32px_hsl(145,60%,50%,0.4)]",
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse rings for listening/speaking */}
      {(state === "listening" || state === "speaking") && (
        <>
          <motion.div
            className={cn(
              "absolute rounded-full",
              state === "listening" ? "bg-primary/20" : "bg-emerald-400/20"
            )}
            animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            style={{ width: 64, height: 64 }}
          />
          <motion.div
            className={cn(
              "absolute rounded-full",
              state === "listening" ? "bg-primary/15" : "bg-emerald-400/15"
            )}
            animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
            style={{ width: 64, height: 64 }}
          />
        </>
      )}
      {/* Spin for thinking */}
      <motion.div
        className={cn(
          "relative z-10 flex h-16 w-16 items-center justify-center rounded-full",
          colorMap[state],
          glowMap[state]
        )}
        animate={
          state === "thinking"
            ? { rotate: 360 }
            : state === "listening"
            ? { scale: [1, 1.08, 1] }
            : {}
        }
        transition={
          state === "thinking"
            ? { duration: 1.5, repeat: Infinity, ease: "linear" }
            : state === "listening"
            ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
            : {}
        }
      >
        <Mic className="h-6 w-6 text-background" />
      </motion.div>
    </div>
  );
}

/* ── TranscriptBar: rolling text display ── */
function TranscriptBar({ text }: { text: string }) {
  if (!text) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
      className="max-w-md rounded-xl border border-border/40 bg-card/60 px-4 py-3 text-center text-sm backdrop-blur-md"
    >
      <p className="text-foreground/80 leading-relaxed">{text}</p>
    </motion.div>
  );
}

/* ── StateLabel ── */
function StateLabel({ state }: { state: VoiceState }) {
  const labels: Record<VoiceState, string> = {
    idle: "",
    connecting: "Connecting...",
    listening: "Listening",
    thinking: "Processing...",
    speaking: "Speaking",
  };
  if (state === "idle") return null;
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
    >
      {labels[state]}
    </motion.span>
  );
}

/* ── Main VoiceControls component ── */
export function VoiceControls({
  state,
  transcript,
  isMuted,
  onToggleMic,
  onDisconnect,
}: {
  state: VoiceState;
  transcript: string;
  isMuted: boolean;
  onToggleMic: () => void;
  onDisconnect: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-background/80 backdrop-blur-xl"
    >
      <StateLabel state={state} />
      <VoiceOrb state={state} />

      <AnimatePresence mode="wait">
        {transcript && <TranscriptBar key={transcript.slice(0, 20)} text={transcript} />}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleMic}
          className={cn(
            "h-10 w-10 rounded-full p-0",
            isMuted && "border-destructive/40 text-destructive"
          )}
        >
          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDisconnect}
          className="h-10 gap-2 rounded-full px-4"
        >
          <PhoneOff className="h-4 w-4" />
          End
        </Button>
      </div>
    </motion.div>
  );
}
