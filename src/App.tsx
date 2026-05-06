import { Routes, Route } from "react-router-dom";
import { useRef, useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { AppMenubar } from "@/components/app-menubar";
import { ActionGrid } from "@/components/action-grid";
import { PropertiesPanel } from "@/components/properties-panel";
import Flow from "@/components/flow";
import LoginPage from "@/pages/login";
import { FlowStoreProvider } from "@/lib/flow-store";
import { NodeAttributeStoreProvider } from "@/lib/node-attribute-store";
import { cn } from "@/lib/utils";

type PanelKey = "nodes" | "properties" | "table";

type TabPanels = {
  nodes: boolean;
  properties: boolean;
  table: boolean;
};

type EditorTab = {
  id: string;
  title: string;
  panels: TabPanels;
};

const DEFAULT_TAB_PANELS: TabPanels = {
  nodes: true,
  properties: true,
  table: true,
};

function createTab(tabNumber: number): EditorTab {
  return {
    id: `tab-${tabNumber}`,
    title: `Tab ${tabNumber}`,
    panels: { ...DEFAULT_TAB_PANELS },
  };
}

function TabWorkspace({ tab, active }: { tab: EditorTab; active: boolean }) {
  const showNodes = tab.panels.nodes;
  const showProperties = tab.panels.properties;
  const showTable = tab.panels.table;
  const bottomVisible = showNodes || showTable;

  return (
    <div
      className={cn(
        "absolute inset-0 transition-opacity",
        active ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!active}
    >
      <FlowStoreProvider>
        <NodeAttributeStoreProvider>
          <ResizablePanelGroup direction="vertical" className="h-full w-full">
            <ResizablePanel defaultSize={70} minSize={3}>
              <ResizablePanelGroup direction="horizontal" className="h-full">
                <ResizablePanel defaultSize={80} minSize={10}>
                  <div className="h-full min-h-0">
                    <Flow />
                  </div>
                </ResizablePanel>

                {showProperties && <ResizableHandle withHandle />}
                {showProperties && (
                  <ResizablePanel minSize={10}>
                    <PropertiesPanel />
                  </ResizablePanel>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>

            {bottomVisible && <ResizableHandle withHandle />}
            {bottomVisible && (
              <ResizablePanel minSize={3}>
                <ResizablePanelGroup direction="horizontal" className="h-full">
                  {showNodes && (
                    <ResizablePanel defaultSize={20} minSize={10}>
                      <ActionGrid />
                    </ResizablePanel>
                  )}

                  {showNodes && showTable && <ResizableHandle withHandle />}

                  {showTable && (
                    <ResizablePanel minSize={10}>
                      <DataTable />
                    </ResizablePanel>
                  )}
                </ResizablePanelGroup>
              </ResizablePanel>
            )}
          </ResizablePanelGroup>
        </NodeAttributeStoreProvider>
      </FlowStoreProvider>
    </div>
  );
}

function EditorLayout() {
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const nextTabNumberRef = useRef(1);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
  const activePanels = activeTab?.panels ?? {
    nodes: false,
    properties: false,
    table: false,
  };

  function openTab() {
    const tab = createTab(nextTabNumberRef.current);
    nextTabNumberRef.current += 1;
    setTabs((currentTabs) => [...currentTabs, tab]);
    setActiveTabId(tab.id);
  }

  function closeTab(tabId: string) {
    setTabs((currentTabs) => {
      const closingIndex = currentTabs.findIndex((tab) => tab.id === tabId);
      if (closingIndex < 0) {
        return currentTabs;
      }

      if (currentTabs.length === 1) {
        setActiveTabId(null);
        return [];
      }

      const nextTabs = currentTabs.filter((tab) => tab.id !== tabId);
      setActiveTabId((currentActiveTabId) => {
        if (currentActiveTabId !== tabId) {
          return currentActiveTabId;
        }

        const fallbackTab =
          nextTabs[closingIndex] ?? nextTabs[closingIndex - 1] ?? nextTabs[0];
        return fallbackTab.id;
      });
      return nextTabs;
    });
  }

  function updateActiveTabPanel(panel: PanelKey, value: boolean) {
    if (!activeTabId) {
      return;
    }

    setTabs((currentTabs) =>
      currentTabs.map((tab) =>
        tab.id === activeTabId
          ? { ...tab, panels: { ...tab.panels, [panel]: value } }
          : tab,
      ),
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppMenubar
        onNewTab={openTab}
        showNodes={activePanels.nodes}
        showProperties={activePanels.properties}
        showTable={activePanels.table}
        onTogglePanel={updateActiveTabPanel}
      />
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
                  onClick={() => setActiveTabId(tab.id)}
                >
                  {tab.title}
                </button>
                <button
                  type="button"
                  className="mr-1 rounded p-1 hover:bg-muted"
                  aria-label={`Close ${tab.title}`}
                  onClick={() => closeTab(tab.id)}
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
            onClick={openTab}
          >
            <PlusIcon className="size-4" />
          </button>
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        {tabs.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <Button onClick={openTab} size="lg">
              <PlusIcon data-icon="inline-start" />
              New Tab
            </Button>
          </div>
        )}
        {tabs.map((tab) => (
          <TabWorkspace
            key={tab.id}
            tab={tab}
            active={tab.id === activeTabId}
          />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<EditorLayout />} />
    </Routes>
  );
}
