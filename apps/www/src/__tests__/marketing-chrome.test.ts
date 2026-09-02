import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isMarketingNavigationLinkCurrent,
  marketingNavigationLinks,
} from "../app/(site)/(marketing)/_components/marketing-navigation";

describe("marketing navigation", () => {
  it("keeps the primary information architecture focused", () => {
    expect(marketingNavigationLinks).toEqual([
      { href: "/", label: "Home" },
      { href: "/brand", label: "Brand" },
    ]);
  });

  it("marks only exact primary routes as current", () => {
    expect(isMarketingNavigationLinkCurrent("/", "/")).toBe(true);
    expect(isMarketingNavigationLinkCurrent("/brand", "/brand")).toBe(true);
    expect(isMarketingNavigationLinkCurrent("/blog", "/")).toBe(false);
    expect(isMarketingNavigationLinkCurrent("/brand/preview", "/brand")).toBe(
      false
    );
  });
});

describe("brand guidelines", () => {
  const brand = readFileSync(
    resolve(import.meta.dirname, "../content/brand/brand.mdx"),
    "utf8"
  );

  it("uses consistent, current document metadata", () => {
    expect(brand).toContain('title: "Brand Guidelines"');
    expect(brand).toContain('ogTitle: "Lightfast Brand Guidelines"');
    expect(brand).toContain('updatedAt: "2026-09-02T00:00:00Z"');
    expect(brand).not.toContain('title: "Design Guidelines"');
  });

  it("preserves the approved public thesis and usage terms", () => {
    expect(brand).toContain(
      "Lightfast studies how people, machines, and artificial intelligence can work together to develop consequential physical technologies."
    );
    expect(brand).toContain(
      "[Jeevan Pillay](https://www.jeevanpillay.com/) is the founder of Lightfast."
    );
    expect(brand).toContain(
      "Lightfast may revoke permission to use its Marks at any time."
    );
  });
});
