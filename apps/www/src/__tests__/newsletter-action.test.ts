import { Effect } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { subscribeToNewsletter } from "../app/(site)/(marketing)/_actions/newsletter";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  segment: vi.fn(),
  notify: vi.fn(),
  protect: vi.fn(),
  after: vi.fn(),
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/server", () => ({ after: mocks.after }));
vi.mock("@vendor/observability/error/next", () => ({ parseError: String }));
vi.mock("@vendor/observability/sentry-nextjs", () => ({
  captureException: vi.fn(),
  logger: { warn: vi.fn(), error: vi.fn() },
  withServerActionInstrumentation: (
    _name: string,
    _options: unknown,
    action: () => unknown
  ) => action(),
}));
vi.mock("@vendor/security", () => ({
  ARCJET_KEY: "local-mock",
  arcjet: () => ({ protect: mocks.protect }),
  request: async () => ({}),
  protectSignup: vi.fn(),
}));
vi.mock("~/services/resend", () => ({
  createContact: mocks.create,
  updateContact: mocks.update,
  addContactToSegment: mocks.segment,
  isResendConflict: (error: { code?: string }) => error.code === "conflict",
}));
vi.mock("~/services/slack", () => ({ notifyNewsletterSignup: mocks.notify }));
const initial = { status: "idle", message: "" } as const;
function form(email: string) {
  const data = new FormData();
  data.set("email", email);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.create.mockReturnValue(Effect.void);
  mocks.update.mockReturnValue(Effect.void);
  mocks.segment.mockReturnValue(Effect.void);
  mocks.notify.mockReturnValue(Effect.void);
  mocks.protect.mockResolvedValue({
    isDenied: () => false,
    isErrored: () => false,
  });
});

describe("newsletter action with isolated providers", () => {
  it("rejects invalid input before calling any provider", async () => {
    expect(await subscribeToNewsletter(initial, form("invalid"))).toMatchObject(
      { status: "error" }
    );
    expect(mocks.protect).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("normalizes email, subscribes and schedules notification only after success", async () => {
    expect(
      await subscribeToNewsletter(initial, form(" Reader@Example.test "))
    ).toMatchObject({ status: "success" });
    expect(mocks.create).toHaveBeenCalledWith({
      email: "reader@example.test",
      unsubscribed: false,
      segments: [{ id: expect.any(String) }],
    });
    expect(mocks.after).toHaveBeenCalledOnce();
    await mocks.after.mock.calls[0]?.[0]();
    expect(mocks.notify).toHaveBeenCalledWith({ email: "reader@example.test" });
  });
  it("resubscribes an existing contact and tolerates existing segment membership", async () => {
    const conflict = { _tag: "ResendError", code: "conflict" };
    mocks.create.mockReturnValue(Effect.fail(conflict));
    mocks.segment.mockReturnValue(Effect.fail(conflict));
    expect(
      await subscribeToNewsletter(initial, form("reader@example.test"))
    ).toMatchObject({ status: "success" });
    expect(mocks.update).toHaveBeenCalledWith({
      email: "reader@example.test",
      unsubscribed: false,
    });
    expect(mocks.segment).toHaveBeenCalledOnce();
  });
  it("returns a recoverable provider failure without notifying", async () => {
    mocks.create.mockReturnValue(
      Effect.fail({
        _tag: "ResendError",
        code: "unavailable",
        message: "offline",
      })
    );
    expect(
      await subscribeToNewsletter(initial, form("reader@example.test"))
    ).toEqual({
      status: "error",
      message: "We couldn't subscribe that address. Please try again.",
    });
    expect(mocks.after).not.toHaveBeenCalled();
  });
  it("does not subscribe a protection-denied request", async () => {
    mocks.protect.mockResolvedValue({
      isDenied: () => true,
      reason: { isRateLimit: () => true, reset: 12 },
    });
    expect(
      await subscribeToNewsletter(initial, form("reader@example.test"))
    ).toEqual({
      status: "error",
      message: "Too many attempts. Please wait 12s and try again.",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
