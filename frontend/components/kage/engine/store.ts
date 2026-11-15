import type {
  KageChapterConfig,
  KageRouteConfig,
  KageRuntimeAPI,
  KageSnapshot,
  KageScene,
} from "../contracts";
export const clamp = (value: number, min: number, max: number) =>
  value < min ? min : value > max ? max : value;
export const damp = (
  current: number,
  target: number,
  rate: number,
  dt: number,
) => current + (target - current) * (1 - Math.exp(-rate * dt));
/** Kage index4088–4103. Pure and separately testable. */
export function progressFor(y: number, anchors: readonly number[]): number {
  if (!anchors.length || y <= anchors[0]) return 0;
  for (let i = 0; i < anchors.length - 1; i++)
    if (y <= anchors[i + 1])
      return i + (y - anchors[i]) / (anchors[i + 1] - anchors[i]);
  return anchors.length - 1;
}
export const aspectFix = (width: number, height: number) =>
  clamp((1.62 - width / height) / 1.05, 0, 1);
export function adaptiveScale(scale: number, average: number): number {
  if (average > 0.023 && scale > 0.55)
    return Math.max(0.55, scale * (average > 0.05 ? 0.64 : 0.85));
  if (average < 0.0138 && scale < 1) return Math.min(1, scale + 0.08);
  return scale;
}
export function createKageStore() {
  let route: {
    config: KageRouteConfig;
    root: HTMLElement;
    token: symbol;
  } | null = null;
  const chapters = new Map<HTMLElement, KageChapterConfig>();
  const listeners = new Set<(snapshot: KageSnapshot) => void>();
  let observer: IntersectionObserver | null = null,
    observerEpoch = 0;
  let focus: KageScene | null = null;
  let registryVersion = 0;
  let snapshot: KageSnapshot = {
    routeId: "",
    mode: "internal",
    nativeY: 0,
    anchors: [],
    chapters: [],
    sceneProgress: 0,
    smoothedProgress: 0,
    railIndex: 0,
    foregroundOwner: null,
    pointerNDC: [0, 0],
    reducedMotion: false,
    qualityScale: 1,
    bootProgress: 0,
    ready: false,
    fallback: false,
  };
  const publish = (patch: Partial<KageSnapshot>, force = false) => {
    const keys = Object.keys(patch) as Array<keyof KageSnapshot>;
    const equal = keys.every((key) => {
      const previous = snapshot[key],
        next = patch[key];
      if (Array.isArray(previous) && Array.isArray(next)) {
        if (previous.length !== next.length) return false;
        if (key === "chapters")
          return snapshot.chapters.every((chapter, index) => {
            const value = patch.chapters?.[index];
            return (
              chapter.id === value?.id &&
              chapter.scene === value?.scene &&
              chapter.title === value?.title
            );
          });
        return previous.every((value, index) => Object.is(value, next[index]));
      }
      return Object.is(previous, next);
    });
    if (equal) {
      if (force) listeners.forEach((listener) => listener(snapshot));
      return;
    }
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((listener) => listener(snapshot));
  };
  const entries = () =>
    Array.from(chapters.entries())
      .filter(([root]) => route?.root.contains(root))
      .sort(([a], [b]) =>
        a === b
          ? 0
          : a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
            ? -1
            : 1,
      );
  function measure(force = false) {
    if (!route || typeof window === "undefined") return;
    const viewHeight = document.documentElement.clientHeight || innerHeight;
    const max = Math.max(1, document.documentElement.scrollHeight - viewHeight);
    const list = entries();
    const anchors = list.map(([element], i) =>
      i === 0
        ? 0
        : i === list.length - 1
          ? max
          : clamp(
              element.getBoundingClientRect().top +
                scrollY +
                element.offsetHeight * 0.5 -
                viewHeight * 0.5,
              0,
              max,
            ),
    );
    for (let i = 1; i < anchors.length; i++)
      anchors[i] = Math.max(anchors[i], anchors[i - 1] + 1);
    publish({ anchors, chapters: list.map(([, config]) => ({ ...config })) });
    if (force) publish({}, true);
    updateScroll();
  }
  function updateScroll() {
    const y = typeof window === "undefined" ? 0 : window.scrollY;
    const index = progressFor(y, snapshot.anchors);
    const i = Math.min(
        Math.floor(index),
        Math.max(snapshot.chapters.length - 1, 0),
      ),
      a = snapshot.chapters[i]?.scene || 0,
      b = snapshot.chapters[i + 1]?.scene ?? a;
    const scene = snapshot.mode === "journey" ? a + (b - a) * (index - i) : a;
    publish({ nativeY: y, railIndex: Math.round(index), sceneProgress: scene });
  }
  function observeForeground() {
    observer?.disconnect();
    observer = null;
    const epoch = ++observerEpoch;
    const list = entries(),
      ratios = new Map<HTMLElement, number>();
    if (typeof IntersectionObserver === "undefined") return;
    observer = new IntersectionObserver(
      (records) => {
        if (epoch !== observerEpoch) return;
        records.forEach((record) =>
          ratios.set(
            record.target as HTMLElement,
            record.isIntersecting ? record.intersectionRatio : 0,
          ),
        );
        let best: HTMLElement | null = null,
          value = 0;
        list.forEach(([element]) => {
          const ratio = ratios.get(element) || 0;
          if (ratio > value) {
            best = element;
            value = ratio;
          }
        });
        const owner = best ? chapters.get(best)?.id || null : null;
        if (owner !== snapshot.foregroundOwner)
          publish({ foregroundOwner: owner });
      },
      { rootMargin: "-12% 0px -12% 0px", threshold: [0, 0.12, 0.32, 0.55] },
    );
    list.forEach(([element]) => observer?.observe(element));
  }
  const api: KageRuntimeAPI = {
    registerRoute(config, root) {
      const token = Symbol(config.routeId);
      route = { config, root, token };
      registryVersion++;
      publish({
        routeId: config.routeId,
        mode: config.mode,
        foregroundOwner: null,
        fallback: false,
      });
      measure(true);
      observeForeground();
      return () => {
        if (route?.token !== token) return;
        route = null;
        observer?.disconnect();
        observer = null;
        observerEpoch++;
        publish({
          routeId: "",
          mode: "internal",
          chapters: [],
          anchors: [],
          foregroundOwner: null,
        });
      };
    },
    registerChapter(config, root) {
      chapters.set(root, config);
      registryVersion++;
      measure(true);
      observeForeground();
      return () => {
        if (chapters.get(root) !== config) return;
        chapters.delete(root);
        registryVersion++;
        measure(true);
        observeForeground();
      };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot() {
      return snapshot;
    },
    focusChapter(scene) {
      if (focus === scene) return;
      focus = scene;
      listeners.forEach((listener) => listener(snapshot));
    },
    navigateToChapter(id) {
      const index = entries().findIndex(([, config]) => config.id === id);
      if (index < 0) return;
      window.scrollTo({
        top: snapshot.anchors[index] ?? 0,
        behavior: snapshot.reducedMotion ? "auto" : "smooth",
      });
    },
    measure,
  };
  return {
    api,
    publish,
    updateScroll,
    getRoot: () => route?.root || null,
    getWorld: () => route?.config.world || "gmp",
    getSections: () => entries().map(([element]) => element),
    getFocus: () => focus,
    getVersion: () => registryVersion,
    dispose() {
      observerEpoch++;
      observer?.disconnect();
      observer = null;
      listeners.clear();
      chapters.clear();
      route = null;
    },
  };
}
