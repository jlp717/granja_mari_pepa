import {
  adaptiveScale,
  aspectFix,
  createKageStore,
  damp,
  progressFor,
} from "./store";
describe("literal Kage mathematics", () => {
  it("interpolates chapter anchors and clamps its ends", () => {
    expect(progressFor(-10, [0, 100, 400])).toBe(0);
    expect(progressFor(50, [0, 100, 400])).toBe(0.5);
    expect(progressFor(250, [0, 100, 400])).toBe(1.5);
    expect(progressFor(900, [0, 100, 400])).toBe(2);
  });
  it("keeps exponential damping independent of frame subdivision", () => {
    expect(damp(0, 1, 5.2, 0.04)).toBeCloseTo(
      damp(damp(0, 1, 5.2, 0.02), 1, 5.2, 0.02),
      12,
    );
  });
  it("uses the literal aspect correction", () => {
    expect(aspectFix(1920, 900)).toBe(0);
    expect(aspectFix(390, 844)).toBe(1);
    expect(aspectFix(768, 1024)).toBeCloseTo((1.62 - 0.75) / 1.05);
  });
  it("reduces raster pixels conservatively and caps recovery", () => {
    expect(adaptiveScale(1, 0.024)).toBe(0.85);
    expect(adaptiveScale(1, 0.06)).toBe(0.64);
    expect(adaptiveScale(0.6, 0.06)).toBe(0.55);
    expect(adaptiveScale(0.98, 0.01)).toBe(1);
    expect(adaptiveScale(1, 0.016)).toBe(1);
  });
});
describe("persistent route ownership", () => {
  it("retains a successor when the previous route cleans up", () => {
    const s = createKageStore();
    const a = document.createElement("main"),
      b = document.createElement("main");
    const stopA = s.api.registerRoute({ routeId: "a", mode: "journey" }, a);
    const stopB = s.api.registerRoute({ routeId: "b", mode: "ambient" }, b);
    stopA();
    expect(s.api.getSnapshot().routeId).toBe("b");
    stopB();
    expect(s.api.getSnapshot().mode).toBe("internal");
    s.dispose();
  });
  it("accepts child registration before its route and filters old roots", () => {
    const s = createKageStore(),
      route = document.createElement("main"),
      section = document.createElement("section"),
      foreign = document.createElement("section");
    route.appendChild(section);
    const stop = s.api.registerChapter({ id: "cold", scene: 1 }, section);
    const other = s.api.registerChapter({ id: "old", scene: 4 }, foreign);
    const end = s.api.registerRoute(
      { routeId: "public", mode: "journey" },
      route,
    );
    expect(s.api.getSnapshot().chapters.map((c) => c.id)).toEqual(["cold"]);
    stop();
    expect(s.api.getSnapshot().chapters).toHaveLength(0);
    other();
    end();
    s.dispose();
  });
  it("starts with internal mode and never creates a renderer by registration", () => {
    const s = createKageStore();
    expect(s.api.getSnapshot()).toMatchObject({
      mode: "internal",
      ready: false,
      fallback: false,
    });
    s.dispose();
  });
});

it("uses the camera anchor for rail navigation, not the ordinary link offset", () => {
  const s = createKageStore(),
    root = document.createElement("main"),
    chapter = document.createElement("section");
  root.appendChild(chapter);
  const stop = s.api.registerChapter({ id: "first", scene: 0 }, chapter);
  const end = s.api.registerRoute({ routeId: "walk", mode: "journey" }, root);
  jest
    .spyOn(chapter, "getBoundingClientRect")
    .mockReturnValue({ top: 500 } as DOMRect);
  const scroll = jest
    .spyOn(window, "scrollTo")
    .mockImplementation(() => undefined);
  s.api.navigateToChapter("first");
  expect(scroll).toHaveBeenLastCalledWith({ top: 0, behavior: "smooth" });
  s.publish({ reducedMotion: true });
  s.api.navigateToChapter("first");
  expect(scroll).toHaveBeenLastCalledWith({ top: 0, behavior: "auto" });
  scroll.mockRestore();
  stop();
  end();
  s.dispose();
});

it("does not notify idle snapshots but delivers an explicit focus change", () => {
  const s = createKageStore(),
    listener = jest.fn();
  s.api.subscribe(listener);
  const original = s.api.getSnapshot();
  s.publish({ qualityScale: 1, smoothedProgress: 0 });
  expect(listener).not.toHaveBeenCalled();
  s.api.focusChapter(2);
  expect(listener).toHaveBeenCalledTimes(1);
  expect(s.getFocus()).toBe(2);
  expect(s.api.getSnapshot()).toBe(original);
  s.api.focusChapter(2);
  expect(listener).toHaveBeenCalledTimes(1);
  s.dispose();
});
