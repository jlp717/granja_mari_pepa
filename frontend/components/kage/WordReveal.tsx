import { createElement, type CSSProperties } from "react";

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
  const phrase = children.replace(/\s+/g, " ").trim();
  const words = phrase.split(" ");
  return createElement(
    as,
    {
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
