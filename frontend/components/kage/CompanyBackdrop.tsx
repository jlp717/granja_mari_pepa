"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/lib/navigation";
import styles from "./company-backdrop.module.css";

type Frame = { src: string; pos: string; drift: number };

function photo(src: string, pos: string, drift: number): Frame {
  return { src, pos, drift };
}

const FRAME_SETS: Record<string, Frame[]> = {
  home: [
    photo("/kage/careers/careers-facility.jpg", "50% 55%", 1.0),
    photo("/kage/careers/careers-03.jpg", "55% 50%", -0.7),
    photo("/kage/mp/plates/invernaderos.webp", "50% 50%", 0.8),
  ],
  productos: [
    photo("/kage/careers/careers-facility.jpg", "50% 46%", 1.0),
    photo("/kage/careers/careers-01.jpg", "52% 48%", -0.7),
    photo("/kage/mp/plates/invernaderos.webp", "50% 50%", 0.8),
  ],
  acerca: [
    photo("/kage/careers/careers-03.jpg", "50% 55%", 1.0),
    photo("/kage/careers/careers-facility.jpg", "55% 48%", -0.7),
    photo("/kage/mp/plates/invernaderos.webp", "50% 50%", 0.8),
  ],
  calidad: [
    photo("/kage/careers/careers-01.jpg", "50% 50%", 1.0),
    photo("/kage/careers/careers-facility.jpg", "52% 46%", -0.7),
    photo("/kage/mp/plates/invernaderos.webp", "50% 48%", 0.8),
  ],
  reparto: [
    photo("/kage/careers/careers-03.jpg", "55% 52%", 1.0),
    photo("/kage/careers/careers-04.jpg", "50% 46%", -0.7),
    photo("/kage/mp/plates/invernaderos.webp", "52% 48%", 0.8),
  ],
  lorca: [
    photo("/kage/careers/careers-facility.jpg", "50% 44%", 1.0),
    photo("/kage/careers/careers-03.jpg", "52% 46%", -0.7),
    photo("/kage/careers/careers-04.jpg", "55% 50%", 0.8),
  ],
  "preguntas-frecuentes": [
    photo("/kage/careers/careers-facility.jpg", "50% 46%", 1.0),
    photo("/catalogs/familias/real-panaderia-1.jpg", "52% 48%", -0.7),
  ],
  contacto: [
    photo("/kage/careers/careers-03.jpg", "50% 44%", 1.0),
    photo("/kage/careers/careers-facility.jpg", "52% 50%", -0.7),
  ],
  "area-clientes": [
    photo("/kage/careers/careers-facility.jpg", "50% 50%", 1.0),
    photo("/catalogs/familias/real-mar-1.jpg", "52% 48%", -0.7),
  ],
  checkout: [photo("/catalogs/familias/real-mar-1.jpg", "50% 46%", 1.0)],
  legal: [photo("/kage/careers/careers-03.jpg", "50% 46%", 1.0)],
  default: [
    photo("/kage/careers/careers-03.jpg", "50% 46%", 1.0),
    photo("/kage/mp/plates/invernaderos.webp", "50% 46%", -0.7),
    photo("/kage/careers/careers-04.jpg", "55% 52%", 0.8),
  ],
};

function framesFor(pathname: string) {
  const key = pathname.split("/").filter(Boolean)[0] ?? "home";
  if (key === "legal") return FRAME_SETS.legal;
  return FRAME_SETS[key] ?? FRAME_SETS.default;
}

export function CompanyBackdrop() {
  const pathname = usePathname();
  const frames = framesFor(pathname);
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
    let cancelled = false;

    // Loads a frame into its own layer. `priority` marks the first paint so the
    // browser does not deprioritise it behind other work. If the image fails,
    // the layer stays transparent (the backdrop gradient shows) and the next
    // candidate frame is tried instead of leaving a hole.
    const loadFrame = (index: number, priority = false) => {
      const layer = layers[index];
      if (!layer) return;
      const ordered = [
        frames[index],
        ...frames.filter((_, i) => i !== index),
      ].filter((frame): frame is Frame => Boolean(frame));
      let attempt = 0;

      const tryNext = () => {
        if (cancelled) return;
        const frame = ordered[attempt];
        attempt += 1;
        if (!frame) {
          layer.style.backgroundImage = "none";
          return;
        }
        const image = new Image();
        if (priority && "fetchPriority" in image) {
          (
            image as HTMLImageElement & { fetchPriority?: string }
          ).fetchPriority = "high";
        }
        image.decoding = "async";
        image.onload = () => {
          if (cancelled) return;
          layer.style.backgroundImage = `url(${frame.src})`;
        };
        image.onerror = () => {
          image.onerror = null;
          image.onload = null;
          tryNext();
        };
        image.src = `/_next/image?url=${encodeURIComponent(frame.src)}&w=1200&q=62`;
      };

      tryNext();
    };

    const loadRest = () => {
      for (let index = 1; index < frames.length; index += 1) loadFrame(index);
    };
    let restLoaded = false;
    const loadOnScroll = () => {
      if (restLoaded) return;
      restLoaded = true;
      loadRest();
      window.removeEventListener("scroll", loadOnScroll);
    };
    window.addEventListener("scroll", loadOnScroll, { passive: true });

    // First frame paints immediately: no requestIdleCallback, no timeout. On a
    // busy main thread idle callbacks can land seconds late and the page reads
    // as a black screen until then.
    loadFrame(0, true);

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
      if (!anchors.length) {
        const max = Math.max(
          1,
          document.body.scrollHeight - window.innerHeight,
        );
        const progress = Math.min(1, Math.max(0, window.scrollY / max));
        const frame = progress * (frames.length - 1);
        layers.forEach((layer, i) => {
          const distance = Math.abs(frame - i);
          layer.style.opacity = (
            reduce.matches
              ? distance < 0.5
                ? 1
                : 0
              : Math.max(0, 1 - distance * 0.82)
          ).toFixed(3);
        });
        return;
      }
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
        frames.length - 1,
        Math.max(0, ((index + local) / span) * (frames.length - 1)),
      );

      layers.forEach((layer, i) => {
        const distance = frame - i;
        const fade = Math.min(1, Math.max(0, 1 - Math.abs(distance) * 0.82));
        layer.style.opacity = (
          reduce.matches ? (Math.abs(distance) < 0.5 ? 1 : 0) : fade
        ).toFixed(3);
        if (!reduce.matches) {
          const drift = frames[i].drift;
          const x = distance * 22 * drift;
          const yShift = distance * -16;
          const scale = (1.06 + Math.abs(distance) * 0.018).toFixed(3);
          layer.style.transform = `translate3d(${x.toFixed(2)}px, ${yShift.toFixed(2)}px, 0) scale(${scale})`;
        }
      });
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
      cancelled = true;
      cancelAnimationFrame(frameHandle);
      observer.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("scroll", loadOnScroll);
      window.removeEventListener("resize", request);
      reduce.removeEventListener?.("change", request);
    };
  }, [frames]);

  return (
    <div ref={root} className={styles.backdrop} aria-hidden="true">
      {frames.map((frame, i) => (
        <div
          key={`${frame.src}-${i}`}
          data-frame={i}
          className={styles.frame}
          style={{
            backgroundPosition: frame.pos,
          }}
        />
      ))}
      <div className={styles.grain} />
      <div className={styles.grade} />
    </div>
  );
}
