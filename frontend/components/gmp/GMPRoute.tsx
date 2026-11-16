"use client";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { useGMPRuntime } from "./GMPRuntimeProvider";
import type { GMPSceneMode, GMPWorld } from "./contracts";
const useMountedLayout =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
export interface GMPRouteProps {
  routeId: string;
  mode: GMPSceneMode;
  world?: GMPWorld;
  className?: string;
  children: ReactNode;
}
export function GMPRoute({
  routeId,
  mode,
  world = "photo",
  className = "",
  children,
}: GMPRouteProps) {
  const runtime = useGMPRuntime();
  const root = useRef<HTMLDivElement>(null);
  useMountedLayout(() => {
    if (!root.current) return;
    return runtime.registerRoute({ routeId, mode, world }, root.current);
  }, [runtime, routeId, mode, world]);
  return (
    <div
      ref={root}
      className={`gmp-route ${className}`}
      data-gmp-route={routeId}
      data-gmp-mode={mode}
      data-gmp-world={world}
      data-fx="route-handoff"
    >
      {children}
    </div>
  );
}
