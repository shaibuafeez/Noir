"use client";

import * as React from "react";
import { Eclipse } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWs } from "@/lib/ws-context";

const GHOST_CHARS = "NOIR".split("");
const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
const AUTO_DISMISS_MS = 4000;

export function PreloaderGate({ children }: { children: React.ReactNode }) {
  const { connected } = useWs();
  const [show, setShow] = React.useState(true);
  const [progress, setProgress] = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Progress bar: ramp fast to 70%, then crawl
  React.useEffect(() => {
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        if (p < 70) return p + 3;
        return p + 0.3;
      });
    }, 50);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-dismiss timeout
  React.useEffect(() => {
    timeoutRef.current = setTimeout(() => setShow(false), AUTO_DISMISS_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Dismiss on connect
  React.useEffect(() => {
    if (connected && show) {
      setProgress(100);
      const t = setTimeout(() => setShow(false), 400);
      return () => clearTimeout(t);
    }
  }, [connected, show]);

  return (
    <>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            key="preloader"
            className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-background"
            exit={{
              opacity: 0,
              scale: 1.15,
              filter: "blur(8px)",
            }}
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          >
            {/* Noir icon with glow */}
            <div className="relative mb-8">
              <motion.div
                className="absolute -inset-6 rounded-full bg-primary/20 blur-2xl"
                animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <Eclipse className="relative h-12 w-12 text-primary" />
            </div>

            {/* GHOST text with staggered chars */}
            <div className="flex gap-1">
              {GHOST_CHARS.map((char, i) => (
                <motion.span
                  key={i}
                  className="text-2xl font-semibold tracking-[0.2em] text-foreground"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.2 + i * 0.08,
                    duration: 0.5,
                    ease: EASE_OUT_EXPO,
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </div>

            {/* Progress bar */}
            <div className="mt-8 h-[2px] w-48 overflow-hidden rounded-full bg-border/40">
              <motion.div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.15, ease: "linear" }}
              />
            </div>

            {/* Status text */}
            <motion.p
              className="mt-4 font-mono text-xs tracking-wider text-muted-foreground/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              connecting to aleo...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
