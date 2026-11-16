import { act, render } from "@testing-library/react";
import { useLayoutEffect } from "react";
import { GMPRuntimeProvider, useGMPRuntime } from "../GMPRuntimeProvider";
import type { GMPRuntimeAPI } from "../contracts";
import {
  createGMPEngine,
  type GMPEngine,
  type GMPEngineOptions,
} from "./gmp-engine";
jest.mock("./gmp-engine", () => ({ createGMPEngine: jest.fn() }));
jest.mock("../fonts", () => ({ gmpFontFamilies: { wordmark: "Wordmark" } }));
const factory = jest.mocked(createGMPEngine);
let api: GMPRuntimeAPI;
function ReadAPI() {
  const value = useGMPRuntime();
  useLayoutEffect(() => {
    api = value;
  }, [value]);
  return null;
}
function instance(): GMPEngine {
  return {
    dispose: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    resize: jest.fn(),
    refresh: jest.fn(),
    setReducedMotion: jest.fn(),
    focus: jest.fn(),
    diagnostics: () => ({}),
  };
}
const originalMedia = window.matchMedia;
let reduce = false;
const mediaListeners = new Set<() => void>();
beforeEach(() => {
  factory.mockReset();
  reduce = false;
  window.THREE = { REVISION: "149" };
  window.matchMedia = jest.fn().mockImplementation(() => ({
    get matches() {
      return reduce;
    },
    addEventListener: (_type: string, listener: () => void) =>
      mediaListeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) =>
      mediaListeners.delete(listener),
  }));
});
afterEach(() => {
  window.matchMedia = originalMedia;
  delete window.THREE;
  mediaListeners.clear();
});
const flush = () =>
  act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
it("does not initialize Three before a registered public route", async () => {
  render(
    <GMPRuntimeProvider>
      <ReadAPI />
    </GMPRuntimeProvider>,
  );
  await flush();
  expect(factory).not.toHaveBeenCalled();
  act(() => {
    api.registerRoute(
      { routeId: "private", mode: "internal" },
      document.createElement("main"),
    );
  });
  await flush();
  expect(factory).not.toHaveBeenCalled();
});
it("respects a closed WebGL presentation gate even for a public route", async () => {
  render(
    <GMPRuntimeProvider allowWebGL={false}>
      <ReadAPI />
    </GMPRuntimeProvider>,
  );
  act(() => {
    api.registerRoute(
      { routeId: "access", mode: "ambient" },
      document.createElement("main"),
    );
  });
  await flush();
  expect(factory).not.toHaveBeenCalled();
});
it("uses static content for reduced preference and initializes after deliberate preference change", async () => {
  reduce = true;
  const engine = instance();
  factory.mockResolvedValue(engine);
  render(
    <GMPRuntimeProvider>
      <ReadAPI />
    </GMPRuntimeProvider>,
  );
  act(() => {
    api.registerRoute(
      { routeId: "public", mode: "journey" },
      document.createElement("main"),
    );
  });
  await flush();
  expect(factory).not.toHaveBeenCalled();
  act(() => {
    reduce = false;
    mediaListeners.forEach((listener) => listener());
  });
  await flush();
  expect(factory).toHaveBeenCalledTimes(1);
  expect(api.getSnapshot().ready).toBe(false);
  act(() => factory.mock.calls[0][0].onFrame?.({ smooth: 0, scale: 1 }));
  expect(api.getSnapshot().ready).toBe(true);
});
it("invalidates a pending route initialization and disposes its late result", async () => {
  let finish: ((value: GMPEngine) => void) | undefined;
  let signal: AbortSignal | undefined;
  factory.mockImplementation((options: GMPEngineOptions) => {
    signal = options.signal;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  render(
    <GMPRuntimeProvider>
      <ReadAPI />
    </GMPRuntimeProvider>,
  );
  act(() => {
    api.registerRoute(
      { routeId: "public", mode: "journey" },
      document.createElement("main"),
    );
  });
  await flush();
  expect(factory).toHaveBeenCalledTimes(1);
  act(() => {
    api.registerRoute(
      { routeId: "private", mode: "internal" },
      document.createElement("main"),
    );
  });
  expect(signal?.aborted).toBe(true);
  const late = instance();
  await act(async () => {
    finish?.(late);
    await Promise.resolve();
  });
  expect(late.dispose).toHaveBeenCalledTimes(1);
  expect(api.getSnapshot().mode).toBe("internal");
  expect(document.querySelector("canvas")?.dataset.gmpMode).toBe("internal");
});

it("falls back once and releases the active GPU owner on context failure", async () => {
  let options: GMPEngineOptions | undefined;
  const engine = instance();
  factory.mockImplementation(async (value) => {
    options = value;
    return engine;
  });
  render(
    <GMPRuntimeProvider>
      <ReadAPI />
    </GMPRuntimeProvider>,
  );
  act(() => {
    api.registerRoute(
      { routeId: "public", mode: "ambient" },
      document.createElement("main"),
    );
  });
  await flush();
  act(() => options?.onFrame?.({ smooth: 0, scale: 1 }));
  expect(api.getSnapshot().ready).toBe(true);
  act(() => {
    options?.onLost?.();
  });
  expect(engine.dispose).toHaveBeenCalledTimes(1);
  expect(api.getSnapshot()).toMatchObject({ ready: false, fallback: true });
  act(() => {
    api.measure();
  });
  await flush();
  expect(factory).toHaveBeenCalledTimes(1);
});

it("ignores an obsolete logo/context callback after a world switch", async () => {
  const attempts: GMPEngineOptions[] = [],
    first = instance(),
    second = instance();
  factory.mockImplementation(async (options) => {
    attempts.push(options);
    return attempts.length === 1 ? first : second;
  });
  render(
    <GMPRuntimeProvider>
      <ReadAPI />
    </GMPRuntimeProvider>,
  );
  act(() => {
    api.registerRoute(
      { routeId: "gmp", mode: "journey", world: "gmp" },
      document.createElement("main"),
    );
  });
  await flush();
  act(() => {
    api.registerRoute(
      { routeId: "control", mode: "journey", world: "control" },
      document.createElement("main"),
    );
  });
  await flush();
  expect(factory).toHaveBeenCalledTimes(2);
  expect(first.dispose).toHaveBeenCalledTimes(1);
  act(() => {
    attempts[0].onAssetError?.("/gmp/brand/logo-alpha.png");
    attempts[0].onLost?.();
    attempts[0].onFrame?.({ smooth: 5, scale: 0.55 });
  });
  expect(api.getSnapshot().ready).toBe(false);
  act(() => attempts[1].onFrame?.({ smooth: 0, scale: 1 }));
  expect(second.dispose).not.toHaveBeenCalled();
  expect(api.getSnapshot()).toMatchObject({
    ready: true,
    fallback: false,
    routeId: "control",
  });
});

it("keeps the SSR fallback until a completed render and ignores frames from an aborted lease", async () => {
  let options: GMPEngineOptions | undefined;
  const engine = instance();
  factory.mockImplementation(async (value) => {
    options = value;
    return engine;
  });
  const view = render(
    <GMPRuntimeProvider>
      <ReadAPI />
    </GMPRuntimeProvider>,
  );
  act(() => {
    api.registerRoute(
      { routeId: "public", mode: "journey" },
      document.createElement("main"),
    );
  });
  await flush();
  expect(factory).toHaveBeenCalledTimes(1);
  expect(api.getSnapshot().ready).toBe(false);
  expect(document.querySelector("canvas")?.style.opacity).toBe("0");
  act(() => options?.onFrame?.({ smooth: 0.25, scale: 1 }));
  expect(api.getSnapshot()).toMatchObject({
    ready: true,
    smoothedProgress: 0.25,
  });
  expect(document.querySelector("canvas")?.style.opacity).toBe("1");
  view.rerender(
    <GMPRuntimeProvider allowWebGL={false}>
      <ReadAPI />
    </GMPRuntimeProvider>,
  );
  expect(options?.signal?.aborted).toBe(true);
  expect(api.getSnapshot().ready).toBe(false);
  act(() => options?.onFrame?.({ smooth: 5, scale: 0.55 }));
  expect(api.getSnapshot()).toMatchObject({
    ready: false,
    smoothedProgress: 0.25,
    qualityScale: 1,
  });
  expect(document.querySelector("canvas")?.style.opacity).toBe("0");
});
