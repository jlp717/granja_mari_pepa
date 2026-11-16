"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Images, Pause, Play } from "lucide-react";
import { useMagazines } from "./magazine-context";
import styles from "./magazines.module.css";

export function MagazineTicker() {
  const { magazines, openMagazine, openLibrary } = useMagazines();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [manualPause, setManualPause] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    setIndex((current) => (magazines.length ? current % magazines.length : 0));
  }, [magazines.length]);

  useEffect(() => {
    if (paused || manualPause || reduce || magazines.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % magazines.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [paused, manualPause, reduce, magazines.length]);

  const current = useMemo(
    () => magazines[Math.min(index, Math.max(0, magazines.length - 1))],
    [index, magazines],
  );

  if (!magazines.length || !current) return null;

  const step = (direction: number) => {
    setIndex((value) => (value + direction + magazines.length) % magazines.length);
  };

  const choose = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = magazines.find((magazine) => magazine.id === event.target.value);
    if (next) openMagazine(next);
  };

  return (
    <>
      <style jsx global>{`
        :root {
          --mag-h: 38px;
          --nav-h: 122px;
        }
        @media (max-width: 820px) {
          :root {
            --mag-h: 34px;
            --nav-h: 118px;
          }
        }
      `}</style>
      <div
        className={styles.ticker}
        role="region"
        aria-label="Revistas Granja Maripepa"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <span className={styles.tickerLabel}>Revistas</span>
        <div className={styles.tickerControls}>
          <button
            type="button"
            className={styles.tickerArrow}
            onClick={() => step(-1)}
            aria-label="Revista anterior"
          >
            <ChevronLeft size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.tickerCurrent}
            onClick={() => openMagazine(current)}
          >
            <span className={styles.tickerCover}>
              {current.coverUrl ? (
                <Image
                  src={current.coverUrl}
                  alt=""
                  width={64}
                  height={88}
                  sizes="22px"
                  loading="lazy"
                />
              ) : null}
            </span>
            <span className={styles.tickerText}>
              <b>{current.edition}</b>
              <em>{current.title}</em>
            </span>
          </button>
          <button
            type="button"
            className={styles.tickerArrow}
            onClick={() => step(1)}
            aria-label="Revista siguiente"
          >
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
        <label className={styles.tickerSelectWrap}>
          <span className="gmp-sr-only">Elegir revista</span>
          <select
            className={styles.tickerSelect}
            value={current.id}
            onChange={choose}
            aria-label="Elegir revista para abrir"
          >
            {magazines.map((magazine) => (
              <option key={magazine.id} value={magazine.id}>
                {magazine.edition}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={styles.tickerPause}
          onClick={() => setManualPause((value) => !value)}
          aria-label={manualPause ? "Reanudar el carrusel de revistas" : "Pausar el carrusel de revistas"}
          aria-pressed={manualPause}
        >
          {manualPause ? <Play size={12} aria-hidden="true" /> : <Pause size={12} aria-hidden="true" />}
        </button>
        <button
          type="button"
          className={styles.tickerAll}
          onClick={openLibrary}
          aria-label="Ver todas las revistas"
        >
          <Images size={13} aria-hidden="true" />
          <span>Ver todas</span>
        </button>
      </div>
    </>
  );
}
