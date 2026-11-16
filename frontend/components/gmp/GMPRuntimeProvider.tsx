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
import type { GMPRuntimeAPI } from "./contracts";
import { createGMPStore } from "./engine/store";
import type { GMPEngine } from "./engine/gmp-engine";
import { gmpFontFamilies } from "./fonts";

type Three149 = { REVISION?: string };
declare global {
  interface Window {
    THREE?: Three149;
    __gmp?: Record<string, unknown>;
  }
}
let vendor: Promise<Three149> | null = null;
function loadThree149(): Promise<Three149> {
  if (window.THREE?.REVISION === "149") return Promise.resolve(window.THREE);
  if (vendor) return vendor;
  vendor = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/gmp/secret-pathways-assets/three.min.js";
    script.async = true;
    script.dataset.gmpThree = "149";
    script.onload = () => {
      if (window.THREE?.REVISION === "149") resolve(window.THREE);
      else reject(new Error("GMP requires the vendored Three149 runtime"));
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
const Context = createContext<GMPRuntimeAPI | null>(null);
export function useGMPRuntime(): GMPRuntimeAPI {
  const api = useContext(Context);
  if (!api) throw new Error("GMPRoute requires GMPRuntimeProvider");
  return api;
}
export function GMPRuntimeProvider({
  children,
  allowWebGL = true,
}: {
  children: ReactNode;
  allowWebGL?: boolean;
}) {
  const store = useMemo(() => createGMPStore(), []),
    canvas = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    store.publish({ visible });
  }, [store, visible]);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let dead = false,
      engine: GMPEngine | null = null,
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
      delete window.__gmp;
      store.publish({ fallback: true, ready: false });
    };
    store.publish({ reducedMotion: preference.matches, ready: false });
    const reconcile = () => {
      const state = store.api.getSnapshot();
      const nextWorld = store.getWorld();
      element.dataset.gmpMode = state.mode;
      element.dataset.gmpReducedMotion = String(state.reducedMotion);
      element.dataset.gmpReady = String(state.ready);
      element.dataset.gmpFallback = String(state.fallback);
      const active =
        allowWebGL &&
        nextWorld !== "photo" &&
        (state.mode === "journey" || state.mode === "ambient") &&
        !state.reducedMotion &&
        !document.hidden &&
        !state.fallback;
      /* Once the engine has presented a frame the canvas stays on: a dev
         recompile republishes ready:false and used to black the world out
         under the reader. It is still dropped on a fallback or no-WebGL. */
      setVisible(
        (shown) => allowWebGL && !state.fallback && (state.ready || shown),
      );
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
          delete window.__gmp;
        }
        /* A photo world never owns a GL frame: the canvas has no context and
           must not claim presentation, or the shell hides the photo stack. */
        setVisible(false);
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
        delete window.__gmp;
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
          const { createGMPEngine } = await import("./engine/gmp-engine");
          if (dead || signal.aborted || mine !== epoch) return;
          const failAttempt = () => {
            if (!dead && !signal.aborted && mine === epoch) fail();
          };
          const instance = await createGMPEngine({
            THREE,
            canvas: element,
            world: nextWorld,
            logoUrl: "/gmp/brand/logo-alpha.png",
            wordmarkFamily: gmpFontFamilies.wordmark,
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
          window.__gmp = {
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
      delete window.__gmp;
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
        data-gmp-ambient="true"
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
