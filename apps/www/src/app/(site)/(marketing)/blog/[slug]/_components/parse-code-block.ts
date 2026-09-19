import { isValidElement, type ReactNode } from "react";

export interface ParsedCodeBlock {
  code: string;
  language: string;
}

const LANGUAGE_CLASS_PATTERN = /language-(\S+)/;

/**
 * MDX with `rehypeCodeOptions: false` emits fenced code as
 * `<pre><code className="language-xxx">raw text</code></pre>`. This extracts
 * the exact source text and the declared language from that `code` element.
 */
export function parseCodeBlock(preChildren: ReactNode): ParsedCodeBlock {
  if (
    !isValidElement<{ className?: string; children?: ReactNode }>(preChildren)
  ) {
    return { code: flattenToString(preChildren), language: "" };
  }

  const className = preChildren.props.className ?? "";
  const language = LANGUAGE_CLASS_PATTERN.exec(className)?.[1] ?? "";
  const rawCode = flattenToString(preChildren.props.children);

  // MDX appends exactly one trailing newline after the fenced block's last
  // source line; strip only that one so the copy payload matches what the
  // author typed, without trimming intentional trailing blank lines.
  const code = rawCode.endsWith("\n") ? rawCode.slice(0, -1) : rawCode;

  return { code, language };
}

function flattenToString(node: ReactNode): string {
  if (typeof node === "string") {
    return node;
  }

  if (typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(flattenToString).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return flattenToString(node.props.children);
  }

  return "";
}
