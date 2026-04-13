"use client";

import * as React from "react";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VoiceState } from "@/lib/use-voice-session";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ── VoiceOrb: compact animated state indicator ── */
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
    connecting: "shadow-[0_0_12px_hsl(45,90%,50%,0.3)]",
    listening: "shadow-[0_0_16px_hsl(var(--primary)/0.4)]",
    thinking: "shadow-[0_0_12px_hsl(45,90%,50%,0.3)]",
    speaking: "shadow-[0_0_16px_hsl(145,60%,50%,0.4)]",
  };

  return (
    <div className="relative flex items-center justify-center">
      {(state === "listening" || state === "speaking") && (
        <motion.div
          className={cn(
            "absolute rounded-full",
            state === "listening" ? "bg-primary/20" : "bg-emerald-400/20"
          )}
          animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          style={{ width: 36, height: 36 }}
        />
      )}
      <motion.div
        className={cn(
          "relative z-10 flex h-9 w-9 items-center justify-center rounded-full",
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
        <Mic className="h-4 w-4 text-background" />
      </motion.div>
    </div>
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
      className="absolute bottom-0 inset-x-0 z-20 border-t border-border/40 bg-card/80 backdrop-blur-xl px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <VoiceOrb state={state} />

        <div className="flex-1 min-w-0">
          <StateLabel state={state} />
          <AnimatePresence mode="wait">
            {transcript && (
              <motion.p
                key={transcript.slice(0, 20)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-0.5 truncate text-xs text-foreground/70"
              >
                {transcript}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onToggleMic}
          className={cn(
            "h-8 w-8 shrink-0 rounded-full p-0",
            isMuted && "border-destructive/40 text-destructive"
          )}
        >
          {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDisconnect}
          className="h-8 shrink-0 gap-1.5 rounded-full px-3 text-xs"
        >
          <PhoneOff className="h-3.5 w-3.5" />
          End
        </Button>
      </div>
    </motion.div>
  );
}
