import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const componentSource = readFileSync(
  resolve(
    import.meta.dirname,
    "../app/(site)/(marketing)/_components/halftone-hero.tsx"
  ),
  "utf8"
);
const fieldShaderSource = readFileSync(
  resolve(
    import.meta.dirname,
    "../app/(site)/(marketing)/_components/halftone-field.wgsl"
  ),
  "utf8"
);
const displayShaderSource = readFileSync(
  resolve(
    import.meta.dirname,
    "../app/(site)/(marketing)/_components/halftone.wgsl"
  ),
  "utf8"
);

describe("Halftone hero contract", () => {
  it("preserves bounded elapsed-time animation and field timing", () => {
    expect(componentSource).toContain(
      "Math.min(timestamp - lastTimestamp, 50)"
    );
    expect(componentSource).toContain(": 16.67;");
    expect(componentSource).toContain("elapsed += delta / 1000;");
    expect(componentSource).toContain("render(elapsed);");
    expect(fieldShaderSource).toContain("params.time * 0.08");
  });

  it("preserves the neutral background and monochrome artwork palette", () => {
    expect(componentSource).toContain("bg-[#e8e8e3]");
    expect(componentSource).toContain("uBg: [0.91, 0.91, 0.89]");
    expect(componentSource).toContain("uFg: [0.031, 0.031, 0.027]");
    expect(componentSource).toContain("uContrast: 1.5");
    expect(componentSource).toContain("uGooeyness: 0.58");
    expect(displayShaderSource).toContain(
      "return vec4f(mix(art.uBg, art.uFg, shape) * art.uReveal, 1);"
    );
  });

  it("keeps the centered Lightfast lockup above active and fallback artwork", () => {
    expect(componentSource).toContain(
      'from "@repo/ui-v2/components/brand/logo"'
    );
    expect(componentSource).toContain(
      'className="pointer-events-none absolute inset-0 z-10 grid place-items-center"'
    );
    expect(componentSource).toContain("<Logo");
    expect(componentSource).toContain(
      'className="max-w-full text-[#e8e8e3] mix-blend-difference"'
    );
    expect(componentSource).toContain("style={heroLogoStyle}");
  });

  it("keeps unsupported and failed states on the same image-free fallback", () => {
    expect(componentSource).toContain('setStatus("unsupported")');
    expect(componentSource).toContain('setStatus("failed")');
    expect(componentSource).toContain(
      'status === "ready" ? "opacity-100" : "opacity-0"'
    );
    expect(componentSource).toContain("data-halftone-status={status}");
    expect(componentSource).not.toContain("<img");
    expect(componentSource).not.toContain("backgroundImage");
  });

  it("preserves the field and dot-rendering parameters", () => {
    expect(componentSource).toContain("const pixelSize = 4;");
    expect(componentSource).toContain(
      "params: { amplitude: 0.8, reveal: 1, time }"
    );
    expect(componentSource).toContain("uInvert: 1");
    expect(componentSource).toContain("uWaveAmplitude: 0");
    expect(fieldShaderSource).toContain(
      "return vec4f(clamp(value, 0, 1), 0, 0, 1);"
    );
  });
});
