import { type Dirent, existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(import.meta.dirname, "../../../..");
const websiteRoot = resolve(repositoryRoot, "apps/www");
const pagePath = resolve(
  websiteRoot,
  "src/app/(site)/(marketing)/mcp/page.tsx"
);
const textExtensions = new Set([
  ".cjs",
  ".js",
  ".json",
  ".md",
  ".mdx",
  ".mjs",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);

function collectTextFiles(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory, { withFileTypes: true }).flatMap(
    (entry: Dirent) => {
      const entryPath = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        if (
          [".git", ".next", ".turbo", ".vercel", "node_modules"].includes(
            entry.name
          )
        ) {
          return [];
        }
        return collectTextFiles(entryPath);
      }
      return textExtensions.has(extname(entry.name)) ? [entryPath] : [];
    }
  );
}

describe("MCP page contract", () => {
  const pageSource = readFileSync(pagePath, "utf8");

  it("documents the retained local stdio package and explicit configuration", () => {
    expect(pageSource).toContain("@lightfastai/mcp");
    expect(pageSource).toContain("local stdio MCP server");
    expect(pageSource).toContain("npm install -g @lightfastai/mcp");
    expect(pageSource).toContain("pnpm add -g @lightfastai/mcp");
    expect(pageSource).toContain("LIGHTFAST_API_KEY");
    expect(pageSource).toContain("LIGHTFAST_API_URL");
    expect(pageSource).toContain("does not supply a hosted MCP service");
    expect(pageSource).toContain("default API URL");
    expect(pageSource).toContain("title: pageTitle");
    expect(pageSource).toContain(
      ["const pageUrl = `", "$", "{SITE_IDENTITY.baseUrl}/mcp`;"].join("")
    );
  });

  it("links only to the package, source repository, and protocol documentation", () => {
    const hrefs = [...pageSource.matchAll(/href: "([^"]+)"/g)].map(
      ([, href]) => href
    );

    expect(hrefs).toEqual([
      "https://www.npmjs.com/package/@lightfastai/mcp",
      "https://github.com/lightfastai/lightfast",
      "https://modelcontextprotocol.io",
    ]);
  });
});

describe("standalone website ownership", () => {
  it("uses Portless to start only the website's direct Next.js dev command", () => {
    const appPackage = JSON.parse(
      readFileSync(resolve(websiteRoot, "package.json"), "utf8")
    ) as {
      portless: { name: string; script: string };
      scripts: Record<string, string>;
    };
    const rootPackage = JSON.parse(
      readFileSync(resolve(repositoryRoot, "package.json"), "utf8")
    ) as { scripts: Record<string, string> };
    const portlessConfig = JSON.parse(
      readFileSync(resolve(websiteRoot, "portless.json"), "utf8")
    ) as { name: string; script: string };

    expect(appPackage.portless).toEqual({
      name: "www.lightfast",
      script: "dev:app",
    });
    expect(portlessConfig).toEqual({
      name: "www.lightfast",
      script: "dev:app",
    });
    expect(appPackage.scripts.dev).toBe("portless");
    expect(appPackage.scripts["dev:app"]).toBe("pnpm with-env next dev");
    expect(appPackage.scripts.build).toBe("pnpm build:prod");
    expect(appPackage.scripts["build:prod"]).toBe("pnpm with-env next build");
    expect(rootPackage.scripts.dev).toBe(
      "SKIP_ENV_VALIDATION=true turbo run dev --filter=@lightfast/www --concurrency=2"
    );
  });

  it("contains no retired cross-application wiring", () => {
    const retiredTokens = [
      ["lightfast", "app"].join("-"),
      ["micro", "frontends"].join(""),
      ["related", "projects"].join("-"),
      ["NEXT", "PUBLIC", "APP", "URL"].join("_"),
    ];
    const lockfilePath = resolve(repositoryRoot, "pnpm-lock.yaml");
    const files = collectTextFiles(repositoryRoot).filter(
      (file) => file !== lockfilePath
    );

    for (const token of retiredTokens) {
      const offenders = files.filter((file) =>
        readFileSync(file, "utf8").includes(token)
      );
      expect(offenders, token).toEqual([]);
    }

    const retiredConfigName = ["micro", "frontends.json"].join("");
    const retiredPatchName = ["@vercel__micro", "frontends@2.3.2.patch"].join(
      ""
    );
    expect(existsSync(resolve(websiteRoot, retiredConfigName))).toBe(false);
    expect(
      existsSync(resolve(repositoryRoot, "patches", retiredPatchName))
    ).toBe(false);
    expect(existsSync(resolve(websiteRoot, "src/origins.ts"))).toBe(false);

    const lockfile = readFileSync(lockfilePath, "utf8");
    const retiredDirectDependency = ["@vercel/micro", "frontends@2.3.2"].join(
      ""
    );
    const retiredRelatedDependency = ["@vercel/related", "projects"].join("-");
    expect(lockfile).not.toContain(retiredDirectDependency);
    expect(lockfile).not.toContain(retiredRelatedDependency);
    expect(lockfile).not.toContain("patch_hash=");
  });
});
