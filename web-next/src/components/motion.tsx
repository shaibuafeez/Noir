"use client";

import * as React from "react";
import {
  motion,
  useInView,
  useSpring,
  useTransform,
  useMotionValue,
  type MotionProps,
  type Variants,
  AnimatePresence,
} from "framer-motion";

/* ─── Shared easing & spring configs ─── */
const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ─── FadeIn: fade + slide up on scroll ─── */
export function FadeIn({
  children,
  delay = 0,
  duration = 0.6,
  direction = "up",
  className,
  ...rest
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
} & Omit<MotionProps, "initial" | "animate" | "transition">) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  const offsets = {
    up: { y: 24 },
    down: { y: -24 },
    left: { x: 24 },
    right: { x: -24 },
    none: {},
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...offsets[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : undefined}
      transition={{ duration, delay, ease: EASE_OUT_EXPO }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* ─── StaggerChildren: orchestrate child animations ─── */
const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT_EXPO },
  },
};

export function StaggerContainer({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.08,
            delayChildren: delay + 0.1,
          },
        },
      }}
      initial="hidden"
      animate={isInView ? "show" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

/* ─── AnimatedNumber: smooth counting number ─── */
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const spring = useSpring(0, {
    mass: 0.8,
    stiffness: 75,
    damping: 15,
  });
  const display = useTransform(spring, (current) => format(current));
  const [displayText, setDisplayText] = React.useState(format(0));

  React.useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  React.useEffect(() => {
    const unsubscribe = display.on("change", (v) => setDisplayText(v));
    return unsubscribe;
  }, [display]);

  return <span className={className}>{displayText}</span>;
}

/* ─── GlassCard: glassmorphism card with hover ─── */
export function GlassCard({
  children,
  className,
  hoverGlow = true,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  hoverGlow?: boolean;
} & Omit<MotionProps, "whileHover">) {
  return (
    <motion.div
      className={`glass-card ${className ?? ""}`}
      whileHover={hoverGlow ? { y: -2, transition: { duration: 0.2 } } : undefined}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* ─── PageWrapper: wraps pages with entry animation ─── */
export function PageWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Shimmer: skeleton loading placeholder ─── */
export function Shimmer({
  className,
  width,
  height,
}: {
  className?: string;
  width?: string;
  height?: string;
}) {
  return (
    <div
      className={`shimmer rounded-md ${className ?? ""}`}
      style={{ width, height }}
    />
  );
}

/* ─── PulseGlow: animated glowing dot ─── */
export function PulseGlow({
  color = "primary",
  size = 6,
}: {
  color?: "primary" | "success" | "destructive";
  size?: number;
}) {
  const colorMap = {
    primary: "bg-primary",
    success: "bg-[hsl(var(--success))]",
    destructive: "bg-destructive",
  };
  const glowMap = {
    primary: "shadow-[0_0_8px_hsl(var(--primary)/0.6)]",
    success: "shadow-[0_0_8px_hsl(var(--success)/0.6)]",
    destructive: "shadow-[0_0_8px_hsl(var(--destructive)/0.6)]",
  };

  return (
    <span className="relative flex items-center justify-center">
      <motion.span
        className={`absolute rounded-full ${colorMap[color]} ${glowMap[color]}`}
        style={{ width: size * 1.8, height: size * 1.8 }}
        animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span
        className={`relative rounded-full ${colorMap[color]}`}
        style={{ width: size, height: size }}
      />
    </span>
  );
}

/* ─── HoverScale: subtle scale on hover for interactive elements ─── */
export function HoverScale({
  children,
  className,
  scale = 1.02,
}: {
  children: React.ReactNode;
  className?: string;
  scale?: number;
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}

/* ─── DecryptText: scramble/resolve effect ─── */
export function DecryptText({
  text,
  delay = 0,
  className,
}: {
  text: string;
  delay?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = React.useState(text);
  const chars = "!@#$%^&*0123456789abcdefghijklmnopqrstuvwxyz";

  React.useEffect(() => {
    if (!isInView) return;
    const duration = 800;
    const timeout = setTimeout(() => {
      let startTime: number | null = null;
      const step = (ts: number) => {
        if (!startTime) startTime = ts;
        const elapsed = ts - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const resolved = Math.floor(progress * text.length);
        let result = "";
        for (let i = 0; i < text.length; i++) {
          if (text[i] === " ") {
            result += " ";
          } else if (i < resolved) {
            result += text[i];
          } else {
            result += chars[Math.floor(Math.random() * chars.length)];
          }
        }
        setDisplay(result);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [isInView, text, delay]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

/* ─── SplitText: word-by-word reveal with blur ─── */
export function SplitText({
  children,
  delay = 0,
  className,
}: {
  children: string;
  delay?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const words = children.split(" ");

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          animate={
            isInView
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : undefined
          }
          transition={{
            duration: 0.5,
            delay: delay + i * 0.06,
            ease: EASE_OUT_EXPO,
          }}
        >
          {word}
          {i < words.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </span>
  );
}

/* ─── TiltCard: 3D perspective card on hover ─── */
export function TiltCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), {
    stiffness: 150,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), {
    stiffness: 150,
    damping: 20,
  });

  function handleMouseMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 800,
        transformStyle: "preserve-3d",
      }}
      className={`glass-card ${className ?? ""}`}
    >
      {children}
    </motion.div>
  );
}

export { AnimatePresence, motion };
