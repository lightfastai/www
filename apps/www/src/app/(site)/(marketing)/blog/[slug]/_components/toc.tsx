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

/** Maps every heading id (h2 or h3) to the id of its nearest preceding h2. */
function buildParentSectionMap(
  items: readonly TocItem[]
): Record<string, string> {
  const map: Record<string, string> = {};
  let currentSectionId = "";

  for (const item of items) {
    if (item.depth === 2) {
      currentSectionId = item.id;
    }
    map[item.id] = currentSectionId;
  }

  return map;
}

function TocList({
  activeSectionId,
  sections,
}: {
  activeSectionId: string;
  sections: readonly TocItem[];
}) {
  return (
    <ol>
      {sections.map((item) => {
        const isActive = item.id === activeSectionId;

        return (
          <li key={item.id}>
            <a
              aria-current={isActive ? "location" : undefined}
              className={cn(
                "block rounded-xs py-1.5 text-sm leading-6 outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
              href={`#${item.id}`}
            >
              {item.title}
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
  const sections = useMemo(
    () => items.filter((item) => item.depth === 2),
    [items]
  );
  const parentSectionMap = useMemo(() => buildParentSectionMap(items), [items]);
  const activeSectionId = parentSectionMap[activeId] ?? "";

  if (sections.length === 0) {
    return null;
  }

  return (
    <>
      <div className="absolute inset-y-0 right-full mr-16 hidden w-60 min-[88rem]:block">
        <nav
          aria-label="Table of contents"
          className="sticky top-28 max-h-[calc(100svh-8rem)] overflow-y-auto pb-4"
        >
          <TocList activeSectionId={activeSectionId} sections={sections} />
        </nav>
      </div>

      <details className="group mb-10 border-border border-y min-[88rem]:hidden">
        <summary className="cursor-pointer select-none rounded-xs py-4 font-medium text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/30">
          Contents
        </summary>
        <nav aria-label="Table of contents" className="pb-4">
          <TocList activeSectionId={activeSectionId} sections={sections} />
        </nav>
      </details>
    </>
  );
}
