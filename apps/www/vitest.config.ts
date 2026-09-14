import { fileURLToPath } from "node:url";
import sharedConfig from "@repo/vitest-config";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  sharedConfig,
  defineConfig({
    oxc: { jsx: { runtime: "automatic" } },
    plugins: [
      {
        name: "wgsl-text",
        transform(source, id) {
          if (id.endsWith(".wgsl")) {
            return {
              code: `export default ${JSON.stringify({ version: 1, wgsl: source })}`,
              map: null,
            };
          }
          return null;
        },
      },
    ],
    resolve: {
      alias: {
        "~": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    test: {
      environment: "node",
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      passWithNoTests: false,
    },
  })
);
