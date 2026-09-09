import { ArrowRight01Icon, Refresh03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Checkbox } from "@repo/ui-v2/components/ui/checkbox";
import { marketingLayout } from "./layout-primitives";
import { NewsletterForm, NewsletterSubmitButton } from "./newsletter-form";

export function NewsletterSection() {
  return (
    <section
      aria-labelledby="newsletter-heading"
      className={`mx-auto w-full max-w-[96rem] bg-background pt-8 pb-32 text-foreground sm:pt-10 sm:pb-40 lg:pt-12 lg:pb-48 ${marketingLayout.edgeX}`}
    >
      <div className="mx-auto max-w-5xl text-center">
        <h2
          className="text-balance font-medium text-xl leading-tight tracking-normal sm:text-2xl lg:text-3xl"
          id="newsletter-heading"
        >
          Sign up to stay updated
        </h2>
        <p className="mt-4 text-pretty text-sm leading-relaxed sm:mt-5 sm:text-base">
          Join our email list for the latest updates on our work.
        </p>

        <div className="mx-auto mt-7 max-w-xl sm:mt-8">
          <NewsletterForm
            resetIcon={
              <HugeiconsIcon
                aria-hidden="true"
                className="size-5"
                icon={Refresh03Icon}
                strokeWidth={2}
              />
            }
            statusId="newsletter-status"
            variant="section"
          >
            <div className="w-full">
              <div className="relative flex items-center">
                <label className="sr-only" htmlFor="newsletter-email">
                  Email address
                </label>
                <input
                  aria-describedby="newsletter-consent-copy"
                  autoComplete="email"
                  className="m-0 h-11 w-full border border-border user-invalid:border-destructive bg-muted px-4 pr-32 text-sm outline-none user-invalid:ring-3 user-invalid:ring-destructive/20 transition-[border-color,box-shadow] placeholder:text-muted-foreground hover:border-muted-foreground/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-70"
                  id="newsletter-email"
                  maxLength={256}
                  name="email"
                  placeholder="Email"
                  required
                  type="email"
                />
                <NewsletterSubmitButton
                  className="px-4 text-sm"
                  label="Sign up"
                >
                  <HugeiconsIcon
                    aria-hidden="true"
                    className="size-3.5"
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                  />
                </NewsletterSubmitButton>
              </div>

              <label
                className="mt-5 flex cursor-pointer items-start gap-3 text-left text-muted-foreground text-xs leading-relaxed sm:mt-6 sm:text-sm"
                htmlFor="newsletter-consent"
                id="newsletter-consent-copy"
              >
                <Checkbox
                  className="mt-0.5 border-border bg-input data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground"
                  id="newsletter-consent"
                  name="consent"
                  required
                />
                <span>
                  I would like to receive updates from Lightfast about its
                  research, projects, and announcements.
                </span>
              </label>
            </div>
          </NewsletterForm>
        </div>
      </div>
    </section>
  );
}
