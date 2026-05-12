import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import type { WheelEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EditorTabBarItem = {
  id: string;
  title: string;
};

type EditorTabBarProps = {
  tabs: EditorTabBarItem[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onOpenTab: () => void;
};

export function EditorTabBar({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onOpenTab,
}: EditorTabBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (!scrollContainerRef.current) {
      return;
    }

    function updateScrollState() {
      const container = scrollContainerRef.current;
      if (!container) {
        return;
      }

      const nextHasOverflow = container.scrollWidth > container.clientWidth + 1;
      setHasOverflow(nextHasOverflow);
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft + container.clientWidth <
          container.scrollWidth - 1,
      );
    }

    updateScrollState();
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    container.addEventListener("scroll", updateScrollState);

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [tabs.length]);

  useEffect(() => {
    if (!activeTabId) {
      return;
    }

    const activeTabElement =
      scrollContainerRef.current?.querySelector<HTMLElement>(
        `[data-tab-id="${activeTabId}"]`,
      );
    activeTabElement?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [activeTabId]);

  function scrollTabs(direction: "left" | "right") {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const amount = Math.max(container.clientWidth * 0.6, 180);
    const offset = direction == "left" ? -amount : amount;
    container.scrollBy({ left: offset, behavior: "smooth" });
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    const container = scrollContainerRef.current;
    if (!container || !hasOverflow) {
      return;
    }

    const delta =
      Math.abs(event.deltaY) > Math.abs(event.deltaX)
        ? event.deltaY
        : event.deltaX;
    if (delta == 0) {
      return;
    }

    event.preventDefault();
    container.scrollBy({ left: delta });
  }

  return (
    <div className="shrink-0 border-b bg-muted/20 px-2 py-1">
      <div className="flex items-center gap-1">
        {hasOverflow && (
          <Button
            variant="outline"
            size="icon"
            className="size-8 shrink-0"
            aria-label="Scroll tabs left"
            disabled={!canScrollLeft}
            onClick={() => scrollTabs("left")}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
        )}

        <div
          ref={scrollContainerRef}
          className="tabbar-scroll-area min-w-0 flex-1 overflow-x-auto overflow-y-hidden pb-1"
          onWheel={handleWheel}
        >
          <div className="flex w-max items-center gap-1 pr-1">
            {tabs.length === 0 && (
              <div className="flex h-8 items-center rounded-md border border-dashed px-3 text-sm text-muted-foreground">
                Empty
              </div>
            )}
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;

              return (
                <div
                  key={tab.id}
                  data-tab-id={tab.id}
                  className={cn(
                    "flex h-8 items-center rounded-md border text-sm",
                    isActive
                      ? "border-border bg-background text-foreground"
                      : "border-transparent bg-transparent text-muted-foreground hover:bg-muted/60",
                  )}
                >
                  <button
                    type="button"
                    className="px-3 text-left"
                    onClick={() => onSelectTab(tab.id)}
                  >
                    {tab.title}
                  </button>
                  <button
                    type="button"
                    className="mr-1 rounded p-1 hover:bg-muted"
                    aria-label={`Close ${tab.title}`}
                    onClick={() => onCloseTab(tab.id)}
                  >
                    <XIcon className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {hasOverflow && (
          <Button
            variant="outline"
            size="icon"
            className="size-8 shrink-0"
            aria-label="Scroll tabs right"
            disabled={!canScrollRight}
            onClick={() => scrollTabs("right")}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        )}

        <button
          type="button"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-dashed text-muted-foreground hover:bg-muted/60"
          aria-label="Open new tab"
          onClick={onOpenTab}
        >
          <PlusIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
