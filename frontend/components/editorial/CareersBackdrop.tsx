"use client";

import { useEffect, useRef } from "react";
import styles from "./careers.module.css";

/* Real photographs of the Lorca site. The sequence is built as a camera dolly:
   the same four photographs are cropped at eight stops so the background
   travels across the building instead of cutting between stills. No invented
   places, no stock imagery. */
const FRAMES = [
  { src: "/kage/careers/careers-03.jpg", pos: "56% 42%", drift: 1.0 },
  { src: "/kage/careers/careers-01.jpg", pos: "62% 40%", drift: -0.7 },
  { src: "/kage/careers/careers-02.jpg", pos: "36% 44%", drift: 0.8 },
  { src: "/kage/careers/careers-04.jpg", pos: "48% 36%", drift: -0.9 },
  { src: "/kage/careers/careers-01.jpg", pos: "58% 42%", drift: 0.6 },
  { src: "/kage/careers/careers-03.jpg", pos: "44% 40%", drift: -0.6 },
  { src: "/kage/careers/careers-04.jpg", pos: "52% 34%", drift: 0.9 },
  { src: "/kage/careers/careers-02.jpg", pos: "30% 46%", drift: -0.5 },
];

export function CareersBackdrop() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const layers = Array.from(
      element.querySelectorAll<HTMLElement>("[data-frame]"),
    );
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let anchors: number[] = [];
    let frameHandle = 0;
    let queued = false;

    const measure = () => {
      anchors = Array.from(
        document.querySelectorAll<HTMLElement>("[data-kage-chapter]"),
      ).map((section) => {
        const rect = section.getBoundingClientRect();
        return (
          rect.top +
          window.scrollY +
          rect.height * 0.5 -
          window.innerHeight * 0.5
        );
      });
    };

    const paint = () => {
      queued = false;
      if (!anchors.length) return;
      const y = window.scrollY;
      let index = 0;
      while (index < anchors.length - 2 && y > anchors[index + 1]) index += 1;
      const start = anchors[index];
      const end = anchors[index + 1] ?? start + 1;
      const local = Math.min(
        1,
        Math.max(0, (y - start) / Math.max(1, end - start)),
      );
      const span = Math.max(1, anchors.length - 1);
      const frame = Math.min(
        FRAMES.length - 1,
        Math.max(0, ((index + local) / span) * (FRAMES.length - 1)),
      );

      layers.forEach((layer, i) => {
        const distance = frame - i;
        const fade = Math.min(1, Math.max(0, 1 - Math.abs(distance) * 0.82));
        const opacity = reduce.matches ? (Math.abs(distance) < 0.5 ? 1 : 0) : fade;
        layer.style.opacity = opacity.toFixed(3);
        if (!reduce.matches) {
          const drift = FRAMES[i].drift;
          const x = distance * 22 * drift;
          const yShift = distance * -16;
          const scale = (1.06 + Math.abs(distance) * 0.018).toFixed(3);
          layer.style.transform = `translate3d(${x.toFixed(2)}px, ${yShift.toFixed(2)}px, 0) scale(${scale})`;
        }
      });
      element.dataset.progress = (frame / (FRAMES.length - 1)).toFixed(3);
    };

    const request = () => {
      if (queued) return;
      queued = true;
      frameHandle = requestAnimationFrame(paint);
    };

    measure();
    paint();

    const observer = new ResizeObserver(() => {
      measure();
      request();
    });
    observer.observe(document.body);

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    reduce.addEventListener?.("change", request);

    return () => {
      cancelAnimationFrame(frameHandle);
      observer.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      reduce.removeEventListener?.("change", request);
    };
  }, []);

  return (
    <div ref={root} className={styles.backdrop} aria-hidden="true">
      {FRAMES.map((frame, i) => (
        <div
          key={`${frame.src}-${i}`}
          data-frame={i}
          className={styles.backdropFrame}
          style={{
            backgroundImage: `url(${frame.src})`,
            backgroundPosition: frame.pos,
          }}
        />
      ))}
      <div className={styles.backdropGrain} />
      <div className={styles.backdropGrade} />
    </div>
  );
}
