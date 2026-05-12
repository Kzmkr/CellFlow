import { PlusIcon, XIcon } from "lucide-react";

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
  return (
    <div className="shrink-0 border-b bg-muted/20 px-2 py-1">
      <div className="flex items-center gap-1 overflow-x-auto">
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
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-md border border-dashed text-muted-foreground hover:bg-muted/60"
          aria-label="Open new tab"
          onClick={onOpenTab}
        >
          <PlusIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
