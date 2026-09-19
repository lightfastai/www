import { JsonLd } from "@vendor/seo/json-ld";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getBlogPostPublication,
  getBlogPostStaticParams,
} from "~/lib/publishing";
import {
  MarketingContentBleed,
  marketingLayout,
} from "../../_components/layout-primitives";
import { blogMarkdownComponents } from "./_components/blog-markdown-components";
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

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const publication = getBlogPostPublication(slug);
  if (!publication) {
    notFound();
  }

  const MDXContent = publication.body;
  const { answerSummary, description, featuredImage, tldr, title, toc } =
    publication;

  return (
    <main className="bg-background text-foreground">
      <JsonLd code={publication.jsonLd} />

      <section
        className={`flex flex-col items-center pb-16 text-center ${marketingLayout.pageTop}`}
      >
        <h1 className="font-medium font-title text-3xl text-foreground tracking-normal lg:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-10 max-w-2xl text-[17px] text-muted-foreground leading-7 tracking-normal">
            {description}
          </p>
        )}
      </section>

      {featuredImage && (
        <section>
          <MarketingContentBleed className="aspect-video overflow-hidden rounded-xs bg-foreground">
            <Image
              alt={title}
              className="object-cover"
              fill
              preload
              quality={40}
              sizes="(max-width: 640px) calc(100vw - 3rem), (max-width: 1024px) calc(100vw - 5rem), 48rem"
              src={featuredImage}
            />
          </MarketingContentBleed>
        </section>
      )}

      <section className="py-16 md:py-24">
        <div className={marketingLayout.articleBleed}>
          {tldr && (
            <div className="mx-auto mb-14 max-w-[42rem] border-border border-l pl-5">
              <h2 className="font-medium text-foreground text-sm">TL;DR</h2>
              <p className="mt-3 text-muted-foreground text-sm leading-6">
                {tldr}
              </p>
            </div>
          )}

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
              <MDXContent components={blogMarkdownComponents} />
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
