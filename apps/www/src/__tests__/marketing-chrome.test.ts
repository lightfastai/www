import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isMarketingNavigationLinkCurrent,
  marketingNavigationLinks,
} from "../app/(site)/(marketing)/_components/marketing-navigation";

const marketingLayoutSource = readFileSync(
  resolve(import.meta.dirname, "../app/(site)/(marketing)/layout.tsx"),
  "utf8"
);
const footerSource = readFileSync(
  resolve(
    import.meta.dirname,
    "../app/(site)/(marketing)/_components/footer.tsx"
  ),
  "utf8"
);
const newsletterSectionSource = readFileSync(
  resolve(
    import.meta.dirname,
    "../app/(site)/(marketing)/_components/newsletter-section.tsx"
  ),
  "utf8"
);
const checkboxSource = readFileSync(
  resolve(
    import.meta.dirname,
    "../../../../packages/ui-v2/src/components/ui/checkbox.tsx"
  ),
  "utf8"
);

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

describe("marketing chrome structure", () => {
  it("keeps the newsletter in the foreground and reveals the footer behind it", () => {
    expect(marketingLayoutSource).toContain(
      'className="group/company isolate min-h-svh overflow-x-clip bg-background"'
    );
    expect(marketingLayoutSource).toContain("<NewsletterSection />");
    expect(marketingLayoutSource).toMatch(/<\/div>\s*<Footer \/>\s*<\/div>/);
    expect(footerSource).toContain("sticky bottom-0 z-0 bg-black");
    expect(footerSource).toContain("px-6 py-8");
    expect(footerSource).toContain("md:px-8");
  });

  it("keeps the compact newsletter controls and consent semantics", () => {
    expect(newsletterSectionSource).toContain('id="newsletter-heading"');
    expect(newsletterSectionSource).toContain('id="newsletter-email"');
    expect(newsletterSectionSource).toContain(
      'aria-describedby="newsletter-consent-copy"'
    );
    expect(newsletterSectionSource).toContain('htmlFor="newsletter-consent"');
    expect(newsletterSectionSource).toContain('id="newsletter-consent"');
    expect(newsletterSectionSource).toContain('name="consent"');
    expect(newsletterSectionSource).toContain("required");
    expect(newsletterSectionSource).toContain("h-8 w-full");
    expect(checkboxSource).toContain("CheckboxPrimitive.Root");
    expect(checkboxSource).toContain('data-slot="checkbox"');
    expect(checkboxSource).toContain("focus-visible:ring-3");
    expect(checkboxSource).toContain("disabled:cursor-not-allowed");
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
