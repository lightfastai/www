import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import receipt from "../../brand-assets.json";
import {
  buildOrganizationEntity,
  buildSiteManifest,
  rootMetadata,
} from "../lib/site/identity";

const root = resolve(import.meta.dirname, "../../../..");
const app = resolve(root, "apps/www/src/app");
const publicRoot = resolve(root, "apps/www/public");
describe("canonical dotted assets", () => {
  it("preserves the verified individual source bytes", () => {
    expect(receipt.files).toHaveLength(12);
    for (const file of receipt.files) {
      expect(
        createHash("sha256")
          .update(readFileSync(resolve(root, file.path)))
          .digest("hex"),
        file.path
      ).toBe(file.sha256);
    }
    expect(
      readFileSync(resolve(app, "icon.svg"), "utf8").match(/a4 4 0 1 0/g)
    ).toHaveLength(37);
  });
  it("lets App Router generate only the intended icon links", () => {
    expect(
      readdirSync(app)
        .filter((name) => /^(favicon|icon|apple-icon)/.test(name))
        .sort()
    ).toEqual(["apple-icon.png", "favicon.ico", "icon.svg"]);
    expect(rootMetadata.icons).toBeUndefined();
    for (const name of ["favicon.ico", "icon.svg", "apple-icon.png"]) {
      expect(existsSync(resolve(publicRoot, name))).toBe(false);
    }
  });
  it("resolves manifest, organization and startup images to shipped assets", () => {
    for (const icon of buildSiteManifest().icons ?? []) {
      const name = icon.src.replace(/^\//, "");
      expect(
        existsSync(resolve(app, name)) || existsSync(resolve(publicRoot, name)),
        icon.src
      ).toBe(true);
      if (icon.type === "image/png") {
        const bytes = readFileSync(
          existsSync(resolve(app, name))
            ? resolve(app, name)
            : resolve(publicRoot, name)
        );
        expect(icon.sizes).toBe(
          `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`
        );
      }
    }
    expect(buildOrganizationEntity().logo).toMatchObject({
      url: "https://lightfast.ai/icon-512.png",
    });
    expect(rootMetadata.appleWebApp).toMatchObject({
      startupImage: "/apple-icon.png",
    });
  });
});
