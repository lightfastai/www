"use client";

import { cn } from "@repo/ui-v2/lib/utils";
import { useEffect, useMemo, useState } from "react";

export interface TocItem {
  depth: 2 | 3;
  id: string;
  title: string;
}

interface TocProps {
  items: readonly TocItem[];
}

function useActiveHeading(itemIds: readonly string[]) {
  const [activeId, setActiveId] = useState(itemIds[0] ?? "");

  useEffect(() => {
    const headings = itemIds
      .map((id) => document.getElementById(id))
      .filter((heading): heading is HTMLElement => heading !== null);

    const firstHeading = headings[0];
    if (!firstHeading) {
      return;
    }

    const updateActiveHeading = () => {
      const offset = 136;
      const currentHeading =
        headings
          .filter((heading) => heading.getBoundingClientRect().top <= offset)
          .at(-1) ?? firstHeading;

      setActiveId(currentHeading.id);
    };

    updateActiveHeading();
    window.addEventListener("scroll", updateActiveHeading, { passive: true });
    window.addEventListener("resize", updateActiveHeading);

    return () => {
      window.removeEventListener("scroll", updateActiveHeading);
      window.removeEventListener("resize", updateActiveHeading);
    };
  }, [itemIds]);

  return activeId;
}

function TocList({
  activeId,
  items,
}: {
  activeId: string;
  items: readonly TocItem[];
}) {
  return (
    <ol>
      {items.map((item) => {
        const isActive = item.id === activeId;

        return (
          <li key={item.id}>
            <a
              aria-current={isActive ? "location" : undefined}
              className={cn(
                "relative block rounded-xs py-2 pr-3 text-muted-foreground text-sm leading-6 outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30",
                item.depth === 3 ? "pl-8" : "pl-6",
                isActive && "text-foreground"
              )}
              href={`#${item.id}`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-4 left-0 size-1.5 rounded-full bg-foreground"
                />
              )}
              <span className="relative">{item.title}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

export function Toc({ items }: TocProps) {
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const activeId = useActiveHeading(itemIds);

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <div className="absolute inset-y-0 right-full mr-8 hidden w-44 xl:block 2xl:w-52">
        <nav
          aria-label="On this page"
          className="sticky top-28 max-h-[calc(100svh-8rem)] overflow-y-auto pb-4"
        >
          <p className="mb-3 font-medium text-foreground text-sm">
            On this page
          </p>
          <TocList activeId={activeId} items={items} />
        </nav>
      </div>

      <details className="group mb-10 border-border border-y xl:hidden">
        <summary className="cursor-pointer select-none rounded-xs py-4 font-medium text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/30">
          On this page
        </summary>
        <nav aria-label="On this page" className="pb-4">
          <TocList activeId={activeId} items={items} />
        </nav>
      </details>
    </>
  );
}
