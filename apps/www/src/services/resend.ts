import { parseError } from "@vendor/observability/error/next";
import { createResendClient, type ResendClient } from "@vendor/resend";
import type {
  AddContactSegmentOptions,
  CreateContactOptions,
  UpdateContactOptions,
} from "@vendor/resend/types";
import { Data, Effect } from "effect";
import { env } from "~/env";

const RESEND_CONFLICT_STATUS_CODE = 409;
const RESEND_REQUEST_TIMEOUT = "5 seconds";

let resend: ResendClient | undefined;

function getResendClient(): ResendClient {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  resend ??= createResendClient(apiKey);
  return resend;
}

export class ApplicationError extends Data.TaggedError("ApplicationError")<{
  readonly message: string;
}> {}

export class ResendError extends Data.TaggedError("ResendError")<{
  readonly code: string;
  readonly message: string;
  readonly statusCode: number | null;
}> {}

type ResendServiceError = ApplicationError | ResendError;

const resendTimeoutError = () =>
  new ApplicationError({
    message: "Resend request timed out.",
  });

export const createContact = (options: CreateContactOptions) =>
  Effect.tryPromise({
    try: () => getResendClient().contacts.create(options),
    catch: (error) =>
      new ApplicationError({
        message: parseError(error),
      }),
  })
    .pipe(
      Effect.flatMap((response) => {
        if (response.error) {
          return Effect.fail(
            new ResendError({
              code: response.error.name,
              message: response.error.message,
              statusCode: response.error.statusCode,
            })
          );
        }

        return Effect.succeed(response.data);
      })
    )
    .pipe(
      Effect.timeoutFail({
        duration: RESEND_REQUEST_TIMEOUT,
        onTimeout: resendTimeoutError,
      })
    );

export const updateContact = (options: UpdateContactOptions) =>
  Effect.tryPromise({
    try: () => getResendClient().contacts.update(options),
    catch: (error) =>
      new ApplicationError({
        message: parseError(error),
      }),
  })
    .pipe(
      Effect.flatMap((response) => {
        if (response.error) {
          return Effect.fail(
            new ResendError({
              code: response.error.name,
              message: response.error.message,
              statusCode: response.error.statusCode,
            })
          );
        }

        return Effect.succeed(response.data);
      })
    )
    .pipe(
      Effect.timeoutFail({
        duration: RESEND_REQUEST_TIMEOUT,
        onTimeout: resendTimeoutError,
      })
    );

export const addContactToSegment = (options: AddContactSegmentOptions) =>
  Effect.tryPromise({
    try: () => getResendClient().contacts.segments.add(options),
    catch: (error) =>
      new ApplicationError({
        message: parseError(error),
      }),
  })
    .pipe(
      Effect.flatMap((response) => {
        if (response.error) {
          return Effect.fail(
            new ResendError({
              code: response.error.name,
              message: response.error.message,
              statusCode: response.error.statusCode,
            })
          );
        }

        return Effect.succeed(response.data);
      })
    )
    .pipe(
      Effect.timeoutFail({
        duration: RESEND_REQUEST_TIMEOUT,
        onTimeout: resendTimeoutError,
      })
    );

export const isResendConflict = (
  error: ResendServiceError
): error is ResendError =>
  error._tag === "ResendError" &&
  error.statusCode === RESEND_CONFLICT_STATUS_CODE;
