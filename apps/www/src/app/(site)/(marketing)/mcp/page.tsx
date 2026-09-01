import type { Metadata } from "next";
import { SITE_IDENTITY } from "~/lib/site/identity";
import { marketingLayout } from "../_components/layout-primitives";

export const dynamic = "force-static";

const pageTitle = "@lightfastai/mcp | Lightfast";
const pageDescription =
  "Install and configure Lightfast's local stdio Model Context Protocol server.";
const pageUrl = `${SITE_IDENTITY.baseUrl}/mcp`;

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: pageUrl },
  openGraph: {
    type: "website",
    locale: SITE_IDENTITY.locale,
    url: pageUrl,
    title: pageTitle,
    description: pageDescription,
    siteName: SITE_IDENTITY.name,
    images: [SITE_IDENTITY.defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    site: SITE_IDENTITY.twitterHandle,
    creator: SITE_IDENTITY.twitterHandle,
    title: pageTitle,
    description: pageDescription,
    images: [SITE_IDENTITY.defaultOgImage.url],
  },
};

const links = [
  {
    href: "https://www.npmjs.com/package/@lightfastai/mcp",
    label: "View @lightfastai/mcp on npm",
  },
  {
    href: "https://github.com/lightfastai/lightfast",
    label: "Browse lightfastai/lightfast on GitHub",
  },
  {
    href: "https://modelcontextprotocol.io",
    label: "Read the Model Context Protocol documentation",
  },
] as const;

export default function McpPage() {
  return (
    <main className="bg-background text-foreground">
      <article className={`pb-24 md:pb-32 ${marketingLayout.pageTop}`}>
        <header className="max-w-2xl">
          <p className="font-mono text-muted-foreground text-xs uppercase tracking-widest">
            Model Context Protocol
          </p>
          <h1 className="mt-5 font-medium font-title text-3xl leading-tight tracking-normal lg:text-4xl">
            Use Lightfast through MCP
          </h1>
          <p className="mt-6 text-[17px] leading-7">
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
              @lightfastai/mcp
            </code>{" "}
            is a local stdio MCP server. Install it on the same machine as your
            MCP-compatible client and configure the process there.
          </p>
          <p className="mt-6 text-[17px] leading-7">
            Lightfast does not supply a hosted MCP service, hosted backend, or
            default API URL for this package.
          </p>
        </header>

        <section aria-labelledby="install-heading" className="mt-16 max-w-2xl">
          <h2
            className="font-medium text-2xl leading-8 tracking-normal lg:text-3xl lg:leading-10"
            id="install-heading"
          >
            Install
          </h2>
          <div className="mt-6 overflow-hidden rounded-xs border border-border bg-muted/40">
            <pre className="overflow-x-auto p-5 font-mono text-sm leading-6">
              <code>{`npm install -g @lightfastai/mcp
pnpm add -g @lightfastai/mcp`}</code>
            </pre>
          </div>
        </section>

        <section
          aria-labelledby="configure-heading"
          className="mt-16 max-w-2xl"
        >
          <h2
            className="font-medium text-2xl leading-8 tracking-normal lg:text-3xl lg:leading-10"
            id="configure-heading"
          >
            Configure
          </h2>
          <p className="mt-6 text-[17px] leading-7">
            The server requires both a Lightfast API key and the explicit base
            URL of a compatible Lightfast API. Neither value has a supplied
            default.
          </p>
          <div className="mt-6 overflow-hidden rounded-xs border border-border bg-muted/40">
            <pre className="overflow-x-auto p-5 font-mono text-sm leading-6">
              <code>{`LIGHTFAST_API_KEY=lf_... \\
LIGHTFAST_API_URL=https://api.example.test \\
lightfast-mcp`}</code>
            </pre>
          </div>
        </section>

        <section aria-labelledby="links-heading" className="mt-16 max-w-2xl">
          <h2
            className="font-medium text-2xl leading-8 tracking-normal lg:text-3xl lg:leading-10"
            id="links-heading"
          >
            References
          </h2>
          <ul className="mt-6 space-y-3">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  className="underline decoration-1 underline-offset-4 transition-colors duration-250 hover:text-muted-foreground"
                  href={link.href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </main>
  );
}
