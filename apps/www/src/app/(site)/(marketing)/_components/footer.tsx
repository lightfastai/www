import { Logo } from "@repo/ui-v2/components/brand/logo";
import Link from "next/link";
import { marketingLayout } from "./layout-primitives";

const legalLinks = [
  { href: "/legal/terms", label: "Terms of Use" },
  { href: "/legal/privacy", label: "Privacy Policy" },
] as const;

export function Footer() {
  return (
    <footer
      className={`sticky bottom-0 z-0 bg-black text-foreground ${marketingLayout.companyShift}`}
    >
      <div className="mx-auto flex min-h-80 w-full max-w-[96rem] flex-col justify-between gap-20 px-6 py-8 sm:min-h-96 md:px-8 lg:min-h-[28rem]">
        <div className="flex flex-col gap-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026</p>
          <nav
            aria-label="Legal links"
            className="flex flex-wrap items-center gap-x-8 gap-y-3"
          >
            {legalLinks.map((link) => (
              <Link
                className="rounded-xs outline-none transition-colors hover:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <Logo className="text-foreground" size="sm" />
      </div>
    </footer>
  );
}
