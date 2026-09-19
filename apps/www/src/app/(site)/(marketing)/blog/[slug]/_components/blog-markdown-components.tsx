import { BlogCodeBlock } from "@repo/ui-v2/components/content/blog-code-block";
import { cn } from "@repo/ui-v2/lib/utils";
import type {
  HTMLAttributes,
  ReactNode,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { markdownComponents } from "~/app/_components/mdx-components";
import { parseCodeBlock } from "./parse-code-block";

function BlogPre({ children }: { children?: ReactNode }) {
  const { code, language } = parseCodeBlock(children);
  return <BlogCodeBlock code={code} language={language} />;
}

function BlogTable({
  children,
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="my-4 w-full overflow-hidden rounded-xl bg-muted/80 text-sm">
      <section
        aria-label="Table, scroll horizontally"
        className="overflow-auto outline-none focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:ring-inset"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard-scrollable region, per WAI-ARIA scrollable-region pattern
        tabIndex={0}
      >
        <table
          className={cn("w-full divide-y divide-border/50", className)}
          {...props}
        >
          {children}
        </table>
      </section>
    </div>
  );
}

function BlogThead({
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props}>{children}</thead>;
}

function BlogTbody({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn(
        "divide-y divide-border/50 [&>tr:hover]:bg-accent [&>tr]:transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </tbody>
  );
}

function BlogTr({ children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...props}>{children}</tr>;
}

function BlogTh({
  children,
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-12 bg-background/40 px-4 py-0 text-left align-middle font-medium text-sm",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

function BlogTd({
  children,
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("px-4 py-3 align-top text-sm", className)} {...props}>
      {children}
    </td>
  );
}

export const blogMarkdownComponents = {
  ...markdownComponents,
  pre: BlogPre,
  table: BlogTable,
  thead: BlogThead,
  tbody: BlogTbody,
  tr: BlogTr,
  th: BlogTh,
  td: BlogTd,
};
