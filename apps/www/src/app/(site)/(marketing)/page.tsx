import { JsonLd } from "@vendor/seo/json-ld";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { markdownComponents } from "~/app/_components/mdx-components";
import { getHomePublication } from "~/lib/publishing";
import { HalftoneHero } from "./_components/halftone-hero";
import {
  MarketingContentBleed,
  marketingLayout,
} from "./_components/layout-primitives";

export const dynamic = "force-static";

export function generateMetadata(): Metadata {
  return getHomePublication()?.metadata ?? {};
}

export default function HomePage() {
  const publication = getHomePublication();
  if (!publication) {
    notFound();
  }

  const MDXContent = publication.body;

  return (
    <main className="bg-background text-foreground">
      <JsonLd code={publication.jsonLd} />

      <section className={`pb-16 lg:pb-28 ${marketingLayout.pageTop}`}>
        <h1 className="sr-only">{publication.title}</h1>
        <MarketingContentBleed className="aspect-video overflow-hidden rounded-xs bg-muted">
          <HalftoneHero />
        </MarketingContentBleed>
      </section>

      <article className="pb-24 md:pb-32">
        <MDXContent components={markdownComponents} />
      </article>
    </main>
  );
}
