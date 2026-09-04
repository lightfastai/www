import { afterEach, describe, expect, it, vi } from "vitest";

const originalSkipEnvValidation = process.env.SKIP_ENV_VALIDATION;
const originalSentryAuthToken = process.env.SENTRY_AUTH_TOKEN;

const restoreEnvironmentVariable = (
  name: "SENTRY_AUTH_TOKEN" | "SKIP_ENV_VALIDATION",
  value: string | undefined
) => {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
};

describe("Sentry environment", () => {
  afterEach(() => {
    restoreEnvironmentVariable(
      "SKIP_ENV_VALIDATION",
      originalSkipEnvValidation
    );
    restoreEnvironmentVariable("SENTRY_AUTH_TOKEN", originalSentryAuthToken);
    vi.resetModules();
  });

  it("normalizes an empty optional auth token to undefined", async () => {
    delete process.env.SKIP_ENV_VALIDATION;
    process.env.SENTRY_AUTH_TOKEN = "";
    vi.resetModules();

    const { sentryEnv } = await import("@vendor/observability/sentry-env");

    expect(sentryEnv.SENTRY_AUTH_TOKEN).toBeUndefined();
  });
});
