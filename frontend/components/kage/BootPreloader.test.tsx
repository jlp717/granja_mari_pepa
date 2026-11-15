/**
 * @jest-environment jsdom
 */
import { act, render, screen } from "@testing-library/react";
import { BootPreloader } from "./BootPreloader";

const state = {
  bootProgress: 0,
  ready: false,
  fallback: false,
  mode: "journey" as const,
  reducedMotion: false,
};

const mockRoute = { pathname: "/" };

jest.mock("./navigation/useKageValue", () => ({
  useKageValue: (select: (s: typeof state) => unknown) => select(state),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => mockRoute.pathname,
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: { alt?: string; src?: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={props.alt || ""} src={String(props.src || "")} />;
  },
}));

const pre = () => document.getElementById("pre");
const pct = () => document.getElementById("pre-pct")?.textContent;
const fillRight = () =>
  parseFloat(document.getElementById("pre-fill")?.style.right || "0");

describe("BootPreloader", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    let now = 0;
    jest.spyOn(performance, "now").mockImplementation(() => now);
    jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        return window.setTimeout(() => {
          now += 16;
          cb(now);
        }, 16) as unknown as number;
      });
    jest
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation((id: number) => {
        window.clearTimeout(id);
      });
    Object.assign(state, {
      bootProgress: 0,
      ready: false,
      fallback: false,
      mode: "journey",
      reducedMotion: false,
    });
    mockRoute.pathname = "/";
    document.body.classList.remove("is-locked");
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("does not lock scrolling and starts at 0 with bar and percent in sync", () => {
    render(<BootPreloader allowed />);
    expect(document.body.classList.contains("is-locked")).toBe(false);
    expect(screen.getByText("0")).toBeTruthy();
    expect(document.getElementById("pre-fill")?.style.right).toBe("100.0%");
    expect(screen.getByText(/Granja Maripepa/i)).toBeTruthy();
  });

  it("keeps bar and percent on the same smoothed display while target jumps to ready", () => {
    const { rerender } = render(<BootPreloader allowed />);
    state.bootProgress = 1;
    state.ready = true;
    rerender(<BootPreloader allowed />);

    act(() => {
      jest.advanceTimersByTime(200);
    });
    const early = Number(pct());
    const earlyRight = fillRight();
    expect(early).toBeLessThan(100);
    expect(earlyRight).toBeCloseTo(100 - early, 0);

    act(() => {
      jest.advanceTimersByTime(2200);
    });
    expect(pct()).toBe("100");
    expect(document.getElementById("pre-fill")?.style.right).toBe("0.0%");
    expect(pre()?.classList.contains("done")).toBe(true);

    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(document.body.classList.contains("is-locked")).toBe(false);
  });

  it("finishes on fallback after the shared display reaches the end", () => {
    state.fallback = true;
    render(<BootPreloader allowed />);
    act(() => {
      jest.advanceTimersByTime(2200);
    });
    expect(pre()?.classList.contains("done")).toBe(true);
  });

  it("replays the curtain when the route changes", () => {
    state.ready = true;
    const { rerender } = render(<BootPreloader allowed />);
    act(() => {
      jest.advanceTimersByTime(2200);
    });
    expect(pre()?.classList.contains("done")).toBe(true);
    expect(pct()).toBe("100");

    mockRoute.pathname = "/productos";
    rerender(<BootPreloader allowed />);

    expect(pre()?.classList.contains("done")).toBe(false);
    expect(pct()).toBe("0");
    expect(document.getElementById("pre-fill")?.style.right).toBe("100.0%");

    act(() => {
      jest.advanceTimersByTime(2200);
    });
    expect(pct()).toBe("100");
    expect(pre()?.classList.contains("done")).toBe(true);
  });

  it("keeps the curtain up until the route commits, even on a slow transition", () => {
    state.ready = true;
    const { rerender } = render(<BootPreloader allowed />);
    act(() => {
      jest.advanceTimersByTime(2200);
    });
    expect(pre()?.classList.contains("done")).toBe(true);

    const link = document.createElement("a");
    link.href = "/es/productos";
    link.textContent = "Productos";
    document.body.appendChild(link);

    act(() => {
      link.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));
    });
    // Well past any plausible transition in dev: the cover must still own it.
    act(() => {
      jest.advanceTimersByTime(8000);
    });
    expect(pre()?.classList.contains("done")).toBe(false);
    expect(Number(pct())).toBeLessThan(100);

    mockRoute.pathname = "/productos";
    rerender(<BootPreloader allowed />);
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(pct()).toBe("100");
    expect(pre()?.classList.contains("done")).toBe(true);
    link.remove();
  });

  it("replays the curtain on a locale change", () => {
    state.ready = true;
    mockRoute.pathname = "/es";
    const { rerender } = render(<BootPreloader allowed />);
    act(() => {
      jest.advanceTimersByTime(2200);
    });
    expect(pre()?.classList.contains("done")).toBe(true);

    mockRoute.pathname = "/en";
    rerender(<BootPreloader allowed />);
    expect(pre()?.classList.contains("done")).toBe(false);
    expect(pct()).toBe("0");

    act(() => {
      jest.advanceTimersByTime(2200);
    });
    expect(pct()).toBe("100");
    expect(pre()?.classList.contains("done")).toBe(true);
  });

  it("keeps the reduced-motion curtain visible but short", () => {
    state.ready = true;
    state.reducedMotion = true;
    render(<BootPreloader allowed />);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(pct()).toBe("100");
    expect(pre()?.classList.contains("done")).toBe(true);
  });
});
