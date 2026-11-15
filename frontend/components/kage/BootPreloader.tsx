"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useKageValue } from "./navigation/useKageValue";

/**
 * Kage #pre. One smoothed `display` drives both the bar width and the %.
 *
 * The curtain is a brand layer, not a render blocker:
 *  - boot/reload: follows `bootProgress`/`ready` and the document stream, but
 *    never waits longer than BOOT_MAX_MS, so a slow scene cannot hold the cover;
 *  - client navigation: re-arms on the intent (link click / popstate) so the
 *    cover is already up before the new route paints, and stays until that
 *    route really commits. The safety stop only exists for a dead router.
 */

const RAMP_MS = 700;
const REDUCE_RAMP_MS = 320;
const BOOT_MIN_MS = 380;
const BOOT_MAX_MS = 1200;
const NAV_MIN_MS = 380;
/**
 * An armed navigation waits for the real route commit. This only exists for a
 * router that never answers; it must never fire during a slow transition.
 */
const NAV_SAFETY_MS = 20000;
/** After a safety release, never open a second cover for the late commit. */
const SUPPRESS_MS = 6000;
/** A committed route finishes faster than it creeps. */
const COMMIT_BOOST = 2.4;
/** The creep approaches the end asymptotically and never claims it early. */
const CREEP_CEILING = 0.9;
const CREEP_TAU_MS = 1260;
const REDUCE_CREEP_TAU_MS = 320;

type CycleKind = "boot" | "nav";

interface Cycle {
  kind: CycleKind;
  start: number;
  min: number;
  /** Absolute stop: past this the cycle completes even without a commit. */
  safety: number;
  armed: boolean;
  committed: boolean;
}

const useMountedLayout =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Asymptotic creep: it reads like a real bar, never stalls at a fake 90%. */
const creep = (elapsed: number, tau: number) =>
  CREEP_CEILING * (1 - Math.exp(-Math.max(0, elapsed) / tau));

export function BootPreloader({ allowed }: { allowed: boolean }) {
  /**
   * The real browser path, locale prefix included. next-intl strips the prefix,
   * which makes `/es/x` and `/en/x` look identical and hides the locale change.
   */
  const pathname = usePathname() ?? "";
  const routeKey = pathname;

  const bootProgress = useKageValue((s) => s.bootProgress);
  const ready = useKageValue((s) => s.ready);
  const fallback = useKageValue((s) => s.fallback);
  const mode = useKageValue((s) => s.mode);
  const reduced = useKageValue((s) => s.reducedMotion);
  const publicRoute = mode === "journey" || mode === "ambient";

  const [display, setDisplay] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [cycleId, setCycleId] = useState(0);

  const displayRef = useRef(0);
  const cycleRef = useRef<Cycle | null>(null);
  const suppressUntil = useRef(0);
  const latest = useRef({
    bootProgress,
    ready,
    fallback,
    publicRoute,
    allowed,
    reduced,
  });
  latest.current = { bootProgress, ready, fallback, publicRoute, allowed, reduced };

  const startCycle = useCallback((kind: CycleKind, committed = false) => {
    const now = performance.now();
    displayRef.current = 0;
    setDisplay(0);
    setHidden(false);
    cycleRef.current = {
      kind,
      start: now,
      min: kind === "boot" ? BOOT_MIN_MS : NAV_MIN_MS,
      safety: kind === "boot" ? BOOT_MAX_MS : NAV_SAFETY_MS,
      armed: kind === "nav",
      committed,
    };
    setCycleId((id) => id + 1);
  }, []);

  // Boot once per document load (also covers a hard reload).
  useMountedLayout(() => {
    startCycle("boot");
  }, [startCycle]);

  // Route commit. If a click/popstate already armed the curtain we only mark
  // the target; otherwise (programmatic push, history restore) we open it now.
  const previousKey = useRef(routeKey);
  useMountedLayout(() => {
    // An empty pathname is a transient SSR value, never a real navigation.
    if (!routeKey || !previousKey.current) {
      previousKey.current = routeKey;
      return;
    }
    if (previousKey.current === routeKey) return;
    previousKey.current = routeKey;
    const cycle = cycleRef.current;
    if (cycle?.armed && !cycle.committed) {
      cycle.committed = true;
      return;
    }
    // The previous cover already closed on the safety stop; reopening here is
    // exactly the double flash this component must never produce.
    if (performance.now() < suppressUntil.current) return;
    startCycle("nav", true);
  }, [routeKey, startCycle]);

  const arm = useCallback(() => {
    const cycle = cycleRef.current;
    if (cycle?.armed && !cycle.committed) return;
    startCycle("nav");
  }, [startCycle]);

  // Intent listeners: the cover must be painted before the router swaps routes.
  useEffect(() => {
    const navigable = (anchor: HTMLAnchorElement): boolean => {
      const raw = anchor.getAttribute("href");
      if (!raw || raw.startsWith("#")) return false;
      if (anchor.hasAttribute("download")) return false;
      if (anchor.target && anchor.target !== "_self") return false;
      let next: URL;
      try {
        next = new URL(anchor.href, window.location.href);
      } catch {
        return false;
      }
      if (next.protocol !== "http:" && next.protocol !== "https:") return false;
      if (next.origin !== window.location.origin) return false;
      const here = window.location;
      return next.pathname !== here.pathname || next.search !== here.search;
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const node =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (!(node instanceof HTMLAnchorElement)) return;
      if (!navigable(node)) return;
      arm();
    };

    const onPopState = () => arm();

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [arm]);

  useEffect(() => {
    if (!cycleId) return;
    let frame = 0;
    let last = performance.now();
    let settled = false;

    const finish = (safetyRelease: boolean) => {
      settled = true;
      cycleRef.current = null;
      if (safetyRelease) suppressUntil.current = performance.now() + SUPPRESS_MS;
      setHidden(true);
    };

    const tick = (now: number) => {
      const cycle = cycleRef.current;
      if (settled || !cycle) return;
      const state = latest.current;
      const rampMs = state.reduced ? REDUCE_RAMP_MS : RAMP_MS;
      const tau = state.reduced ? REDUCE_CREEP_TAU_MS : CREEP_TAU_MS;
      const elapsed = Math.max(0, now - cycle.start);

      let target: number;
      if (cycle.committed) {
        target = 1;
      } else if (cycle.armed) {
        // Waiting for the router. No early finish: the cover owns the gap
        // between the click and the new route actually committing.
        target = creep(elapsed, tau);
      } else if (
        (state.ready ||
          state.fallback ||
          !state.publicRoute ||
          !state.allowed) &&
        // A hard reload keeps streaming the document; do not uncover a page
        // that has not arrived yet.
        document.readyState !== "loading"
      ) {
        target = 1;
      } else {
        const engine = Math.max(0, Math.min(1, state.bootProgress));
        target = Math.max(engine, creep(elapsed, tau));
      }

      const capped = elapsed >= cycle.safety;
      if (capped) target = 1;

      const dt = Math.min(64, Math.max(0, now - last));
      last = now;
      const boost = cycle.committed || capped ? COMMIT_BOOST : 1;
      const step = (dt / rampMs) * boost;
      const current = displayRef.current;
      const next = current + Math.min(Math.max(0, target - current), step);

      displayRef.current = next;
      setDisplay(next);

      if (next >= 0.999 && elapsed >= cycle.min) {
        finish(capped && !cycle.committed && cycle.kind === "nav");
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      settled = true;
      cancelAnimationFrame(frame);
    };
  }, [cycleId]);

  // Safety net: a previous build locked scroll from this component.
  useEffect(
    () => () => {
      document.body.classList.remove("is-locked");
    },
    [],
  );

  const clamped = Math.min(1, Math.max(0, display));
  const pct = Math.round(clamped * 100);
  const right = ((1 - clamped) * 100).toFixed(1);

  return (
    <>
      <noscript>
        <style>{"#pre{display:none!important}"}</style>
      </noscript>
      <div
        id="pre"
        className={hidden ? "done" : undefined}
        aria-busy={!hidden}
        aria-hidden={hidden || undefined}
        data-pre-sync="display"
      >
        <div className="pre-in">
          <div className="pre-mark pre-mark-logo">
            <Image
              src="/kage/brand/logo-alpha.png"
              alt=""
              width={220}
              height={67}
              unoptimized
            />
          </div>
          <div
            className="pre-bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-valuetext={`${pct}%`}
          >
            <i id="pre-fill" style={{ right: `${right}%` }} />
          </div>
          <div className="pre-meta" aria-hidden="true">
            <span>Granja Maripepa</span>
            <b>
              <span id="pre-pct">{pct}</span>%
            </b>
          </div>
        </div>
      </div>
    </>
  );
}
