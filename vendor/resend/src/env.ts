import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const resendApiKey = z.string().min(1).startsWith("re_");

export const env = createEnv({
  clientPrefix: "" as const,
  client: {},
  server: {
    RESEND_API_KEY: process.env.VERCEL ? resendApiKey : resendApiKey.optional(),
  },
  runtimeEnv: {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  },
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION ||
    process.env.npm_lifecycle_event === "lint",
});
