import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createAnalyticsCspDirectives } from "@vendor/security/csp";
import type { NextConfig } from "next";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { GET as redirectDocs } from "../app/(retired)/docs/[[...path]]/route";
import { GET as gone, HEAD as goneHead } from "../lib/http/gone";
import {
  buildSiteManifest,
  rootMetadata,
  SITE_IDENTITY,
} from "../lib/site/identity";

const appRoot = resolve(import.meta.dirname, "../app");
const contentRoot = resolve(import.meta.dirname, "../content");

const expectedContentRoutes = [
  {
    pathname: "/",
    page: "(site)/(marketing)/page.tsx",
    content: "home/home.mdx",
    noindex: false,
  },
  {
    pathname: "/brand",
    page: "(site)/(marketing)/brand/page.tsx",
    content: "brand/brand.mdx",
    noindex: false,
  },
  {
    pathname: "/blog",
    page: "(site)/(marketing)/blog/page.tsx",
  },
  {
    pathname: "/blog/2026-03-26-why-we-built-lightfast",
    page: "(site)/(marketing)/blog/[slug]/page.tsx",
    content: "blog/2026-03-26-why-we-built-lightfast.mdx",
    noindex: true,
  },
  {
    pathname: "/legal/privacy",
    page: "(site)/(marketing)/legal/[slug]/page.tsx",
    content: "legal/privacy.mdx",
    noindex: false,
  },
  {
    pathname: "/legal/terms",
    page: "(site)/(marketing)/legal/[slug]/page.tsx",
    content: "legal/terms.mdx",
    noindex: false,
  },
  {
    pathname: "/mcp",
    page: "(site)/(marketing)/mcp/page.tsx",
  },
] as const;

describe("public route contract", () => {
  it("preserves permanent legacy redirects", async () => {
    const redirects = await (nextConfig as NextConfig).redirects?.();

    expect(redirects).toEqual([
      {
        source: "/company",
        destination: "/brand",
        permanent: true,
      },
      {
        source: "/company/:path*",
        destination: "/brand",
        permanent: true,
      },
      {
        source: "/legal",
        destination: "/legal/terms",
        permanent: true,
      },
    ]);
  });

  it("keeps retired routes gone and docs on a temporary root redirect", () => {
    const getResponse = gone();
    const headResponse = goneHead();
    const docsResponse = redirectDocs(
      new NextRequest("https://lightfast.ai/docs/getting-started")
    );

    expect(getResponse.status).toBe(410);
    expect(headResponse.status).toBe(410);
    expect(getResponse.headers.get("cache-control")).toBe(
      "public, max-age=3600, s-maxage=86400"
    );
    expect(docsResponse.status).toBe(307);
    expect(docsResponse.headers.get("location")).toBe("https://lightfast.ai/");
  });

  it("preserves public rewrites, trailing-slash handling, and CSP sources", async () => {
    const config = nextConfig as NextConfig;
    const rewrites = await config.rewrites?.();

    expect(rewrites).toEqual([
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://us.i.posthog.com/decide",
      },
      { source: "/health", destination: "/api/health" },
      { source: "/healthz", destination: "/api/health" },
    ]);
    expect(config.skipTrailingSlashRedirect).toBe(true);
    expect(createAnalyticsCspDirectives()).toEqual({
      scriptSrc: [
        "https://va.vercel-scripts.com",
        "https://us-assets.i.posthog.com",
      ],
      connectSrc: [
        "https://vitals.vercel-insights.com",
        "https://us.i.posthog.com",
        "https://us.posthog.com",
      ],
      frameSrc: ["https://us.posthog.com"],
    });
  });
});

describe("public metadata and discovery contract", () => {
  it("keeps content routes and indexing intent", () => {
    for (const route of expectedContentRoutes) {
      expect(existsSync(resolve(appRoot, route.page)), route.pathname).toBe(
        true
      );

      if ("content" in route) {
        const content = readFileSync(
          resolve(contentRoot, route.content),
          "utf8"
        );
        expect(content, route.pathname).toContain(
          `noindex: ${String(route.noindex)}`
        );
        expect(content, route.pathname).toMatch(/description: "[^"]+"/);
      }
    }
  });

  it("keeps root social, robots, and manifest identity canonical", () => {
    const manifest = buildSiteManifest();

    expect(rootMetadata.metadataBase?.toString()).toBe(
      `${SITE_IDENTITY.baseUrl}/`
    );
    expect(rootMetadata.alternates?.canonical).toBe(SITE_IDENTITY.baseUrl);
    expect(rootMetadata.robots).toMatchObject({ index: true, follow: true });
    expect(rootMetadata.openGraph).toMatchObject({
      title: SITE_IDENTITY.title,
      description: SITE_IDENTITY.description,
      url: SITE_IDENTITY.baseUrl,
    });
    expect(rootMetadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: SITE_IDENTITY.title,
      description: SITE_IDENTITY.description,
    });
    expect(manifest).toMatchObject({
      name: SITE_IDENTITY.title,
      short_name: SITE_IDENTITY.shortName,
      description: SITE_IDENTITY.description,
      start_url: "/",
      display: "standalone",
      background_color: SITE_IDENTITY.themeColor,
      theme_color: SITE_IDENTITY.themeColor,
    });
  });

  it("keeps MCP and generated discovery metadata on canonical URLs", () => {
    const mcpSource = readFileSync(
      resolve(appRoot, "(site)/(marketing)/mcp/page.tsx"),
      "utf8"
    );
    const llmsSource = readFileSync(
      resolve(appRoot, "(seo)/llms.txt/route.ts"),
      "utf8"
    );
    const sitemapSource = readFileSync(resolve(appRoot, "sitemap.ts"), "utf8");
    const robotsSource = readFileSync(resolve(appRoot, "robots.ts"), "utf8");

    expect(mcpSource).toContain(
      ["const pageUrl = `", "$", "{SITE_IDENTITY.baseUrl}/mcp`"].join("")
    );
    expect(mcpSource).toContain("alternates: { canonical: pageUrl }");
    expect(mcpSource).toContain("url: pageUrl");
    expect(mcpSource).toContain("siteName: SITE_IDENTITY.name");
    expect(llmsSource).toContain("getPublicPublications().map(pageEntryFor)");
    expect(llmsSource).toContain("skipUrl: [/\\/search");
    expect(llmsSource).toContain("/\\/pitch-deck/");
    expect(sitemapSource).toContain("getPublicPublications().map");
    expect(robotsSource).toContain(
      ["sitemap: `", "$", "{SITE_IDENTITY.baseUrl}/sitemap.xml`"].join("")
    );
  });
});
