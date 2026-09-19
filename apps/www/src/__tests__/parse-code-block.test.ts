import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { parseCodeBlock } from "../app/(site)/(marketing)/blog/[slug]/_components/parse-code-block";

function codeElement(className: string | undefined, text: string) {
  return createElement("code", { className }, text);
}

describe("parseCodeBlock", () => {
  it("extracts the language from a language-* class", () => {
    const result = parseCodeBlock(codeElement("language-ts", "const a = 1;\n"));
    expect(result).toEqual({ code: "const a = 1;", language: "ts" });
  });

  it("returns an empty language when there is no language class", () => {
    const result = parseCodeBlock(codeElement(undefined, "plain text\n"));
    expect(result).toEqual({ code: "plain text", language: "" });
  });

  it("preserves an unknown language tag as-is for the caller to label", () => {
    const result = parseCodeBlock(codeElement("language-foo", "??\n"));
    expect(result).toEqual({ code: "??", language: "foo" });
  });

  it("strips exactly one trailing newline and preserves interior whitespace", () => {
    const source = "line one\n\n  indented line\ttabbed\nline four\n";
    const result = parseCodeBlock(codeElement("language-txt", source));
    expect(result.code).toBe("line one\n\n  indented line\ttabbed\nline four");
  });

  it("does not strip a trailing newline when there isn't exactly one", () => {
    const result = parseCodeBlock(codeElement("language-txt", "no newline"));
    expect(result.code).toBe("no newline");
  });

  it("returns an empty result for non-element children", () => {
    expect(parseCodeBlock(null)).toEqual({ code: "", language: "" });
    expect(parseCodeBlock("bare text")).toEqual({
      code: "bare text",
      language: "",
    });
  });
});
