"use client";
import { useEffect, useRef } from "react";
/** GMP index.html 4408–4425. DOM ring; scene wisps remain owned by Motion. */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const dot = root.current;
    if (!dot) return;
    const fine = matchMedia("(hover:hover) and (pointer:fine)");
    const reduced = matchMedia("(prefers-reduced-motion:reduce)");
    let x = document.documentElement.clientWidth / 2,
      y = document.documentElement.clientHeight / 2;
    let targetX = x,
      targetY = y,
      frame = 0;
    const paint = () => {
      dot.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    };
    const tick = () => {
      x += (targetX - x) * 0.18;
      y += (targetY - y) * 0.18;
      paint();
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      dot.style.display = fine.matches ? "" : "none";
      if (fine.matches && !reduced.matches && !document.hidden)
        frame = requestAnimationFrame(tick);
    };
    const move = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (reduced.matches) {
        x = targetX;
        y = targetY;
        paint();
      }
    };
    const over = (event: PointerEvent) => {
      const target = event.target;
      dot.classList.toggle(
        "act",
        target instanceof Element &&
          Boolean(target.closest("[data-cursor],a,button")),
      );
    };
    const leave = () => dot.classList.remove("act");
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over, { passive: true });
    document.addEventListener("pointerleave", leave, { passive: true });
    document.addEventListener("visibilitychange", sync);
    fine.addEventListener("change", sync);
    reduced.addEventListener("change", sync);
    sync();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", sync);
      fine.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
    };
  }, []);
  return (
    <div
      ref={root}
      className="cur-dot"
      id="cursor"
      aria-hidden="true"
      data-fx="cursor-trail"
    />
  );
}
