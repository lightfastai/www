import { defineConfig } from "vitest/config";

// Bound local and CI worker use; each consumer owns its test discovery.
export default defineConfig({
  test: {
    pool: "threads",
    maxWorkers: 2,
    fileParallelism: false,
  },
});
