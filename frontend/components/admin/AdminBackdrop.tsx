"use client";

import { useEffect, useRef } from "react";
import styles from "./AdminBackdrop.module.css";

/**
 * Primer ancestro con scroll propio. Si el panel monta un contenedor interno
 * con overflow, el parallax debe leerlo a él y no al documento.
 */
function findScrollParent(node: HTMLElement | null): HTMLElement | null {
  let current: HTMLElement | null = node?.parentElement ?? null;
  while (current) {
    const style = window.getComputedStyle(current);
    if (
      /(auto|scroll|overlay)/.test(style.overflowY) &&
      current.scrollHeight > current.clientHeight
    ) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

export function AdminBackdrop() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const scroller = findScrollParent(root);
    let frame = 0;

    // Un único lector de scroll; la escritura de la custom property va en rAF.
    const read = () => {
      frame = 0;
      const y = scroller ? scroller.scrollTop : window.scrollY;
      root.style.setProperty("--admin-scroll", String(Math.round(y)));
    };
    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(read);
    };

    read();
    if (scroller) {
      scroller.addEventListener("scroll", schedule, { passive: true });
    } else {
      window.addEventListener("scroll", schedule, { passive: true });
    }

    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
      if (scroller) {
        scroller.removeEventListener("scroll", schedule);
      } else {
        window.removeEventListener("scroll", schedule);
      }
    };
  }, []);

  return (
    <div ref={ref} className={styles.backdrop} aria-hidden="true">
      <div className={styles.grid} />
      <div className={styles.haloCyan} />
      <div className={styles.haloAmber} />
      <div className={styles.grain} />
    </div>
  );
}
