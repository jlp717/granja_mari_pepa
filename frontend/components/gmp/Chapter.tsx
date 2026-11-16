"use client";
import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { useGMPRuntime } from "./GMPRuntimeProvider";
import type { GMPScene } from "./contracts";
export interface ChapterProps {
  id: string;
  scene: GMPScene;
  title?: string;
  className?: string;
  fx?: string;
  as?: "section" | "article";
  children: ReactNode;
}
export function Chapter({
  id,
  scene,
  title,
  className = "",
  fx = "scene-camera",
  as = "section",
  children,
}: ChapterProps) {
  const runtime = useGMPRuntime();
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!root.current) return;
    const heading = root.current.querySelector("h1,h2,h3");
    const accessibleTitle =
      title ||
      heading?.getAttribute("aria-label") ||
      heading?.textContent?.trim() ||
      id;
    const unregister = runtime.registerChapter(
      { id, scene, title: accessibleTitle },
      root.current,
    );
    return () => {
      unregister();
    };
  }, [runtime, id, scene, title]);
  const hero = className.split(/\s+/).includes("hero");
  const Component = as as ElementType;
  return (
    <Component
      ref={root}
      id={id}
      className={`${hero ? "" : "sec "}${className}`}
      data-cam={scene}
      data-gmp-chapter={id}
      data-fx={fx}
    >
      {children}
    </Component>
  );
}
export { Chapter as GMPChapter };
