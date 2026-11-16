"use client";

import { useEffect } from "react";

const SELECTOR = "[data-rv], .word-reveal";

/**
 * Single global reveal controller, mounted once in the root layout.
 *
 * It owns the only IntersectionObserver for `[data-rv]` / `.word-reveal`
 * elements, so scrolling never disconnects it (the old per-`Chapter` observers
 * died on every Kage re-render). SSR ships no wait attributes: without JS
 * everything stays visible. With JS, above-the-fold elements reveal
 * immediately and below-the-fold elements get a wait attribute plus a
 * per-parent stagger (`data-rvd`) before `rv-in`.
 */
export function RevealController() {
  useEffect(() => {
    if (
      typeof IntersectionObserver === "undefined" ||
      typeof MutationObserver === "undefined"
    ) {
      return;
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduced = () => reduce.matches;

    const seen = new Set<HTMLElement>();
    const timers = new Map<HTMLElement, ReturnType<typeof setTimeout>>();

    const revealNow = (el: HTMLElement) => {
      el.removeAttribute("data-kage-wait");
      el.removeAttribute("data-kage-word-wait");
      el.classList.add("rv-in");
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          const el = entry.target as HTMLElement;
          const timer = setTimeout(
            () => {
              revealNow(el);
              timers.delete(el);
            },
            reduced() ? 0 : Number(el.dataset.rvd || 0),
          );
          timers.set(el, timer);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.04 },
    );

    const bind = (root: ParentNode) => {
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(SELECTOR));
      if (root instanceof HTMLElement && root.matches(SELECTOR)) {
        nodes.push(root);
      }

      const groups = new Map<HTMLElement | null, HTMLElement[]>();
      for (const el of nodes) {
        if (seen.has(el) || el.classList.contains("rv-in")) continue;
        const group = groups.get(el.parentElement) || [];
        group.push(el);
        groups.set(el.parentElement, group);
      }

      groups.forEach((group) => {
        group.forEach((el, index) => {
          if (seen.has(el)) return;
          seen.add(el);
          el.dataset.rvd = String(index * 85 + Number(el.dataset.rvDelay || 0));
          if (
            reduced() ||
            el.getBoundingClientRect().top <
              document.documentElement.clientHeight
          ) {
            revealNow(el);
            return;
          }
          if (el.classList.contains("word-reveal")) {
            el.setAttribute("data-kage-word-wait", "");
          } else {
            el.setAttribute("data-kage-wait", "");
          }
          observer.observe(el);
        });
      });
    };

    const revealAll = () => {
      document.querySelectorAll<HTMLElement>(SELECTOR).forEach(revealNow);
    };

    const onReduced = () => {
      if (reduce.matches) revealAll();
    };

    const sweep = () => {
      const strays = document.querySelectorAll<HTMLElement>(
        "[data-rv][data-kage-wait], .word-reveal[data-kage-word-wait]",
      );
      strays.forEach((el) => {
        // Only reveal elements that already scrolled past above the viewport.
        if (el.getBoundingClientRect().bottom >= 0) return;
        const timer = timers.get(el);
        if (timer !== undefined) {
          clearTimeout(timer);
          timers.delete(el);
        }
        el.removeAttribute("data-kage-wait");
        el.removeAttribute("data-kage-word-wait");
        el.classList.add("rv-in");
      });
    };

    let raf: number | null = null;
    const onScroll = () => {
      if (raf !== null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        sweep();
      });
    };

    const mutation = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) bind(node);
        });
      }
    });

    bind(document.body);
    mutation.observe(document.body, { childList: true, subtree: true });
    reduce.addEventListener("change", onReduced);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      observer.disconnect();
      mutation.disconnect();
      timers.forEach((timer) => clearTimeout(timer));
      reduce.removeEventListener("change", onReduced);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
