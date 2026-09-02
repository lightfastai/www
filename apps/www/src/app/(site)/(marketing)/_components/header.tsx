"use client";

import { Logo } from "@repo/ui-v2/components/brand/logo";
import { cn } from "@repo/ui-v2/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Company from "./company";
import { marketingLayout } from "./layout-primitives";
import {
  isMarketingNavigationLinkCurrent,
  marketingNavigationLinks,
} from "./marketing-navigation";

export function Header() {
  const pathname = usePathname();

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-border/70 border-b bg-background/90 text-foreground backdrop-blur-md supports-[backdrop-filter]:bg-background/75",
        marketingLayout.chromeInset,
        marketingLayout.companyShift
      )}
    >
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex w-full max-w-[96rem] items-center justify-between gap-6"
      >
        <Link
          aria-label="Lightfast home"
          className="shrink-0 rounded-xs text-foreground outline-none transition-colors hover:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
          href="/"
        >
          <Logo size="xs" />
        </Link>

        <div className="flex items-center justify-end gap-4 text-sm leading-none sm:gap-7">
          {marketingNavigationLinks.slice(0, 1).map((link) => (
            <HeaderLink
              current={isMarketingNavigationLinkCurrent(pathname, link.href)}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </HeaderLink>
          ))}
          <Company />
          {marketingNavigationLinks.slice(1).map((link) => (
            <HeaderLink
              current={isMarketingNavigationLinkCurrent(pathname, link.href)}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </HeaderLink>
          ))}
        </div>
      </nav>
    </header>
  );
}

function HeaderLink({
  children,
  current,
  href,
}: {
  children: ReactNode;
  current: boolean;
  href: "/" | "/brand";
}) {
  return (
    <Link
      aria-current={current ? "page" : undefined}
      className={cn(
        "rounded-xs font-normal text-sm leading-none outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30",
        current ? "text-foreground" : "text-muted-foreground"
      )}
      href={href}
    >
      {children}
    </Link>
  );
}
