import { Routes, Route } from "react-router-dom";
import { useCallback, useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import type { Edge } from "@xyflow/react";

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { DataTable } from "@/components/data-table";
import { AppMenubar } from "@/components/app-menubar";
import { EditorTabBar } from "@/components/editor-tab-bar";
import { ActionGrid } from "@/components/action-grid";
import { PropertiesPanel } from "@/components/properties-panel";
import Flow from "@/components/flow";
import { useUndoRedo } from "@/components/node-handler";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import {
  FlowStoreProvider,
  useFlowStore,
  type RegistryFlowNode,
} from "@/lib/flow-store";
import {
  copySelectedNode,
  cutSelectedNode,
  pasteNodeFromClipboard,
  type NodeClipboard,
} from "../lib/node-clipboard";
import {
  NodeAttributeStoreProvider,
  useNodeAttributeStore,
} from "@/lib/node-attribute-store";
import {
  ApiError,
  createWorkflow,
  deleteWorkflow,
  getWorkflow,
  listWorkflows,
  updateWorkflow,
  type WorkflowData,
  type WorkflowSummary,
} from "@/lib/api";
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
  workflowId: string | null;
  initialData?: WorkflowData;
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
    workflowId: null,
  };
}

type WorkflowIOHandlers = {
  getSnapshot: () => WorkflowData;
};

function WorkflowIOBridge({
  tabId,
  initialData,
  onRegister,
}: {
  tabId: string;
  initialData?: WorkflowData;
  onRegister: (tabId: string, handlers: WorkflowIOHandlers) => void;
}) {
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const setNodes = useFlowStore((state) => state.setNodes);
  const setEdges = useFlowStore((state) => state.setEdges);
  const nodeValues = useNodeAttributeStore((state) => state.nodeValues);
  const loadValues = useNodeAttributeStore((state) => state.loadValues);

  const hasLoadedInitialData = useRef(false);
  useEffect(() => {
    if (hasLoadedInitialData.current || !initialData) {
      return;
    }
    hasLoadedInitialData.current = true;
    setNodes(initialData.nodes as RegistryFlowNode[]);
    setEdges(initialData.edges as Edge[]);
    loadValues(initialData.nodeValues);
  }, [initialData, setNodes, setEdges, loadValues]);

  useEffect(() => {
    onRegister(tabId, {
      getSnapshot: () => ({
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
        nodeValues: JSON.parse(JSON.stringify(nodeValues)),
      }),
    });
  }, [tabId, nodes, edges, nodeValues, onRegister]);

  return null;
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

function TabWorkspace({
  tab,
  active,
  onRegisterUndoRedo,
  onRegisterClipboard,
  onRegisterWorkflowIO,
}: {
  tab: EditorTab;
  active: boolean;
  onRegisterUndoRedo: (handlers: { undo: () => void; redo: () => void }) => void;
  onRegisterClipboard: (handlers: {
    copy: () => void;
    cut: () => void;
    paste: () => void;
  }) => void;
  onRegisterWorkflowIO: (tabId: string, handlers: WorkflowIOHandlers) => void;
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
        <ClipboardBridge active={active} onRegister={onRegisterClipboard} />
        <NodeAttributeStoreProvider>
          <WorkflowIOBridge
            tabId={tab.id}
            initialData={tab.initialData}
            onRegister={onRegisterWorkflowIO}
          />
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
  const [activeClipboard, setActiveClipboard] = useState<{
    copy: () => void;
    cut: () => void;
    paste: () => void;
  }>({
    copy: () => {},
    cut: () => {},
    paste: () => {},
  });

  const workflowIORef = useRef<Record<string, WorkflowIOHandlers>>({});
  const registerWorkflowIO = useCallback(
    (tabId: string, handlers: WorkflowIOHandlers) => {
      workflowIORef.current[tabId] = handlers;
    },
    [],
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [saveAsName, setSaveAsName] = useState("");
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);
  const [savedWorkflows, setSavedWorkflows] = useState<WorkflowSummary[]>([]);

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
    delete workflowIORef.current[tabId];
  }

  async function persistTab(tab: EditorTab, name: string, forceCreate: boolean) {
    const io = workflowIORef.current[tab.id];
    if (!io) {
      return;
    }

    setIsSaving(true);
    try {
      const snapshot = io.getSnapshot();
      const result =
        tab.workflowId && !forceCreate
          ? await updateWorkflow(tab.workflowId, { name, data: snapshot })
          : await createWorkflow(name, snapshot);

      setTabs((currentTabs) =>
        currentTabs.map((t) =>
          t.id === tab.id
            ? { ...t, workflowId: result.id, title: result.name }
            : t,
        ),
      );
      toast.success(`Saved "${result.name}"`);
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 401
          ? "Sign in to save workflows."
          : "Couldn't save the workflow. Please try again.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  function handleSave() {
    if (!activeTab) {
      return;
    }
    if (activeTab.workflowId) {
      void persistTab(activeTab, activeTab.title, false);
    } else {
      setSaveAsName(activeTab.title);
      setSaveAsOpen(true);
    }
  }

  function handleSaveAs() {
    if (!activeTab) {
      return;
    }
    setSaveAsName(activeTab.title);
    setSaveAsOpen(true);
  }

  async function confirmSaveAs(event?: FormEvent) {
    event?.preventDefault();
    const name = saveAsName.trim();
    if (!activeTab || !name) {
      return;
    }
    await persistTab(activeTab, name, true);
    setSaveAsOpen(false);
  }

  async function handleOpen() {
    setOpenDialogOpen(true);
    setIsLoadingWorkflows(true);
    try {
      const list = await listWorkflows();
      setSavedWorkflows(list);
    } catch {
      toast.error("Couldn't load saved workflows.");
    } finally {
      setIsLoadingWorkflows(false);
    }
  }

  async function handleOpenWorkflow(summary: WorkflowSummary) {
    try {
      const workflow = await getWorkflow(summary.id);
      const tab: EditorTab = {
        id: `tab-${nextTabNumberRef.current}`,
        title: workflow.name,
        panels: { ...DEFAULT_TAB_PANELS },
        workflowId: workflow.id,
        initialData: workflow.data,
      };
      nextTabNumberRef.current += 1;
      setTabs((currentTabs) => [...currentTabs, tab]);
      setActiveTabId(tab.id);
      setOpenDialogOpen(false);
    } catch {
      toast.error("Couldn't open workflow.");
    }
  }

  async function handleDeleteWorkflow(
    summary: WorkflowSummary,
    event: MouseEvent,
  ) {
    event.stopPropagation();
    try {
      await deleteWorkflow(summary.id);
      setSavedWorkflows((current) =>
        current.filter((workflow) => workflow.id !== summary.id),
      );
      toast.success(`Deleted "${summary.name}"`);
    } catch {
      toast.error("Couldn't delete workflow.");
    }
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
        onCut={activeClipboard.cut}
        onCopy={activeClipboard.copy}
        onPaste={activeClipboard.paste}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onOpen={handleOpen}
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
            onRegisterWorkflowIO={registerWorkflowIO}
          />
        ))}
      </div>

      <Dialog open={saveAsOpen} onOpenChange={setSaveAsOpen}>
        <DialogContent>
          <form onSubmit={confirmSaveAs}>
            <DialogHeader>
              <DialogTitle>Save workflow</DialogTitle>
              <DialogDescription>
                Give this workflow a name to save it to your account.
              </DialogDescription>
            </DialogHeader>
            <Input
              autoFocus
              value={saveAsName}
              onChange={(event) => setSaveAsName(event.target.value)}
              placeholder="Workflow name"
              className="mt-2"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSaveAsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!saveAsName.trim() || isSaving}>
                {isSaving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openDialogOpen} onOpenChange={setOpenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open workflow</DialogTitle>
            <DialogDescription>
              Choose a saved workflow to open in a new tab.
            </DialogDescription>
          </DialogHeader>
          <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
            {isLoadingWorkflows && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Loading…
              </p>
            )}
            {!isLoadingWorkflows && savedWorkflows.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No saved workflows yet.
              </p>
            )}
            {!isLoadingWorkflows &&
              savedWorkflows.map((workflow) => (
                <button
                  key={workflow.id}
                  type="button"
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => handleOpenWorkflow(workflow)}
                >
                  <span className="truncate">{workflow.name}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    className="ml-2 shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                    aria-label={`Delete ${workflow.name}`}
                    onClick={(event) => handleDeleteWorkflow(workflow, event)}
                  >
                    <XIcon className="size-3.5" />
                  </span>
                </button>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
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
