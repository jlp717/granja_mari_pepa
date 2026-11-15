"use client";
import { createElement, useEffect, useRef, type ReactNode } from "react";
import { useKageRuntime } from "./KageRuntimeProvider";
import type { KageScene } from "./contracts";
import { prepareSectionReveals } from "./navigation/reveals";
export interface ChapterProps {
  id: string;
  scene: KageScene;
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
  const runtime = useKageRuntime();
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
    const cleanReveals = prepareSectionReveals(root.current);
    return () => {
      cleanReveals();
      unregister();
    };
  }, [runtime, id, scene, title]);
  const hero = className.split(/\s+/).includes("hero");
  return createElement(
    as,
    {
      ref: root,
      id,
      className: `${hero ? "" : "sec "}${className}`,
      "data-cam": scene,
      "data-kage-chapter": id,
      "data-fx": fx,
    },
    children,
  );
}
export { Chapter as KageChapter };
