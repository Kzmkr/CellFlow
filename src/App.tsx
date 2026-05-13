import { Routes, Route } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { PlusIcon } from "lucide-react";

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { AppMenubar } from "@/components/app-menubar";
import { EditorTabBar } from "@/components/editor-tab-bar";
import { ActionGrid } from "@/components/action-grid";
import { PropertiesPanel } from "@/components/properties-panel";
import Flow from "@/components/flow";
import { useUndoRedo } from "@/components/node-handler";
import LoginPage from "@/pages/login";
import { FlowStoreProvider, useFlowStore } from "@/lib/flow-store";
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

function UndoRedoBridge({
  active,
  onRegister,
}: {
  active: boolean;
  onRegister: (handlers: { undo: () => void; redo: () => void }) => void;
}) {
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const isDragging = useFlowStore((state) => state.isDragging);
  const setNodes = useFlowStore((state) => state.setNodes);
  const setEdges = useFlowStore((state) => state.setEdges);
  const setOnSnapshot = useFlowStore((state) => state.setOnSnapshot);
  const { undo, redo, takeSnapshot } = useUndoRedo(nodes, edges, setNodes, setEdges);

  useEffect(() => {
    setOnSnapshot(active ? takeSnapshot : undefined);
  }, [active, setOnSnapshot, takeSnapshot]);

  useEffect(() => {
    if (!active || isDragging) return;
    console.log("UndoRedoBridge register", { active, nodes, edges });
    onRegister({
      undo: () => {
        undo();
        console.log("undo called");
      },
      redo: () => {
        redo();
        console.log("redo called");
      },
    });
  }, [active, undo, redo, onRegister, nodes, edges, isDragging]);

  return null;
}

function TabWorkspace({
  tab,
  active,
  onRegisterUndoRedo,
}: {
  tab: EditorTab;
  active: boolean;
  onRegisterUndoRedo: (handlers: { undo: () => void; redo: () => void }) => void;
}) {
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
        <UndoRedoBridge active={active} onRegister={onRegisterUndoRedo} />
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

  const [activeUndoRedo, setActiveUndoRedo] = useState<{
    undo: () => void;
    redo: () => void;
  }>({
    undo: () => {},
    redo: () => {},
  });

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
  const activePanels = activeTab?.panels ?? {
    nodes: false,
    properties: false,
    table: false,
  };

  function openTab() {
    console.log("App openTab called");
    const tab = createTab(nextTabNumberRef.current);
    nextTabNumberRef.current += 1;
    setTabs((currentTabs) => [...currentTabs, tab]);
    setActiveTabId(tab.id);
  }

  function closeTab(tabId: string) {
    console.log("App closeTab called", tabId);
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
    console.log("App updateActiveTabPanel called", panel, value);
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
        onUndo={activeUndoRedo.undo}
        onRedo={activeUndoRedo.redo}
        showNodes={activePanels.nodes}
        showProperties={activePanels.properties}
        showTable={activePanels.table}
        onTogglePanel={updateActiveTabPanel}
      />
      <EditorTabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onCloseTab={closeTab}
        onOpenTab={openTab}
      />
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
            onRegisterUndoRedo={setActiveUndoRedo}
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
