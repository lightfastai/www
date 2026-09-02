import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const arcjetKey = z.string().min(1).startsWith("ajkey_");

export const env = createEnv({
  clientPrefix: "" as const,
  client: {},
  server: {
    ARCJET_KEY: process.env.VERCEL ? arcjetKey : arcjetKey.optional(),
    VERCEL_ENV: z
      .enum(["development", "preview", "production"])
      .default("development"),
  },
  runtimeEnv: {
    ARCJET_KEY: process.env.ARCJET_KEY,
    VERCEL_ENV: process.env.VERCEL_ENV ?? "development",
  },
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION ||
    process.env.npm_lifecycle_event === "lint",
});
