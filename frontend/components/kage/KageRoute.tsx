"use client";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { useKageRuntime } from "./KageRuntimeProvider";
import type { KageSceneMode, KageWorld } from "./contracts";
const useMountedLayout =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
export interface KageRouteProps {
  routeId: string;
  mode: KageSceneMode;
  world?: KageWorld;
  className?: string;
  children: ReactNode;
}
export function KageRoute({
  routeId,
  mode,
  world = "photo",
  className = "",
  children,
}: KageRouteProps) {
  const runtime = useKageRuntime();
  const root = useRef<HTMLDivElement>(null);
  useMountedLayout(() => {
    if (!root.current) return;
    return runtime.registerRoute({ routeId, mode, world }, root.current);
  }, [runtime, routeId, mode, world]);
  return (
    <div
      ref={root}
      className={`kage-route ${className}`}
      data-kage-route={routeId}
      data-kage-mode={mode}
      data-kage-world={world}
      data-fx="route-handoff"
    >
      {children}
    </div>
  );
}
