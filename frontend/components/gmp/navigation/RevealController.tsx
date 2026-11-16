"use client";

import { useEffect } from "react";

const SELECTOR = "[data-rv], .word-reveal";

type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout: number },
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/**
 * Single global reveal controller, mounted once in the root layout.
 *
 * It owns the only IntersectionObserver for `[data-rv]` / `.word-reveal`
 * elements, so scrolling never disconnects it (the old per-`Chapter` observers
 * died on every GMP re-render). SSR ships no wait attributes: without JS
 * everything stays visible.
 *
 * The controller waits for an idle frame before touching the DOM. React
 * hydrates streamed Suspense boundaries progressively; mutating attributes
 * before a boundary hydrates produces hydration warnings. Nothing is hidden
 * while we wait because `data-gmp-wait` is only added by this controller.
 */
export function RevealController() {
  useEffect(() => {
    if (
      typeof IntersectionObserver === "undefined" ||
      typeof MutationObserver === "undefined"
    ) {
      return;
    }

    const view = window as IdleWindow;
    let cancelled = false;
    let idleHandle: number | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    let teardown: (() => void) | null = null;

    const start = () => {
      if (cancelled) return;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
      const reduced = () => reduce.matches;

      const seen = new Set<HTMLElement>();
      const timers = new Map<HTMLElement, ReturnType<typeof setTimeout>>();

      const revealNow = (el: HTMLElement) => {
        el.removeAttribute("data-gmp-wait");
        el.removeAttribute("data-gmp-word-wait");
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
            el.dataset.rvd = String(
              index * 85 + Number(el.dataset.rvDelay || 0),
            );
            if (
              reduced() ||
              el.getBoundingClientRect().top <
                document.documentElement.clientHeight
            ) {
              revealNow(el);
              return;
            }
            if (el.classList.contains("word-reveal")) {
              el.setAttribute("data-gmp-word-wait", "");
            } else {
              el.setAttribute("data-gmp-wait", "");
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
          "[data-rv][data-gmp-wait], .word-reveal[data-gmp-word-wait]",
        );
        strays.forEach((el) => {
          // Only reveal elements that already scrolled past above the viewport.
          if (el.getBoundingClientRect().bottom >= 0) return;
          const timer = timers.get(el);
          if (timer !== undefined) {
            clearTimeout(timer);
            timers.delete(el);
          }
          el.removeAttribute("data-gmp-wait");
          el.removeAttribute("data-gmp-word-wait");
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

      teardown = () => {
        observer.disconnect();
        mutation.disconnect();
        timers.forEach((timer) => clearTimeout(timer));
        reduce.removeEventListener("change", onReduced);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        if (raf !== null) cancelAnimationFrame(raf);
      };
    };

    if (typeof view.requestIdleCallback === "function") {
      idleHandle = view.requestIdleCallback(() => start(), { timeout: 1200 });
    } else {
      timeoutHandle = setTimeout(start, 300);
    }

    return () => {
      cancelled = true;
      if (idleHandle !== null && view.cancelIdleCallback) {
        view.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== null) clearTimeout(timeoutHandle);
      teardown?.();
    };
  }, []);

  return null;
}
