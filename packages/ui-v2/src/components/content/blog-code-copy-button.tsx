"use client";

import { Alert02Icon, CheckIcon, CopyIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

type CopyStatus = "idle" | "copied" | "failed";

export function BlogCodeCopyButton({ code }: { code: string }) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const timeoutRef = useRef<number>(0);

  useEffect(
    () => () => {
      window.clearTimeout(timeoutRef.current);
    },
    []
  );

  const handleCopy = async () => {
    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error("Clipboard API not available");
      }
      await navigator.clipboard.writeText(code);
      setStatus("copied");
    } catch {
      setStatus("failed");
    } finally {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setStatus("idle"), 2000);
    }
  };

  const icon =
    status === "copied"
      ? CheckIcon
      : status === "failed"
        ? Alert02Icon
        : CopyIcon;

  return (
    <>
      <button
        aria-label="Copy code"
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/30",
          status === "failed" && "text-destructive"
        )}
        onClick={handleCopy}
        type="button"
      >
        <HugeiconsIcon icon={icon} size={16} strokeWidth={2} />
      </button>
      <span className="sr-only" role="status">
        {status === "copied" && "Copied"}
        {status === "failed" && "Copy failed"}
      </span>
    </>
  );
}
