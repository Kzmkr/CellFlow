import { Routes, Route } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { PlayIcon, PlusIcon, SnowflakeIcon } from "lucide-react";

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { ChartView, type ChartSettings } from "@/components/chart-view";
import { AppMenubar } from "@/components/app-menubar";
import { EditorTabBar } from "@/components/editor-tab-bar";
import { ActionGrid } from "@/components/action-grid";
import { PropertiesPanel } from "@/components/properties-panel";
import Flow from "@/components/flow";
import { useUndoRedo } from "@/components/node-handler";
import { SaveWorkflowDialog } from "@/components/save-workflow-dialog";
import { OpenWorkflowDialog } from "@/components/open-workflow-dialog";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import { FlowStoreProvider, useFlowStore } from "@/lib/flow-store";
import {
  copySelectedNode,
  cutSelectedNode,
  pasteNodeFromClipboard,
  type NodeClipboard,
} from "../lib/node-clipboard";
import { NodeAttributeStoreProvider, useNodeAttributeStore } from "@/lib/node-attribute-store";
import { runPipeline, type PipelineResult } from "@/lib/pipeline-engine";
import { getWorkflow } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Toaster, toast } from "sonner";

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
  workflowId?: string;
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
  const applySnapshot = useFlowStore((state) => state.applySnapshot);
  const setOnSnapshot = useFlowStore((state) => state.setOnSnapshot);
  const { undo, redo, takeSnapshot } = useUndoRedo(
    nodes,
    edges,
    setNodes,
    setEdges,
    applySnapshot,
  );

  useEffect(() => {
    setOnSnapshot(active ? takeSnapshot : undefined);
  }, [active, setOnSnapshot, takeSnapshot]);

  useEffect(() => {
    if (!active || isDragging) return;
    onRegister({
      undo,
      redo,
    });
  }, [active, undo, redo, onRegister, nodes, edges, isDragging]);

  return null;
}

function ClipboardBridge({
  active,
  onRegister,
}: {
  active: boolean;
  onRegister: (handlers: {
    copy: () => void;
    cut: () => void;
    paste: () => void;
  }) => void;
}) {
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const selectedNodeId = useFlowStore((state) => state.selectedNodeId);
  const setNodes = useFlowStore((state) => state.setNodes);
  const setEdges = useFlowStore((state) => state.setEdges);
  const clipboardRef = useRef<NodeClipboard | null>(null);

  const copy = useCallback(() => {
    const clipboard = copySelectedNode(selectedNodeId, nodes);
    if (clipboard) {
      clipboardRef.current = clipboard;
    }
  }, [nodes, selectedNodeId]);

  const cut = useCallback(() => {
    const result = cutSelectedNode(selectedNodeId, nodes, edges);
    if (result.clipboard) {
      clipboardRef.current = result.clipboard;
    }
    setNodes(result.nodes);
    setEdges(result.edges);
  }, [edges, nodes, selectedNodeId, setEdges, setNodes]);

  const paste = useCallback(() => {
    if (!clipboardRef.current) {
      return;
    }
    const nextNodes = pasteNodeFromClipboard(clipboardRef.current, nodes);
    setNodes(nextNodes);
  }, [nodes, setNodes]);

  useEffect(() => {
    if (!active) {
      return;
    }
    onRegister({ copy, cut, paste });
  }, [active, copy, cut, onRegister, paste]);

  return null;
}

function PipelineRunner({ active, onResult }: { active: boolean; onResult: (result: PipelineResult) => void }) {
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const selectedNodeId = useFlowStore((state) => state.selectedNodeId);
  const nodeValues = useNodeAttributeStore((state) => state.nodeValues);
  const nodeFiles = useNodeAttributeStore((state) => state.nodeFiles);

  useEffect(() => {
    function handleRun() {
      if (!active) return;
      const isScoped = Boolean(selectedNodeId);
      toast.promise(
        runPipeline(nodes, edges, nodeValues, nodeFiles, selectedNodeId).then((res) => {
          onResult(res);
          if (!res.success) throw new Error(res.error);
          return res;
        }),
        {
          loading: isScoped ? "Running pipeline to selected node..." : "Running pipeline...",
          success: (res) => `Pipeline complete: ${res.rows.length} rows`,
          error: (err) => `Pipeline failed: ${err.message}`,
        }
      );
    }
    window.addEventListener("pipeline:run", handleRun);
    return () => window.removeEventListener("pipeline:run", handleRun);
  }, [active, nodes, edges, selectedNodeId, nodeValues, nodeFiles, onResult]);

  // Auto-preview the selected node's state, like the properties panel updating
  // on selection. Runs quietly (no toast) and ignores stale results.
  useEffect(() => {
    if (!active || !selectedNodeId) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      runPipeline(nodes, edges, nodeValues, nodeFiles, selectedNodeId).then(
        (res) => {
          if (!cancelled) onResult(res);
        }
      );
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [active, selectedNodeId, nodes, edges, nodeValues, nodeFiles, onResult]);

  return null;
}

function SaveLoadBridge({
  active,
  tabId,
  workflowId,
  title,
  onUpdateTab,
  onRegister,
}: {
  active: boolean;
  tabId: string;
  workflowId?: string;
  title: string;
  onUpdateTab: (tabId: string, updates: Partial<EditorTab>) => void;
  onRegister: (handlers: {
    triggerSave: () => void;
    triggerOpen: () => void;
  }) => void;
}) {
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const nodeValues = useNodeAttributeStore((state) => state.nodeValues);
  const loadWorkflow = useFlowStore((state) => state.loadWorkflow);
  const bulkSetNodeValues = useNodeAttributeStore((state) => state.bulkSetNodeValues);

  const [saveOpen, setSaveOpen] = useState(false);
  const [openOpen, setOpenOpen] = useState(false);

  const triggerSave = useCallback(() => {
    if (!active) return;
    setSaveOpen(true);
  }, [active]);

  const triggerOpen = useCallback(() => {
    if (!active) return;
    setOpenOpen(true);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    onRegister({ triggerSave, triggerOpen });
  }, [active, triggerSave, triggerOpen, onRegister]);

  const handleOpenSelect = useCallback(
    async (id: string) => {
      try {
        const workflow = await getWorkflow(id);
        loadWorkflow(workflow.nodes as any, workflow.edges as any);
        bulkSetNodeValues(workflow.node_values as any);
        onUpdateTab(tabId, { title: workflow.name, workflowId: workflow.id });
        toast.success("Workflow loaded");
      } catch (err) {
        toast.error(`Failed to load workflow: ${(err as Error).message}`);
      }
    },
    [loadWorkflow, bulkSetNodeValues, onUpdateTab, tabId]
  );

  const handleSaved = useCallback(
    (id: string, name: string) => {
      onUpdateTab(tabId, { title: name, workflowId: id });
      toast.success("Workflow saved");
    },
    [onUpdateTab, tabId]
  );

  return (
    <>
      <SaveWorkflowDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        workflowId={workflowId ?? null}
        defaultName={title}
        nodes={nodes}
        edges={edges}
        nodeValues={nodeValues}
        onSaved={handleSaved}
      />
      <OpenWorkflowDialog
        open={openOpen}
        onOpenChange={setOpenOpen}
        onSelect={handleOpenSelect}
      />
    </>
  );
}

type FrozenView = {
  isChart: boolean;
  rows: Record<string, unknown>[];
  columns: string[];
  chartSettings: ChartSettings | null;
};

/**
 * Bottom-panel output. Shows a chart when a chart node is selected, otherwise
 * the data table. A Freeze toggle pins the current view (data + chart settings)
 * and ignores selection or pipeline changes until resumed.
 */
function DataView({ result }: { result: PipelineResult | null }) {
  const selectedNode = useFlowStore((state) =>
    state.nodes.find((node) => node.id === state.selectedNodeId),
  );
  const nodeValues = useNodeAttributeStore((state) => state.nodeValues);

  const [frozen, setFrozen] = useState(false);
  const [frozenView, setFrozenView] = useState<FrozenView | null>(null);

  const isChart = selectedNode?.data.kind === "chart";
  const values = selectedNode ? nodeValues[selectedNode.id] : undefined;
  const chartSettings: ChartSettings | null = isChart
    ? {
        chartType: String(values?.chartType ?? "bar"),
        xColumn: String(values?.xColumn ?? ""),
        yColumn: String(values?.yColumn ?? ""),
        aggregation: String(values?.aggregation ?? "none"),
      }
    : null;

  const liveView: FrozenView = {
    isChart,
    rows: result?.rows ?? [],
    columns: result?.columns ?? [],
    chartSettings,
  };

  const view = frozen && frozenView ? frozenView : liveView;

  const toggleFrozen = useCallback(() => {
    if (frozen) {
      setFrozen(false);
      setFrozenView(null);
    } else {
      setFrozenView(liveView);
      setFrozen(true);
    }
  }, [frozen, liveView]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground tabular-nums">
            {view.rows.length}
          </span>
          <span>rows</span>
          {frozen ? (
            <Badge variant="secondary" className="gap-1">
              <SnowflakeIcon className="size-3" />
              Frozen
            </Badge>
          ) : null}
        </div>
        <Button
          size="sm"
          variant={frozen ? "default" : "outline"}
          onClick={toggleFrozen}
        >
          {frozen ? (
            <>
              <PlayIcon data-icon="inline-start" />
              Resume
            </>
          ) : (
            <>
              <SnowflakeIcon data-icon="inline-start" />
              Freeze
            </>
          )}
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        {view.isChart && view.chartSettings ? (
          <ChartView data={view.rows} settings={view.chartSettings} />
        ) : (
          <DataTable data={view.rows} columns={view.columns} />
        )}
      </div>
    </div>
  );
}

function TabWorkspace({
  tab,
  active,
  onRegisterUndoRedo,
  onRegisterClipboard,
  onRegisterSaveLoad,
  onUpdateTab,
}: {
  tab: EditorTab;
  active: boolean;
  onRegisterUndoRedo: (handlers: { undo: () => void; redo: () => void }) => void;
  onRegisterClipboard: (handlers: {
    copy: () => void;
    cut: () => void;
    paste: () => void;
  }) => void;
  onRegisterSaveLoad: (handlers: {
    triggerSave: () => void;
    triggerOpen: () => void;
  }) => void;
  onUpdateTab: (tabId: string, updates: Partial<EditorTab>) => void;
}) {
  const showNodes = tab.panels.nodes;
  const showProperties = tab.panels.properties;
  const showTable = tab.panels.table;
  const bottomVisible = showNodes || showTable;
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);

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
        <ClipboardBridge active={active} onRegister={onRegisterClipboard} />
        <NodeAttributeStoreProvider>
          <SaveLoadBridge
            active={active}
            tabId={tab.id}
            workflowId={tab.workflowId}
            title={tab.title}
            onUpdateTab={onUpdateTab}
            onRegister={onRegisterSaveLoad}
          />
          <PipelineRunner active={active} onResult={setPipelineResult} />
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
                      <DataView result={pipelineResult} />
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
  const [activeClipboard, setActiveClipboard] = useState<{
    copy: () => void;
    cut: () => void;
    paste: () => void;
  }>({
    copy: () => {},
    cut: () => {},
    paste: () => {},
  });
  const [activeSaveLoad, setActiveSaveLoad] = useState<{
    triggerSave: () => void;
    triggerOpen: () => void;
  }>({
    triggerSave: () => {},
    triggerOpen: () => {},
  });

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

  const updateTab = useCallback((tabId: string, updates: Partial<EditorTab>) => {
    setTabs((currentTabs) =>
      currentTabs.map((tab) =>
        tab.id === tabId ? { ...tab, ...updates } : tab
      )
    );
  }, []);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <Toaster position="top-right" />
      <AppMenubar
        onNewTab={openTab}
        onUndo={activeUndoRedo.undo}
        onRedo={activeUndoRedo.redo}
        onCut={activeClipboard.cut}
        onCopy={activeClipboard.copy}
        onPaste={activeClipboard.paste}
        onSaveWorkflow={activeSaveLoad.triggerSave}
        onOpenWorkflow={activeSaveLoad.triggerOpen}
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
            onRegisterClipboard={setActiveClipboard}
            onRegisterSaveLoad={setActiveSaveLoad}
            onUpdateTab={updateTab}
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
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/*" element={<EditorLayout />} />
    </Routes>
  );
}
