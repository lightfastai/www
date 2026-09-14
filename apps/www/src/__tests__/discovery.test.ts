import { describe, expect, it, vi } from "vitest";
import robots from "../app/robots";

const environment = vi.hoisted(() => ({ NEXT_PUBLIC_VERCEL_ENV: "preview" }));
vi.mock("~/env", () => ({ env: environment }));

describe("robots environment policy", () => {
  it("keeps previews and development out of indexing", () => {
    for (const value of ["preview", "development"]) {
      environment.NEXT_PUBLIC_VERCEL_ENV = value;
      expect(robots()).toEqual({ rules: { userAgent: "*", disallow: ["/"] } });
    }
  });
  it("advertises the canonical sitemap while keeping private surfaces excluded", () => {
    environment.NEXT_PUBLIC_VERCEL_ENV = "production";
    expect(robots()).toMatchObject({
      sitemap: "https://lightfast.ai/sitemap.xml",
      rules: {
        userAgent: "*",
        allow: ["/", "/llms.txt"],
        disallow: expect.arrayContaining([
          "/api/",
          "/oauth/",
          "/sign-in",
          "/*/search$",
          "/*/search/",
          "/*/mcp/",
          "/*/settings/",
        ]),
      },
    });
  });
});
