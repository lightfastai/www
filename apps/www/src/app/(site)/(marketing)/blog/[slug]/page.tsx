import { JsonLd } from "@vendor/seo/json-ld";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { markdownComponents } from "~/app/_components/mdx-components";
import {
  getBlogPostPublication,
  getBlogPostStaticParams,
} from "~/lib/publishing";
import { marketingLayout } from "../../_components/layout-primitives";
import { Toc } from "./_components/toc";

export const dynamic = "force-static";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getBlogPostStaticParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return getBlogPostPublication(slug)?.metadata ?? {};
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const publication = getBlogPostPublication(slug);
  if (!publication) {
    notFound();
  }

  const MDXContent = publication.body;
  const {
    answerSummary,
    categoryLabel,
    description,
    featuredImage,
    publishedAt,
    readingTimeMinutes,
    tldr,
    title,
    toc,
  } = publication;

  const metaLine = [
    dateFormatter.format(new Date(publishedAt)),
    categoryLabel,
    `${readingTimeMinutes} min read`,
  ].join(" · ");

  return (
    <main className="bg-background text-foreground">
      <JsonLd code={publication.jsonLd} />

      <section className={`pb-12 md:pb-16 ${marketingLayout.pageTop}`}>
        <div className={marketingLayout.articleBleed}>
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center space-y-6 text-center">
            <p className="font-mono text-muted-foreground text-xs uppercase tracking-widest">
              {metaLine}
            </p>
            <h1 className="font-medium font-title text-4xl text-foreground tracking-normal lg:text-5xl">
              {title}
            </h1>
            {description && (
              <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {featuredImage && (
            <div className="mt-14 w-full">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-card">
                <Image
                  alt={title}
                  className="h-full w-full object-cover"
                  fetchPriority="high"
                  fill
                  preload
                  quality={40}
                  sizes="(max-width: 640px) calc(100vw - 3rem), (max-width: 1024px) calc(100vw - 5rem), 1440px"
                  src={featuredImage}
                />
              </div>
            </div>
          )}

          {tldr && (
            <div className="mx-auto mt-14 max-w-[42rem] border-border border-l pl-5">
              <h2 className="font-medium text-foreground text-sm">TL;DR</h2>
              <p className="mt-3 text-muted-foreground text-sm leading-6">
                {tldr}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="pt-12 pb-24 md:pb-32">
        <div className={marketingLayout.articleBleed}>
          <div className="relative mx-auto w-full max-w-[42rem]">
            <Toc items={toc} />

            <article className="max-w-none">
              {answerSummary ? (
                <aside className="mb-10 border-border border-l pl-5">
                  <h2 className="font-medium text-foreground text-sm">
                    Quick answer
                  </h2>
                  <p className="mt-3 text-muted-foreground text-sm leading-6">
                    {answerSummary}
                  </p>
                </aside>
              ) : null}
              <MDXContent components={markdownComponents} />
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
