"use client";

import {
  getLogoMetrics,
  LOGO_MARK_SIZES,
  Logo,
} from "@repo/ui-v2/components/brand/logo";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import halftoneDisplayShader from "./halftone.wgsl";
import halftoneFieldShader from "./halftone-field.wgsl";

type ArtworkStatus = "loading" | "ready" | "unsupported" | "failed";

const HERO_LOGO_MARK_VIEWPORT_WIDTH = 5;
const heroLogoMetrics = getLogoMetrics(LOGO_MARK_SIZES.lg);
const heroLogoMinimumScale = LOGO_MARK_SIZES.xs / LOGO_MARK_SIZES.lg;

const fluidLogoLength = (length: number) => {
  const minimum = length * heroLogoMinimumScale;
  const viewportWidth =
    length * (HERO_LOGO_MARK_VIEWPORT_WIDTH / LOGO_MARK_SIZES.lg);

  return `clamp(${minimum}px, ${viewportWidth}vw, ${length}px)`;
};

const heroLogoStyle = {
  "--logo-gap": fluidLogoLength(heroLogoMetrics.gap),
  "--logo-mark-size": fluidLogoLength(heroLogoMetrics.markSize),
  "--logo-wordmark-height": fluidLogoLength(heroLogoMetrics.wordmarkHeight),
  "--logo-wordmark-width": fluidLogoLength(heroLogoMetrics.wordmarkWidth),
} as CSSProperties;

export function HalftoneHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<ArtworkStatus>("loading");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let cancelled = false;
    let animationFrame = 0;
    let animationPending = false;
    let pageVisible = !document.hidden;
    let artworkVisible = true;
    let elapsed = 0;
    let lastTimestamp = 0;
    let render: ((time: number) => void) | undefined;
    let dispose: (() => void) | undefined;

    const tick = (timestamp: number) => {
      animationPending = false;
      if (cancelled || !pageVisible || !artworkVisible || !render) {
        return;
      }

      const delta = lastTimestamp
        ? Math.min(timestamp - lastTimestamp, 50)
        : 16.67;
      lastTimestamp = timestamp;
      elapsed += delta / 1000;
      render(elapsed);
      scheduleFrame();
    };

    const scheduleFrame = () => {
      if (
        !(cancelled || animationPending) &&
        pageVisible &&
        artworkVisible &&
        render
      ) {
        animationPending = true;
        animationFrame = requestAnimationFrame(tick);
      }
    };

    const wake = () => {
      lastTimestamp = 0;
      scheduleFrame();
    };

    const onVisibilityChange = () => {
      pageVisible = !document.hidden;
      if (pageVisible) {
        wake();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const intersectionObserver = new IntersectionObserver((entries) => {
      artworkVisible = entries.at(-1)?.isIntersecting ?? true;
      if (artworkVisible) {
        wake();
      }
    });
    intersectionObserver.observe(canvas);

    const resizeObserver = new ResizeObserver(wake);
    resizeObserver.observe(canvas);

    void (async () => {
      if (!("gpu" in navigator)) {
        if (!cancelled) {
          setStatus("unsupported");
        }
        return;
      }

      try {
        const { effect, frame, init, sampler, surface, target } = await import(
          "vgpu"
        );
        const gpu = await init({ powerPreference: "high-performance" });
        if (cancelled) {
          gpu.dispose();
          return;
        }

        const canvasSurface = surface(gpu, canvas, {
          alphaMode: "opaque",
          dpr: [1, 2],
          label: "halftone hero",
        });
        const field = target(gpu, { format: "r8unorm", size: [1, 1] });
        const fieldEffect = effect(gpu, halftoneFieldShader, {
          label: "halftone field",
        });
        const displayEffect = effect(gpu, halftoneDisplayShader, {
          label: "halftone display",
          set: {
            fieldSampler: sampler(gpu, {
              magFilter: "linear",
              minFilter: "linear",
            }),
            fieldTexture: field,
          },
        });
        const stopErrors = gpu.onError((error) => {
          console.warn("vGPU halftone hero error", error);
          setStatus("failed");
        });
        let firstFrame = true;

        dispose = () => {
          stopErrors();
          gpu.dispose();
        };
        render = (time) => {
          const pixelSize = 4;
          const fieldSize: [number, number] = [
            Math.max(1, Math.ceil(canvasSurface.size[0] / pixelSize) + 1),
            Math.max(1, Math.ceil(canvasSurface.size[1] / pixelSize) + 1),
          ];
          if (
            field.size[0] !== fieldSize[0] ||
            field.size[1] !== fieldSize[1]
          ) {
            field.resize(fieldSize);
            displayEffect.set({ fieldTexture: field });
          }

          fieldEffect.set({
            params: { amplitude: 0.8, reveal: 1, time },
          });
          displayEffect.set({
            art: {
              uBg: [0.91, 0.91, 0.89],
              uBias: 0,
              uContrast: 1.5,
              uFg: [0.031, 0.031, 0.027],
              uGooeyness: 0.58,
              uInvert: 1,
              uPixelSize: pixelSize,
              uReveal: 1,
              uWaveAmplitude: 0,
              uWaveFrequency: 1,
              uWaveTime: 0,
            },
            frame: { resolution: canvasSurface.size },
          });
          const renderedFrame = frame(gpu, (activeFrame) => {
            activeFrame.pass(field, fieldEffect);
            activeFrame.pass(canvasSurface, displayEffect);
          });

          if (firstFrame) {
            firstFrame = false;
            void renderedFrame.done.then(() => {
              if (!cancelled) {
                setStatus("ready");
              }
            });
          }
        };
        wake();
      } catch (error) {
        if (!cancelled) {
          console.warn("Unable to start vGPU halftone hero", error);
          setStatus("failed");
        }
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrame);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      dispose?.();
    };
  }, []);

  return (
    <div
      className="relative size-full bg-[#e8e8e3]"
      data-halftone-status={status}
    >
      <canvas
        className={`absolute inset-0 block size-full transition-opacity duration-300 ${
          status === "ready" ? "opacity-100" : "opacity-0"
        }`}
        data-halftone-canvas=""
        ref={canvasRef}
      />
      <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
        <Logo
          className="max-w-full text-[#e8e8e3] mix-blend-difference"
          size="lg"
          style={heroLogoStyle}
        />
      </div>
    </div>
  );
}
