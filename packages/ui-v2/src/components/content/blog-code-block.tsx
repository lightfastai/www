import type { HighlighterCore, ThemedToken } from "@shikijs/core";
import { createHighlighterCore } from "@shikijs/core";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import langBash from "@shikijs/langs/bash";
import langCss from "@shikijs/langs/css";
import langGo from "@shikijs/langs/go";
import langHtml from "@shikijs/langs/html";
import langJs from "@shikijs/langs/javascript";
import langJson from "@shikijs/langs/json";
import langJsonc from "@shikijs/langs/jsonc";
import langJsx from "@shikijs/langs/jsx";
import langMarkdown from "@shikijs/langs/markdown";
import langPy from "@shikijs/langs/python";
import langRust from "@shikijs/langs/rust";
import langSql from "@shikijs/langs/sql";
import langTsx from "@shikijs/langs/tsx";
import langTs from "@shikijs/langs/typescript";
import langYaml from "@shikijs/langs/yaml";
import githubDark from "@shikijs/themes/github-dark";
import githubLight from "@shikijs/themes/github-light";
import { cn } from "../../lib/utils";
import { BlogCodeCopyButton } from "./blog-code-copy-button";

// Server-side counterpart to `ai-elements/code-block.tsx`'s client highlighter:
// same language/theme bundles, but awaited once during the static render of a
// force-static blog page so the highlighted markup is present before hydration.
let highlighterPromise: Promise<HighlighterCore> | null = null;

function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= createHighlighterCore({
    langs: [
      langTs,
      langJs,
      langTsx,
      langJsx,
      langBash,
      langJson,
      langJsonc,
      langYaml,
      langPy,
      langGo,
      langRust,
      langSql,
      langCss,
      langHtml,
      langMarkdown,
    ],
    themes: [githubLight, githubDark],
    engine: createJavaScriptRegexEngine(),
  });
  return highlighterPromise;
}

function capitalize(value: string): string {
  const [first, ...rest] = value;
  return first === undefined ? value : first.toUpperCase() + rest.join("");
}

interface KeyedToken {
  key: string;
  token: ThemedToken;
}

interface KeyedLine {
  key: string;
  tokens: KeyedToken[];
}

function addKeysToTokens(lines: ThemedToken[][]): KeyedLine[] {
  return lines.map((line, lineIndex) => ({
    key: `line-${lineIndex}`,
    tokens: line.map((token, tokenIndex) => ({
      key: `line-${lineIndex}-${tokenIndex}`,
      token,
    })),
  }));
}

export interface BlogCodeBlockProps {
  code: string;
  language: string;
}

export async function BlogCodeBlock({ code, language }: BlogCodeBlockProps) {
  const highlighter = await getHighlighter();
  const loaded = new Set(highlighter.getLoadedLanguages());
  const normalizedLanguage = language.toLowerCase();
  const lang = loaded.has(normalizedLanguage) ? normalizedLanguage : "text";
  const label = language ? capitalize(language) : "Text";

  const { tokens } = highlighter.codeToTokens(code, {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
  });
  const keyedLines = addKeysToTokens(tokens);

  return (
    <div className="my-4 overflow-hidden rounded-2xl bg-card text-card-foreground">
      <div className="flex h-12 items-center gap-2.5 px-4 font-medium text-foreground text-sm">
        <span aria-hidden="true" className="font-mono font-semibold text-sm">
          {"</>"}
        </span>
        <span className="capitalize">{label}</span>
        <div className="ml-auto">
          <BlogCodeCopyButton code={code} />
        </div>
      </div>
      <section
        aria-label="Code sample, scroll horizontally"
        className="overflow-x-auto rounded-b-2xl px-4 pt-3 pb-5 text-sm leading-6 outline-none focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:ring-inset"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard-scrollable region, per WAI-ARIA scrollable-region pattern
        tabIndex={0}
      >
        <pre className="m-0 bg-transparent p-0">
          <code className="font-mono">
            {keyedLines.map((keyedLine) => (
              <span className="block min-h-[1lh]" key={keyedLine.key}>
                {keyedLine.tokens.length === 0
                  ? "\n"
                  : keyedLine.tokens.map(({ key, token }) => (
                      <TokenSpan key={key} token={token} />
                    ))}
              </span>
            ))}
          </code>
        </pre>
      </section>
    </div>
  );
}

function TokenSpan({ token }: { token: ThemedToken }) {
  return (
    <span
      className={cn(
        "dark:!text-[var(--shiki-dark)]",
        token.bgColor && "dark:!bg-[var(--shiki-dark-bg)]"
      )}
      style={{
        backgroundColor: token.bgColor,
        color: token.color,
        ...token.htmlStyle,
      }}
    >
      {token.content}
    </span>
  );
}
