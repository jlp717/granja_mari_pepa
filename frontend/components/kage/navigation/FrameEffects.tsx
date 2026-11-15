"use client";
import { useEffect, useRef } from "react";
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Kage index.html 4428–4436: same 180px grain, seed9 and byte values. */
export function FrameEffects() {
  const grain = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = grain.current;
    if (!element) return;
    const size = 180,
      canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) return;
    const image = context.createImageData(size, size),
      data = image.data,
      random = mulberry32(9);
    for (let i = 0; i < size * size; i++) {
      const value = 110 + random() * 90;
      data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = value;
      data[i * 4 + 3] = 255;
    }
    context.putImageData(image, 0, 0);
    element.style.backgroundImage = `url(${canvas.toDataURL("image/png")})`;
    return () => {
      element.style.backgroundImage = "";
    };
  }, []);
  return (
    <>
      <div id="vignette" aria-hidden="true" />
      <div ref={grain} id="grain" aria-hidden="true" />
    </>
  );
}
