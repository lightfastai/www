"use client";

import { Spinner } from "@repo/ui-v2/components/ui/spinner";
import { cn } from "@repo/ui-v2/lib/utils";
import { type ReactNode, useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  type NewsletterActionState,
  subscribeToNewsletter,
} from "../_actions/newsletter";

const initialState: NewsletterActionState = {
  message: "",
  status: "idle",
};

type NewsletterFormVariant = "compact" | "section";

export function NewsletterForm({
  children,
  resetIcon,
  statusId,
  variant = "compact",
}: {
  children: ReactNode;
  resetIcon: ReactNode;
  statusId: string;
  variant?: NewsletterFormVariant;
}) {
  const [resetKey, setResetKey] = useState(0);

  return (
    <NewsletterActionForm
      key={resetKey}
      onReset={() => setResetKey((key) => key + 1)}
      resetIcon={resetIcon}
      statusId={statusId}
      variant={variant}
    >
      {children}
    </NewsletterActionForm>
  );
}

function NewsletterActionForm({
  children,
  onReset,
  resetIcon,
  statusId,
  variant,
}: {
  children: ReactNode;
  onReset: () => void;
  resetIcon: ReactNode;
  statusId: string;
  variant: NewsletterFormVariant;
}) {
  const [state, formAction, isPending] = useActionState(
    subscribeToNewsletter,
    initialState
  );

  if (state.status !== "idle") {
    return (
      <NewsletterStatusMessage
        onReset={onReset}
        resetIcon={resetIcon}
        state={state}
        statusId={statusId}
        variant={variant}
      />
    );
  }

  return (
    <>
      <form
        action={formAction}
        aria-busy={isPending}
        aria-describedby={isPending ? `${statusId}-pending` : undefined}
        className="relative flex items-center"
      >
        <fieldset className="contents" disabled={isPending}>
          {children}
        </fieldset>
      </form>
      <p aria-live="polite" className="sr-only" id={`${statusId}-pending`}>
        {isPending ? "Submitting your email address." : ""}
      </p>
    </>
  );
}

function NewsletterStatusMessage({
  onReset,
  resetIcon,
  state,
  statusId,
  variant,
}: {
  onReset: () => void;
  resetIcon: ReactNode;
  state: NewsletterActionState;
  statusId: string;
  variant: NewsletterFormVariant;
}) {
  const isSuccess = state.status === "success";
  const resetLabel = isSuccess ? "Use another email" : "Try again";

  if (variant === "section") {
    return (
      <div
        aria-atomic="true"
        aria-live={isSuccess ? "polite" : "assertive"}
        className="min-h-30 border border-border bg-muted px-5 py-5 text-left sm:px-6 sm:py-6"
        id={statusId}
        role={isSuccess ? "status" : "alert"}
      >
        <div className="flex min-h-full flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <p
              className={cn(
                "font-medium text-sm leading-tight",
                isSuccess ? "text-foreground" : "text-destructive"
              )}
            >
              {isSuccess ? "You're on the list" : "We couldn't sign you up"}
            </p>
            <p className="mt-2 text-pretty text-muted-foreground text-sm leading-relaxed">
              {state.message}
            </p>
          </div>
          <button
            className="inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 text-sm transition-colors hover:text-muted-foreground focus-visible:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
            onClick={onReset}
            type="button"
          >
            <span>{resetLabel}</span>
            {resetIcon}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-atomic="true"
      aria-live={isSuccess ? "polite" : "assertive"}
      className={
        isSuccess
          ? "relative flex items-center border border-transparent bg-muted p-3 pr-12 text-xs leading-tight"
          : "relative flex items-center border border-transparent bg-muted p-3 pr-12 text-destructive text-xs leading-tight"
      }
      id={statusId}
      role={isSuccess ? "status" : "alert"}
    >
      <p className="min-w-0 flex-1 break-words">{state.message}</p>
      <button
        aria-label={resetLabel}
        className="absolute inset-y-0 right-0 flex h-full cursor-pointer items-center bg-transparent p-3 transition-colors hover:text-muted-foreground focus-visible:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
        onClick={onReset}
        type="button"
      >
        {resetIcon}
      </button>
    </div>
  );
}

export function NewsletterSubmitButton({
  children,
  className,
  label = "Subscribe",
  pendingLabel = "Subscribing",
}: {
  children: ReactNode;
  className?: string;
  label?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(
        "absolute inset-y-0 right-0 flex h-full cursor-pointer items-center gap-2 bg-transparent p-3 text-xs leading-tight transition-colors hover:text-muted-foreground focus-visible:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:text-muted-foreground",
        className
      )}
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <>
          <span>{pendingLabel}</span>
          <Spinner aria-hidden="true" className="motion-reduce:animate-none" />
        </>
      ) : (
        <>
          <span>{label}</span>
          {children}
        </>
      )}
    </button>
  );
}
