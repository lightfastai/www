import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(import.meta.dirname, "../../../..");
const workspaceDirectories = ["apps", "packages", "internal", "vendor"];
const dependencyFields = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
] as const;

interface PackageManifest {
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
  readonly name: string;
  readonly optionalDependencies?: Record<string, string>;
  readonly peerDependencies?: Record<string, string>;
}

interface DependencyDeclaration {
  readonly field: (typeof dependencyFields)[number];
  readonly manifestPath: string;
  readonly specifier: string;
}

function getManifestPaths(): string[] {
  const workspaceManifestPaths = workspaceDirectories.flatMap((directory) =>
    readdirSync(resolve(repositoryRoot, directory), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) =>
        resolve(repositoryRoot, directory, entry.name, "package.json")
      )
      .filter(existsSync)
  );

  return [resolve(repositoryRoot, "package.json"), ...workspaceManifestPaths];
}

const manifests = getManifestPaths().map((manifestPath) => ({
  manifestPath,
  manifest: JSON.parse(readFileSync(manifestPath, "utf8")) as PackageManifest,
}));
const workspacePackageNames = new Set(
  manifests.map(({ manifest }) => manifest.name)
);

function getDeclarations(): Map<string, DependencyDeclaration[]> {
  const declarations = new Map<string, DependencyDeclaration[]>();

  for (const { manifest, manifestPath } of manifests) {
    for (const field of dependencyFields) {
      for (const [name, specifier] of Object.entries(manifest[field] ?? {})) {
        const current = declarations.get(name) ?? [];
        current.push({ field, manifestPath, specifier });
        declarations.set(name, current);
      }
    }
  }

  return declarations;
}

describe("workspace dependency policy", () => {
  const declarations = getDeclarations();

  it("uses workspace:* for every repository-local package edge", () => {
    for (const packageName of workspacePackageNames) {
      for (const declaration of declarations.get(packageName) ?? []) {
        expect(declaration.specifier, declaration.manifestPath).toBe(
          "workspace:*"
        );
      }
    }
  });

  it("uses catalogs for every external dependency shared by packages", () => {
    for (const [packageName, packageDeclarations] of declarations) {
      if (
        workspacePackageNames.has(packageName) ||
        packageDeclarations.length < 2
      ) {
        continue;
      }

      for (const declaration of packageDeclarations) {
        expect(
          declaration.specifier,
          `${packageName} in ${declaration.manifestPath}`
        ).toMatch(/^catalog:/);
      }
    }
  });

  it("does not replace packages with filesystem dependencies", () => {
    for (const [packageName, packageDeclarations] of declarations) {
      for (const declaration of packageDeclarations) {
        expect(
          declaration.specifier,
          `${packageName} in ${declaration.manifestPath}`
        ).not.toMatch(/^(file|link):/);
      }
    }
  });
});
