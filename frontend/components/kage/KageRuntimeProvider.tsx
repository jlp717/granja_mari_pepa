"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { KageRuntimeAPI } from "./contracts";
import { createKageStore } from "./engine/store";
import type { KageEngine } from "./engine/kage-engine";
import { kageFontFamilies } from "./fonts";

type Three149 = { REVISION?: string };
declare global {
  interface Window {
    THREE?: Three149;
    __kage?: Record<string, unknown>;
  }
}
let vendor: Promise<Three149> | null = null;
function loadThree149(): Promise<Three149> {
  if (window.THREE?.REVISION === "149") return Promise.resolve(window.THREE);
  if (vendor) return vendor;
  vendor = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/kage/secret-pathways-assets/three.min.js";
    script.async = true;
    script.dataset.kageThree = "149";
    script.onload = () => {
      if (window.THREE?.REVISION === "149") resolve(window.THREE);
      else reject(new Error("Kage requires the vendored Three149 runtime"));
    };
    script.onerror = () => {
      script.remove();
      vendor = null;
      reject(new Error("Three149 unavailable"));
    };
    document.head.appendChild(script);
  });
  return vendor;
}
const Context = createContext<KageRuntimeAPI | null>(null);
export function useKageRuntime(): KageRuntimeAPI {
  const api = useContext(Context);
  if (!api) throw new Error("KageRoute requires KageRuntimeProvider");
  return api;
}
export function KageRuntimeProvider({
  children,
  allowWebGL = true,
}: {
  children: ReactNode;
  allowWebGL?: boolean;
}) {
  const store = useMemo(createKageStore, []),
    canvas = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let dead = false,
      engine: KageEngine | null = null,
      pending = false,
      epoch = 0;
    let cancellation: AbortController | null = null,
      world: string | null = null,
      lastSignature = "";
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const fail = () => {
      if (dead) return;
      engine?.dispose();
      engine = null;
      world = null;
      delete window.__kage;
      store.publish({ fallback: true, ready: false });
    };
    store.publish({ reducedMotion: preference.matches, ready: false });
    const reconcile = () => {
      const state = store.api.getSnapshot();
      const nextWorld = store.getWorld();
      element.dataset.kageMode = state.mode;
      element.dataset.kageReducedMotion = String(state.reducedMotion);
      element.dataset.kageReady = String(state.ready);
      element.dataset.kageFallback = String(state.fallback);
      const active =
        allowWebGL &&
        nextWorld !== "photo" &&
        (state.mode === "journey" || state.mode === "ambient") &&
        !state.reducedMotion &&
        !document.hidden &&
        !state.fallback;
      setVisible(active && state.ready);
      if (nextWorld === "photo") {
        if (pending) {
          cancellation?.abort();
          pending = false;
          epoch++;
        }
        if (engine) {
          engine.dispose();
          engine = null;
          world = null;
          delete window.__kage;
        }
        store.publish({ bootProgress: 1, ready: true, fallback: false });
        return;
      }
      if (!active) {
        if (pending) {
          cancellation?.abort();
          pending = false;
          epoch++;
        }
        engine?.pause();
        return;
      }
      if (engine && world !== nextWorld) {
        engine.dispose();
        engine = null;
        world = null;
        delete window.__kage;
        store.publish({ ready: false });
        return;
      }
      if (engine) {
        const signature =
          state.routeId +
          ":" +
          store.getVersion() +
          ":" +
          state.chapters.map((c) => c.id + ":" + c.scene).join("|");
        if (signature !== lastSignature) {
          lastSignature = signature;
          engine.refresh();
        }
        engine.focus(store.getFocus());
        engine.resume();
        return;
      }
      if (pending) return;
      pending = true;
      const mine = ++epoch;
      cancellation = new AbortController();
      const signal = cancellation.signal;
      store.publish({ bootProgress: 0, ready: false });
      void loadThree149()
        .then(async (THREE) => {
          if (dead || signal.aborted || mine !== epoch) return;
          store.publish({ bootProgress: 0.08 });
          const { createKageEngine } = await import("./engine/kage-engine");
          if (dead || signal.aborted || mine !== epoch) return;
          const failAttempt = () => {
            if (!dead && !signal.aborted && mine === epoch) fail();
          };
          const instance = await createKageEngine({
            THREE,
            canvas: element,
            world: nextWorld,
            logoUrl: "/kage/brand/logo-alpha.png",
            wordmarkFamily: kageFontFamilies.wordmark,
            signal,
            getRoot: store.getRoot,
            getSections: store.getSections,
            getProgress: () => store.api.getSnapshot().sceneProgress,
            getPointer: () => store.api.getSnapshot().pointerNDC,
            onLoad: (progress) => {
              if (!dead && !signal.aborted && mine === epoch)
                store.publish({
                  bootProgress: Math.max(0.08, Math.min(1, progress)),
                });
            },
            onFrame: ({ smooth, scale }) => {
              if (!dead && !signal.aborted && mine === epoch)
                store.publish({
                  smoothedProgress: smooth,
                  qualityScale: scale,
                  bootProgress: 1,
                  ready: true,
                });
            },
            onLost: failAttempt,
            onAssetError: failAttempt,
          });
          if (dead || signal.aborted || mine !== epoch) {
            instance.dispose();
            return;
          }
          engine = instance;
          world = nextWorld;
          pending = false;
          window.__kage = {
            ...instance.diagnostics?.(),
            getSnapshot: store.api.getSnapshot,
            sourceRevision: "149",
          };
          lastSignature = "";
          // The engine reports its first completed render through onFrame.
          reconcile();
        })
        .catch((error: unknown) => {
          if (dead || signal.aborted || mine !== epoch) return;
          pending = false;
          if (!(error instanceof DOMException && error.name === "AbortError"))
            store.publish({ fallback: true, ready: false });
        });
    };
    const unsubscribe = store.api.subscribe(reconcile);
    const onScroll = () => store.updateScroll();
    const onResize = () => {
      store.api.measure();
      engine?.resize();
    };
    const onPointer = (event: PointerEvent) => {
      const w = document.documentElement.clientWidth || innerWidth,
        h = document.documentElement.clientHeight || innerHeight;
      store.publish({
        pointerNDC: [
          (event.clientX / w) * 2 - 1,
          -((event.clientY / h) * 2 - 1),
        ],
      });
    };
    const onPreference = () => {
      store.publish({ reducedMotion: preference.matches });
      engine?.setReducedMotion(preference.matches);
      reconcile();
    };
    const onVisibility = () => reconcile();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onResize, { passive: true });
    addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    preference.addEventListener("change", onPreference);
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => store.api.measure())
        : null;
    resizeObserver?.observe(document.body);
    reconcile();
    return () => {
      dead = true;
      epoch++;
      cancellation?.abort();
      unsubscribe();
      engine?.dispose();
      store.publish({ ready: false });
      delete window.__kage;
      resizeObserver?.disconnect();
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
      removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      preference.removeEventListener("change", onPreference);
    };
  }, [store, allowWebGL]);
  return (
    <Context.Provider value={store.api}>
      <canvas
        ref={canvas}
        id="gl"
        aria-hidden="true"
        data-kage-ambient="true"
        data-fx="scene-camera"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none",
          opacity: visible ? 1 : 0,
          transition: "opacity .8s cubic-bezier(.22,.61,.36,1)",
        }}
      />
      {children}
    </Context.Provider>
  );
}
