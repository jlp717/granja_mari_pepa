"use client";
import { useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { useGMPRuntime } from "../GMPRuntimeProvider";
import { useGMPValue } from "./useGMPValue";
import { getGMPNavigationCopy } from "@/lib/gmp-navigation-copy";
export function ChapterRail() {
  const runtime = useGMPRuntime(),
    locale = useLocale(),
    copy = getGMPNavigationCopy(locale);
  const chapters = useGMPValue((snapshot) => snapshot.chapters);
  const index = useGMPValue((snapshot) => snapshot.railIndex);
  const mode = useGMPValue((snapshot) => snapshot.mode);
  if (chapters.length < 2 || mode === "internal" || mode === "static")
    return null;
  return (
    <nav
      id="rail"
      className="rail"
      aria-label={copy.chapters}
      data-fx="chapter-rail"
    >
      {chapters.map((chapter, i) => (
        <button
          key={chapter.id}
          type="button"
          className={i === index ? "on" : ""}
          aria-label={chapter.title || `${i + 1} · ${chapter.id}`}
          aria-current={i === index ? "location" : undefined}
          title={chapter.title || chapter.id}
          onClick={() => runtime.navigateToChapter(chapter.id)}
          data-cursor
        >
          <i />
        </button>
      ))}
    </nav>
  );
}
export function NavigationContinuity() {
  const routeId = useGMPValue((snapshot) => snapshot.routeId),
    previous = useRef(routeId);
  useEffect(() => {
    if (!routeId || previous.current === routeId) return;
    if (!previous.current) {
      previous.current = routeId;
      return;
    }
    previous.current = routeId;
    const frame = requestAnimationFrame(() =>
      document.getElementById("main-content")?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [routeId]);
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      const href = link?.getAttribute("href");
      if (
        !link ||
        !href?.startsWith("#") ||
        href.length < 2 ||
        link.hasAttribute("download") ||
        (link.target && link.target !== "_self")
      )
        return;
      let id: string;
      try {
        id = decodeURIComponent(href.slice(1));
      } catch {
        return;
      }
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      if (window.location.hash !== href) history.pushState(null, "", href);
      const top =
        id === "top" ? 0 : target.getBoundingClientRect().top + scrollY - 40;
      scrollTo({
        top,
        behavior: matchMedia("(prefers-reduced-motion:reduce)").matches
          ? "auto"
          : "smooth",
      });
      if (id === "main-content") target.focus({ preventScroll: true });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
