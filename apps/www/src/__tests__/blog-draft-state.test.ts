import type { MDXContent } from "mdx/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BlogPostData } from "../lib/publishing/schemas";
import { BlogPostSchema } from "../lib/publishing/schemas";

const environment = vi.hoisted(() => ({
  NODE_ENV: "test",
  VERCEL_ENV: undefined as string | undefined,
  NEXT_PUBLIC_VERCEL_ENV: "development",
}));
vi.mock("~/env", () => ({ env: environment }));

interface BlogDocument {
  data: BlogPostData & { body: MDXContent };
  slugs: string[];
}

const fixtures = vi.hoisted(() => ({ blog: [] as BlogDocument[] }));

vi.mock("../lib/publishing/source", () => ({
  getBlogDocument: (slug: string) =>
    fixtures.blog.find((document) => document.slugs[0] === slug),
  getBlogDocuments: () => fixtures.blog,
  getBrandDocument: () => undefined,
  getHomeDocument: () => undefined,
  getLegalDocument: () => undefined,
  getLegalDocuments: () => [],
}));

const {
  getBlogIndexPublication,
  getBlogPostPublication,
  getBlogPostPublications,
  getBlogPostStaticParams,
  getPublicPublications,
} = await import("../lib/publishing/publications");

function makeBlogData(
  overrides: Partial<BlogPostData> = {}
): BlogPostData & { body: MDXContent } {
  return {
    title: "Test post",
    description: "A".repeat(50),
    keywords: ["one", "two", "three"],
    ogTitle: "Test post",
    ogDescription: "A".repeat(50),
    noindex: false,
    nofollow: false,
    aeo: {
      targetPrompts: [],
      fanoutQueries: [],
      entities: [],
      citationTargets: [],
    },
    authors: [
      {
        name: "Jeevan Pillay",
        url: "https://lightfast.ai",
        twitterHandle: "@lightfastai",
      },
    ],
    publishedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    faq: [{ question: "Q".repeat(10), answer: "A".repeat(20) }],
    category: "engineering",
    readingTimeMinutes: 3,
    featured: false,
    tldr: "T".repeat(20),
    toc: [],
    draft: false,
    body: (() => null) as unknown as MDXContent,
    ...overrides,
  };
}

const draftDocument: BlogDocument = {
  slugs: ["draft-post"],
  data: makeBlogData({ draft: true, title: "Draft post" }),
};

const publishedDocument: BlogDocument = {
  slugs: ["published-post"],
  data: makeBlogData({ draft: false, title: "Published post" }),
};

function setEnvironment(vars: {
  NODE_ENV: string;
  VERCEL_ENV: string | undefined;
  NEXT_PUBLIC_VERCEL_ENV: string | undefined;
}) {
  environment.NODE_ENV = vars.NODE_ENV;
  environment.VERCEL_ENV = vars.VERCEL_ENV;
  environment.NEXT_PUBLIC_VERCEL_ENV = vars.NEXT_PUBLIC_VERCEL_ENV as string;
}

beforeEach(() => {
  setEnvironment({
    NODE_ENV: "test",
    VERCEL_ENV: undefined,
    NEXT_PUBLIC_VERCEL_ENV: "development",
  });
  fixtures.blog = [draftDocument, publishedDocument];
});

describe("BlogPostSchema draft default", () => {
  it("defaults draft to false when omitted", () => {
    const parsed = BlogPostSchema.parse({
      ...makeBlogData(),
      draft: undefined,
    });
    expect(parsed.draft).toBe(false);
  });
});

interface EnvironmentCase {
  draftVisible: boolean;
  name: string;
  vars: {
    NODE_ENV: string;
    VERCEL_ENV: string | undefined;
    NEXT_PUBLIC_VERCEL_ENV: string | undefined;
  };
}

const environmentCases: EnvironmentCase[] = [
  {
    name: "explicit Vercel preview (VERCEL_ENV=preview, NEXT_PUBLIC_VERCEL_ENV=preview)",
    vars: {
      NODE_ENV: "production",
      VERCEL_ENV: "preview",
      NEXT_PUBLIC_VERCEL_ENV: "preview",
    },
    draftVisible: true,
  },
  {
    name: "production/production",
    vars: {
      NODE_ENV: "production",
      VERCEL_ENV: "production",
      NEXT_PUBLIC_VERCEL_ENV: "production",
    },
    draftVisible: false,
  },
  {
    name: "undefined/undefined with NODE_ENV production (production build without Vercel vars)",
    vars: {
      NODE_ENV: "production",
      VERCEL_ENV: undefined,
      NEXT_PUBLIC_VERCEL_ENV: undefined,
    },
    draftVisible: false,
  },
  {
    name: "VERCEL_ENV undefined, NEXT_PUBLIC_VERCEL_ENV defaulted to development, NODE_ENV production (the exact failing case)",
    vars: {
      NODE_ENV: "production",
      VERCEL_ENV: undefined,
      NEXT_PUBLIC_VERCEL_ENV: "development",
    },
    draftVisible: false,
  },
  {
    name: "inconsistent: VERCEL_ENV=preview, NEXT_PUBLIC_VERCEL_ENV=development",
    vars: {
      NODE_ENV: "production",
      VERCEL_ENV: "preview",
      NEXT_PUBLIC_VERCEL_ENV: "development",
    },
    draftVisible: false,
  },
  {
    name: "inconsistent: VERCEL_ENV=production, NEXT_PUBLIC_VERCEL_ENV=preview",
    vars: {
      NODE_ENV: "production",
      VERCEL_ENV: "production",
      NEXT_PUBLIC_VERCEL_ENV: "preview",
    },
    draftVisible: false,
  },
  {
    name: "local development (NODE_ENV=development, no Vercel vars)",
    vars: {
      NODE_ENV: "development",
      VERCEL_ENV: undefined,
      NEXT_PUBLIC_VERCEL_ENV: undefined,
    },
    draftVisible: true,
  },
];

describe.each(environmentCases)(
  "environment: $name",
  ({ vars, draftVisible }) => {
    beforeEach(() => {
      setEnvironment(vars);
    });

    if (draftVisible) {
      it("renders the draft by direct URL, includes it in static params, but keeps it non-public", () => {
        const publication = getBlogPostPublication("draft-post");
        expect(publication).toBeDefined();
        expect(publication?.isPublic).toBe(false);
        expect(publication?.metadata.robots).toMatchObject({ index: false });

        const params = getBlogPostStaticParams();
        expect(params).toEqual(
          expect.arrayContaining([{ slug: "draft-post" }])
        );
      });
    } else {
      it("hides the draft from static params, direct lookup, the list, and the index", () => {
        expect(getBlogPostPublication("draft-post")).toBeUndefined();
        expect(getBlogPostStaticParams()).toEqual([{ slug: "published-post" }]);
        expect(getBlogPostPublications().map((post) => post.slug)).toEqual([
          "published-post",
        ]);
        expect(
          getBlogIndexPublication().posts.map((post) => post.slug)
        ).toEqual(["published-post"]);
      });
    }

    it("never surfaces the draft in the blog index or public publications", () => {
      expect(
        getBlogIndexPublication().posts.map((post) => post.slug)
      ).not.toContain("draft-post");

      const publicSlugs = getPublicPublications()
        .filter((pub) => pub.kind === "blog-post")
        .map((pub) => (pub as { slug: string }).slug);
      expect(publicSlugs).not.toContain("draft-post");
    });

    it("leaves the non-draft post fully public", () => {
      const publication = getBlogPostPublication("published-post");
      expect(publication).toBeDefined();
      expect(publication?.isPublic).toBe(true);
      expect(publication?.metadata.robots).toMatchObject({ index: true });

      const index = getBlogIndexPublication();
      expect(index.posts.map((post) => post.slug)).toContain("published-post");
    });
  }
);
