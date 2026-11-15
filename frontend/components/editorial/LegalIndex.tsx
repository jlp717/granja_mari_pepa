"use client";
import { useEffect, useState } from "react";
import styles from "./editorial.module.css";
export function LegalIndex({
  label,
  entries,
}: {
  label: string;
  entries: { id: string; title: string }[];
}) {
  const [active, setActive] = useState(entries[0]?.id);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (items) => {
        const visible = items
          .filter((item) => item.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -60% 0px" },
    );
    entries.forEach((entry) => {
      const el = document.getElementById(entry.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [entries]);
  return (
    <nav aria-label={label} className={styles.readingIndex}>
      <p className="eyebrow">{label}</p>
      <ol>
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              className="body"
              href={`#${entry.id}`}
              aria-current={active === entry.id ? "location" : undefined}
              data-cursor
            >
              {entry.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
