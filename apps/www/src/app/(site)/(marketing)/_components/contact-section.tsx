import { SITE_IDENTITY } from "~/lib/site/identity";
import { HalftoneHero } from "./halftone-hero";
import { marketingLayout } from "./layout-primitives";

export function ContactSection() {
  return (
    <section
      aria-labelledby="contact-heading"
      className={`mx-auto mt-24 w-full max-w-[96rem] md:mt-32 ${marketingLayout.edgeX}`}
    >
      <div className="rounded-xs bg-black p-4 sm:p-6 lg:grid lg:min-h-[34rem] lg:grid-cols-[minmax(18rem,0.52fr)_minmax(0,1fr)]">
        <div className="flex flex-col justify-center px-2 py-8 sm:px-3 sm:py-10 lg:px-4 lg:py-8 xl:py-10">
          <h2
            className="max-w-[26ch] text-balance font-medium text-base leading-snug tracking-normal sm:text-lg lg:text-xl"
            id="contact-heading"
          >
            Lightfast is an applied research lab focused on building
            consequential physical technologies.
          </h2>
          {/* Newsletter is paused while direct contact is the primary CTA. */}
          <a
            className="mt-6 inline-flex w-fit items-center gap-2 rounded-xs text-sm leading-6 outline-none transition-colors hover:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
            href={`mailto:${SITE_IDENTITY.contact.email}`}
          >
            <span>Contact Us</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <div
          aria-hidden="true"
          className="aspect-video min-h-64 overflow-hidden rounded-xs lg:aspect-auto lg:min-h-[31rem]"
        >
          <HalftoneHero />
        </div>
      </div>
    </section>
  );
}
