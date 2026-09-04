import type { ReactNode } from "react";
// import { ContactSection } from "./_components/contact-section";
import { Footer } from "./_components/footer";
import { Header } from "./_components/header";
import {
  MarketingContent,
  marketingLayout,
} from "./_components/layout-primitives";
import { NewsletterSection } from "./_components/newsletter-section";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="group/company isolate min-h-svh overflow-x-clip bg-background"
      id="top"
    >
      <Header />
      <div
        className={`relative z-10 min-h-svh bg-background ${marketingLayout.companyShift}`}
      >
        <MarketingContent>{children}</MarketingContent>
        {/* <ContactSection /> */}
        <NewsletterSection />
      </div>
      <Footer />
    </div>
  );
}
