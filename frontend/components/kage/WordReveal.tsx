"use client";
import { createElement, useEffect, useRef, type CSSProperties } from "react";
import "./navigation/enhancement.css";
export interface WordRevealProps {
  as?: "h1" | "h2" | "h3" | "p" | "span";
  children: string;
  className?: string;
  delay?: number;
}
/** Kage index.html 87–93,4170–4193. SSR keeps the complete accessible phrase. */
export function WordReveal({
  as = "h2",
  children,
  className = "",
  delay = 0,
}: WordRevealProps) {
  const root = useRef<HTMLElement>(null);
  const phrase = children.replace(/\s+/g, " ").trim();
  useEffect(() => {
    const el = root.current;
    if (!el || as === "h1" || typeof IntersectionObserver === "undefined")
      return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    if (
      reduced.matches ||
      el.getBoundingClientRect().top < document.documentElement.clientHeight
    )
      return;
    el.setAttribute("data-kage-word-wait", "");
    const reveal = () => {
      el.removeAttribute("data-kage-word-wait");
      el.classList.add("rv-in");
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          reveal();
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.04 },
    );
    observer.observe(el);
    const onReduced = () => {
      if (reduced.matches) {
        reveal();
        observer.disconnect();
      }
    };
    reduced.addEventListener("change", onReduced);
    return () => {
      observer.disconnect();
      reduced.removeEventListener("change", onReduced);
      el.removeAttribute("data-kage-word-wait");
    };
  }, [as, phrase]);
  const words = phrase.split(" ");
  return createElement(
    as,
    {
      ref: root,
      "aria-label": phrase,
      "data-fx": "word-reveal",
      className: `display word-reveal ${className}`,
    },
    words.map((word, index) => (
      <span key={`${index}-${word}`}>
        <span className="word-mask" aria-hidden="true">
          <span
            className="word"
            style={
              { "--word-delay": `${delay + index * 40}ms` } as CSSProperties
            }
          >
            {word}
          </span>
        </span>
        {index < words.length - 1 ? " " : null}
      </span>
    )),
  );
}
