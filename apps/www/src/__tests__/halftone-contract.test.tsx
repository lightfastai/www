// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HalftoneHero } from "../app/(site)/(marketing)/_components/halftone-hero";

const gpu = vi.hoisted(() => ({
  init: vi.fn(),
  dispose: vi.fn(),
  stopErrors: vi.fn(),
  fieldSet: vi.fn(),
  displaySet: vi.fn(),
  resize: vi.fn(),
  pass: vi.fn(),
}));
vi.mock("vgpu", () => ({
  init: gpu.init,
  surface: () => ({ size: [800, 400] }),
  target: () => ({ size: [1, 1], resize: gpu.resize }),
  sampler: () => ({}),
  effect: (_gpu: unknown, _shader: unknown, options: { label: string }) => ({
    set: options.label === "halftone field" ? gpu.fieldSet : gpu.displaySet,
  }),
  frame: (
    _gpu: unknown,
    callback: (frame: { pass: typeof gpu.pass }) => void
  ) => {
    callback({ pass: gpu.pass });
    return { done: Promise.resolve() };
  },
}));
let tick: FrameRequestCallback;
let intersect: IntersectionObserverCallback;
let onError: (error: Error) => void;
const disconnect = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        intersect = callback;
      }
      observe() {
        /* Observer delivery is controlled by the test. */
      }
      disconnect = disconnect;
    }
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {
        /* Observer delivery is controlled by the test. */
      }
      disconnect = disconnect;
    }
  );
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback) => {
      tick = callback;
      return 1;
    })
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  Object.defineProperty(navigator, "gpu", { configurable: true, value: {} });
  gpu.init.mockResolvedValue({
    dispose: gpu.dispose,
    onError: (callback: typeof onError) => {
      onError = callback;
      return gpu.stopErrors;
    },
  });
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, "gpu");
});

function artwork(container: HTMLElement) {
  return container.querySelector("[data-halftone-status]");
}

describe("halftone lifecycle and render contract", () => {
  it("keeps the lockup visible over an image-free unsupported fallback", async () => {
    Reflect.deleteProperty(navigator, "gpu");
    const { container } = render(<HalftoneHero />);
    await waitFor(() =>
      expect(artwork(container)).toHaveAttribute(
        "data-halftone-status",
        "unsupported"
      )
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
    expect(gpu.init).not.toHaveBeenCalled();
    expect(container.querySelector("canvas")).toHaveClass("opacity-0");
  });
  it("renders bounded animation with the approved palette, field scale and two passes", async () => {
    const { container, unmount } = render(<HalftoneHero />);
    await waitFor(() => expect(gpu.init).toHaveBeenCalled());
    await act(async () => {
      tick(100);
    });
    expect(artwork(container)).toHaveAttribute("data-halftone-status", "ready");
    expect(gpu.resize).toHaveBeenCalledWith([201, 101]);
    expect(gpu.fieldSet).toHaveBeenLastCalledWith({
      params: { amplitude: 0.8, reveal: 1, time: 0.016_67 },
    });
    expect(gpu.displaySet).toHaveBeenLastCalledWith({
      art: {
        uBg: [0.91, 0.91, 0.89],
        uBias: 0,
        uContrast: 1.5,
        uFg: [0.031, 0.031, 0.027],
        uGooeyness: 0.58,
        uInvert: 1,
        uPixelSize: 4,
        uReveal: 1,
        uWaveAmplitude: 0,
        uWaveFrequency: 1,
        uWaveTime: 0,
      },
      frame: { resolution: [800, 400] },
    });
    expect(gpu.pass).toHaveBeenCalledTimes(2);
    await act(async () => {
      tick(10_000);
    });
    expect(gpu.fieldSet.mock.lastCall?.[0].params.time).toBeCloseTo(0.066_67);
    act(() =>
      intersect(
        [{ isIntersecting: false }] as IntersectionObserverEntry[],
        {} as IntersectionObserver
      )
    );
    const calls = gpu.pass.mock.calls.length;
    act(() => tick(20_000));
    expect(gpu.pass).toHaveBeenCalledTimes(calls);
    act(() => onError(new Error("device lost")));
    expect(artwork(container)).toHaveAttribute(
      "data-halftone-status",
      "failed"
    );
    expect(container.querySelector("canvas")).toHaveClass("opacity-0");
    expect(container.querySelector("svg")).toBeInTheDocument();
    unmount();
    expect(gpu.dispose).toHaveBeenCalledOnce();
    expect(gpu.stopErrors).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalledTimes(2);
  });
  it("falls back when initialization rejects", async () => {
    gpu.init.mockRejectedValue(new Error("no adapter"));
    const { container } = render(<HalftoneHero />);
    await waitFor(() =>
      expect(artwork(container)).toHaveAttribute(
        "data-halftone-status",
        "failed"
      )
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

// WGSL executes on a GPU, outside the mocked lifecycle above. Retain the narrow
// shader math contracts until a deterministic GPU rendering runner is available.
describe("shader math contracts", () => {
  it("preserves field timing, bounded output and monochrome compositing", async () => {
    const field = (
      await import("../app/(site)/(marketing)/_components/halftone-field.wgsl")
    ).default;
    const display = (
      await import("../app/(site)/(marketing)/_components/halftone.wgsl")
    ).default;
    expect(field.wgsl.replace(/\s+/g, " ")).toContain("params.time * 0.08");
    expect(field.wgsl.replace(/\s+/g, " ")).toContain(
      "vec4f(clamp(value, 0, 1), 0, 0, 1)"
    );
    expect(display.wgsl.replace(/\s+/g, " ")).toContain(
      "vec4f(mix(art.uBg, art.uFg, shape) * art.uReveal, 1)"
    );
  });
});
