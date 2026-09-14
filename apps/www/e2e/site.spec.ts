import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import receipt from "../brand-assets.json" with { type: "json" };

// This suite is local-only. No POST ever reaches a real server action, and no
// browser request reaches analytics, email, auth, or another external provider.
test.beforeEach(async ({ context }) => {
  await context.route("**/*", (route) => {
    const request = route.request();
    if (
      new URL(request.url()).origin !== "http://127.0.0.1:4187" ||
      request.method() === "POST"
    ) {
      return route.abort();
    }
    return route.continue();
  });
});

test("serves exact brand bytes, unambiguous icon metadata and working manifest URLs", async ({
  page,
  request,
}) => {
  await Promise.all(
    receipt.files.map(async (file) => {
      const pathname = file.path.replace(/^apps\/www\/(src\/app|public)/, "");
      const response = await request.get(pathname);
      expect(response.status(), pathname).toBe(200);
      expect(
        createHash("sha256")
          .update(await response.body())
          .digest("hex"),
        pathname
      ).toBe(file.sha256);
    })
  );
  await page.goto("/");
  const icons = await page
    .locator(
      'link[rel="icon"], link[rel="apple-touch-icon"], link[rel="shortcut icon"]'
    )
    .evaluateAll((links) =>
      links.map((link) => ({
        rel: link.getAttribute("rel"),
        path: new URL((link as HTMLLinkElement).href).pathname,
      }))
    );
  expect(icons).toEqual(
    expect.arrayContaining([
      { rel: "icon", path: "/favicon.ico" },
      { rel: "icon", path: "/icon.svg" },
      { rel: "apple-touch-icon", path: "/apple-icon.png" },
    ])
  );
  expect(icons).toHaveLength(3);
  // Publication metadata replaces appleWebApp defaults; MCP inherits the root.
  await page.goto("/mcp");
  await expect(
    page.locator('link[rel="apple-touch-startup-image"]')
  ).toHaveAttribute("href", "/apple-icon.png");
  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.status()).toBe(200);
  const manifest = await manifestResponse.json();
  await Promise.all(
    manifest.icons.map(async (icon: { src: string }) => {
      expect((await request.get(icon.src)).status()).toBe(200);
    })
  );
  const jsonLd = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  expect(jsonLd.join(" ")).toContain("https://lightfast.ai/icon-512.png");
});

test("preserves generated discovery, route status and canonical metadata", async ({
  page,
  request,
}) => {
  await page.goto("/mcp");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://lightfast.ai/mcp"
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    "https://lightfast.ai/mcp"
  );
  await expect(
    page.getByText(/does not supply a hosted MCP service/)
  ).toBeVisible();
  const sitemap = await request.get("/sitemap.xml");
  const xml = await sitemap.text();
  expect(xml).toContain("https://lightfast.ai/brand");
  expect(xml).not.toContain("2026-03-26-why-we-built-lightfast");
  const llms = await (await request.get("/llms.txt")).text();
  expect(llms).toContain("https://lightfast.ai/brand");
  expect(llms).not.toContain("/pitch-deck");
  expect(llms).not.toContain("/search");
  expect(await (await request.get("/robots.txt")).text()).toContain(
    "Disallow: /"
  );
  await Promise.all(
    [
      ["/company", 308, "/brand"],
      ["/docs/getting-started", 307, "/"],
      ["/legal", 308, "/legal/terms"],
    ].map(async ([path, status, location]) => {
      const response = await request.get(String(path), { maxRedirects: 0 });
      expect(response.status()).toBe(status);
      expect(
        new URL(response.headers().location ?? "", "http://127.0.0.1:4187")
          .pathname
      ).toBe(location);
    })
  );
  expect((await request.get("/sign-in")).status()).toBe(404);
  expect((await request.get("/pitch-deck")).status()).toBe(410);
});

for (const width of [375, 1440]) {
  test(`newsletter validation, pending and recovery at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const section = page.getByRole("region", {
      name: "Sign up to stay updated",
    });
    await expect(page.locator("footer")).toHaveCSS("position", "sticky");
    await expect(page.locator("footer")).toHaveCSS("bottom", "0px");
    const foreground = section.locator("..");
    expect(
      await foreground.evaluate((element) =>
        Number(getComputedStyle(element).zIndex)
      )
    ).toBeGreaterThan(0);
    const artwork = page.locator("[data-halftone-status]");
    await expect(artwork).toHaveCSS("background-color", "rgb(232, 232, 227)");
    const centered = await artwork.evaluate((element) => {
      const overlay = element.lastElementChild;
      if (!overlay) {
        return false;
      }
      const style = getComputedStyle(overlay);
      const box = overlay.getBoundingClientRect();
      const art = element.getBoundingClientRect();
      return (
        style.display === "grid" &&
        style.placeItems === "center" &&
        Math.abs(box.width - art.width) < 1
      );
    });
    expect(centered).toBe(true);
    const email = section.getByRole("textbox", { name: "Email address" });
    await expect(email).toHaveCSS("height", "44px");
    const submit = section.getByRole("button", { name: "Sign up" });
    let posts = 0;
    let release!: () => void;
    let outcome = {
      status: "error",
      message:
        "A local test failure with a long address: reader-with-a-long-address@example.test. Please try again.",
    };
    await page.route("**/*", async (route) => {
      if (route.request().method() !== "POST") {
        return route.fallback();
      }
      posts += 1;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      await route.fulfill({
        status: 200,
        contentType: "text/x-component",
        body: `0:{"a":"$@1","f":"","b":""}\n1:${JSON.stringify(outcome)}\n`,
      });
    });
    await submit.click();
    expect(posts).toBe(0);
    await email.fill("reader@example.test");
    await submit.click();
    expect(posts).toBe(0);
    await section.getByRole("checkbox").check();
    await submit.click();
    await expect(section.locator("form")).toHaveAttribute("aria-busy", "true");
    await expect(email).toBeDisabled();
    await expect(
      section.getByRole("button", { name: "Subscribing" })
    ).toBeDisabled();
    await expect.poll(() => posts).toBe(1);
    const spinner = section.locator('[data-slot="spinner"]');
    await expect(spinner).toHaveCSS("animation-name", "none");
    release();
    await expect(section.getByRole("alert")).toContainText(outcome.message);
    await expect(section.getByRole("alert")).toHaveAttribute(
      "aria-live",
      "assertive"
    );
    expect(
      await section.evaluate(
        (element) => element.scrollWidth <= element.clientWidth
      )
    ).toBe(true);
    await section.getByRole("button", { name: "Try again" }).click();
    await expect(email).toHaveValue("");
    outcome = {
      status: "success",
      message: "You're subscribed. Stay tuned for updates.",
    };
    await email.fill("second@example.test");
    await section.getByRole("checkbox").check();
    await submit.click();
    await expect.poll(() => posts).toBe(2);
    release();
    await expect(section.getByRole("status")).toContainText(
      "You're on the list"
    );
    await expect(section.getByRole("status")).not.toContainText("Stay tuned");
    await section.getByRole("button", { name: "Use another email" }).click();
    await expect(email).toBeEnabled();
    await expect(section.getByRole("checkbox")).not.toBeChecked();
    await expect(
      page
        .getByRole("navigation")
        .getByRole("link", { name: "Home", exact: true })
        .first()
    ).toHaveAttribute("aria-current", "page");
  });
}
