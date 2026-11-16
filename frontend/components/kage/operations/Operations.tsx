"use client";

import type { ReactNode } from "react";
import { MotionConfig, useReducedMotion } from "framer-motion";
import { KageRoute } from "@/components/kage/KageRoute";
import { WordReveal } from "@/components/kage/WordReveal";
import styles from "./operations.module.css";

interface OperationsFrameProps {
  routeId: string;
  mode?: "ambient" | "internal" | "static";
  world?: "gmp" | "photo";
  children: ReactNode;
  className?: string;
}

export function OperationsFrame({
  routeId,
  mode = "ambient",
  world,
  children,
  className = "",
}: OperationsFrameProps) {
  const reduced = useReducedMotion();
  return (
    <KageRoute routeId={routeId} mode={mode} world={world}>
      <MotionConfig
        reducedMotion="user"
        transition={{ duration: reduced ? 0 : 1.05, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className={`${styles.scope} ${mode === "internal" ? `${styles.internal} ${styles.workspace}` : ""} ${className}`}
          data-operations-mode={mode}
        >
          {children}
        </div>
      </MotionConfig>
    </KageRoute>
  );
}

export function OperationalSurface({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: reduced ? 0 : 1.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={`${styles.scope} ${styles.overlayScope}`}>{children}</div>
    </MotionConfig>
  );
}

export function OperationsIntro({
  id,
  label,
  title,
  body,
  compact = false,
}: {
  id: string;
  label: string;
  title: string;
  body: string;
  compact?: boolean;
}) {
  return (
    <section
      id={id}
      className={`${styles.intro} ${compact ? styles.introCompact : ""}`}
      aria-label={title}
      data-fx="word-reveal"
    >
      <div>
        <p className={styles.eyebrow}>{label}</p>
        <WordReveal as="h1" className={`h-sec ${styles.title}`}>
          {title}
        </WordReveal>
      </div>
      <p className={styles.body}>{body}</p>
    </section>
  );
}
