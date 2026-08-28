import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getLlmsFooter } from "../lib/site/discovery";
import { buildOrganizationEntity, SITE_IDENTITY } from "../lib/site/identity";

describe("public founder identity", () => {
  it("uses the canonical personal Person reference", () => {
    expect(SITE_IDENTITY.contact.founder).toEqual({
      name: "Jeevan Pillay",
      email: "jp@lightfast.ai",
      id: "https://www.jeevanpillay.com/#person",
      url: "https://www.jeevanpillay.com/",
    });

    expect(buildOrganizationEntity().founder).toEqual({
      "@type": "Person",
      "@id": "https://www.jeevanpillay.com/#person",
      name: "Jeevan Pillay",
      url: "https://www.jeevanpillay.com/",
    });
  });

  it("uses the official personal domain in discovery output", () => {
    expect(getLlmsFooter()).toContain(
      "- Founder: Jeevan Pillay - jp@lightfast.ai - https://www.jeevanpillay.com/"
    );
  });

  it("links the existing founder sentence to the official personal domain", () => {
    const brand = readFileSync(
      resolve(import.meta.dirname, "../content/brand/brand.mdx"),
      "utf8"
    );
    const founderSentence = brand
      .split("\n")
      .find((line) => line.includes("is the founder of Lightfast."));

    expect(founderSentence).toBe(
      "Lightfast studies how people, machines, and artificial intelligence can work together to develop consequential physical technologies. " +
        "[Jeevan Pillay](https://www.jeevanpillay.com/) is the founder of Lightfast."
    );
    expect(founderSentence).not.toMatch(
      /scientist|personal fabrication|funding|customers|traction|founded in/i
    );
  });

  it("does not modify the homepage thesis", () => {
    const home = readFileSync(
      resolve(import.meta.dirname, "../content/home/home.mdx"),
      "utf8"
    );
    expect(home).toContain(
      "How should people and machines work together as scientific and engineering teams develop physical systems?"
    );
    expect(home).toContain(
      "Lightfast is an applied artificial intelligence research and product lab."
    );
  });
});

describe("standalone website wiring", () => {
  it("scans the repository-local UI implementation for Tailwind classes", () => {
    const styles = readFileSync(
      resolve(import.meta.dirname, "../styles/styles.css"),
      "utf8"
    );

    expect(styles).toContain(
      '@source "../../../../packages/ui-v2/src/components/brand/logo.tsx";'
    );
    expect(styles).not.toContain('@source "../../../packages/ui-v2/');
  });

  it("keeps website-owned service routes on the website microfrontend", () => {
    const config = JSON.parse(
      readFileSync(
        resolve(import.meta.dirname, "../../microfrontends.json"),
        "utf8"
      )
    ) as {
      applications: {
        "lightfast-www": { routing: Array<{ paths: string[] }> };
      };
    };
    const paths = config.applications["lightfast-www"].routing.flatMap(
      (route) => route.paths
    );

    expect(paths).toEqual(
      expect.arrayContaining([
        "/api/health",
        "/health",
        "/healthz",
        "/ingest/:path*",
        "/monitoring",
      ])
    );
  });
});
