import { fileURLToPath } from "node:url";
import sharedConfig from "@repo/vitest-config";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  sharedConfig,
  defineConfig({
    resolve: {
      alias: {
        "~": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    test: {
      environment: "node",
      include: ["src/__tests__/**/*.{test,spec}.{ts,tsx}"],
      passWithNoTests: true,
    },
  })
);
