import { ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logo } from "@repo/ui-v2/components/brand/logo";
import Link from "next/link";
import type { ReactNode } from "react";
import { SITE_IDENTITY } from "~/lib/site/identity";
import { marketingLayout } from "./layout-primitives";
import { Newsletter } from "./newsletter";

const exploreLinks = [
  { href: "/", label: "Home" },
  { href: "/brand", label: "Brand Guidelines" },
  { href: "/blog", label: "Blog" },
  { href: "/mcp", label: "MCP" },
] as const;

const legalLinks = [
  { href: "/legal/terms", label: "Terms of Use" },
  { href: "/legal/privacy", label: "Privacy Policy" },
] as const;

export function Footer() {
  return (
    <footer className="mt-24 border-border border-t bg-background text-foreground md:mt-32">
      <div
        className={`mx-auto w-full max-w-[96rem] py-12 sm:py-16 lg:py-20 ${marketingLayout.edgeX}`}
      >
        <div className="grid gap-14 border-border border-b pb-14 sm:pb-16 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)] lg:gap-20 lg:pb-20">
          <div className="max-w-2xl">
            <Logo className="text-foreground" size="md" />
            <p className="mt-8 text-balance font-medium text-2xl leading-tight tracking-normal sm:text-3xl lg:text-4xl">
              {SITE_IDENTITY.description}
            </p>
          </div>

          <FooterColumn label="Newsletter">
            <p className="max-w-md text-base leading-snug">
              Subscribe to research notes and project updates.
            </p>
            <Newsletter />
          </FooterColumn>
        </div>

        <div className="grid gap-12 border-border border-b py-12 sm:grid-cols-2 sm:py-14 lg:grid-cols-[1.4fr_0.8fr_0.8fr] lg:gap-20">
          <FooterColumn label="Social">
            <nav aria-label="Social links" className="grid gap-2">
              {SITE_IDENTITY.socialLinks.map((link) => (
                <FooterAnchor external href={link.url} key={link.url}>
                  {link.label}
                </FooterAnchor>
              ))}
              <FooterAnchor href={`mailto:${SITE_IDENTITY.contact.email}`}>
                Contact
              </FooterAnchor>
            </nav>
          </FooterColumn>

          <FooterColumn label="Explore">
            <nav aria-label="Footer navigation" className="grid gap-2">
              {exploreLinks.map((link) => (
                <FooterLink href={link.href} key={link.href}>
                  {link.label}
                </FooterLink>
              ))}
            </nav>
          </FooterColumn>

          <FooterColumn
            className="sm:col-start-2 lg:col-start-auto"
            label="Legal"
          >
            <nav aria-label="Legal links" className="grid gap-2">
              {legalLinks.map((link) => (
                <FooterLink href={link.href} key={link.href}>
                  {link.label}
                </FooterLink>
              ))}
            </nav>
          </FooterColumn>
        </div>

        <div className="flex flex-col gap-5 pt-7 text-muted-foreground text-xs leading-tight sm:flex-row sm:items-center sm:justify-between">
          <p>©2026 {SITE_IDENTITY.name}</p>
          <a
            className="inline-flex w-fit items-center gap-1.5 rounded-xs text-foreground outline-none transition-colors hover:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
            href="#top"
          >
            <span>To top</span>
            <HugeiconsIcon
              aria-hidden="true"
              className="size-4"
              icon={ArrowUp01Icon}
              strokeWidth={2}
            />
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <section className={className}>
      <h2 className="mb-5 font-mono text-[11px] text-muted-foreground uppercase leading-none tracking-[0.16em]">
        {label}
      </h2>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

function FooterLink({
  children,
  href,
}: {
  children: ReactNode;
  href:
    | (typeof exploreLinks)[number]["href"]
    | (typeof legalLinks)[number]["href"];
}) {
  return (
    <Link
      className="w-fit rounded-xs text-sm leading-6 outline-none transition-colors hover:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
      href={href}
    >
      {children}
    </Link>
  );
}

function FooterAnchor({
  children,
  external = false,
  href,
}: {
  children: ReactNode;
  external?: boolean;
  href: string;
}) {
  return (
    <a
      className="w-fit rounded-xs text-sm leading-6 outline-none transition-colors hover:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
      href={href}
      rel={external ? "noopener noreferrer" : undefined}
      target={external ? "_blank" : undefined}
    >
      {children}
    </a>
  );
}
