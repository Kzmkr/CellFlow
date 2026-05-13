import {
  createContext,
  createElement,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import { takeSnapshot, type FlowSnapshot } from "@/components/node-handler";

import type { NodeKind } from "@/lib/node-registry";

export type RegistryNodeData = {
  kind: NodeKind;
};

export type RegistryFlowNode = Node<RegistryNodeData, "registryNode">;

type FlowState = {
  nodes: RegistryFlowNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  lastSnapshot: FlowSnapshot<RegistryFlowNode, Edge> | null;
  isDragging: boolean;
  onSnapshot?: () => void;
  addNode: (kind: NodeKind) => void;
  onNodesChange: (changes: NodeChange<RegistryFlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeDragStop: (event: any, node: RegistryFlowNode) => void;
  setNodes: (nodes: RegistryFlowNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  applySnapshot: (snapshot: FlowSnapshot<RegistryFlowNode, Edge>) => void;
  selectNode: (nodeId: string | null) => void;
  setOnSnapshot: (callback: (() => void) | undefined) => void;
};

export type FlowStore = StoreApi<FlowState>;

function getNextNodeId(nodes: RegistryFlowNode[]): string {
  const maxId = nodes.reduce((max, node) => {
    const match = /^n(\d+)$/.exec(node.id);
    if (!match) {
      return max;
    }
    return Math.max(max, Number(match[1]));
  }, 0);

  return `n${maxId + 1}`;
}

function getNextNodePosition(nodes: RegistryFlowNode[]): {
  x: number;
  y: number;
} {
  const nextIndex = nodes.length;
  const columns = 4;
  const gapX = 280;
  const gapY = 180;

  return {
    x: 40 + (nextIndex % columns) * gapX,
    y: 80 + Math.floor(nextIndex / columns) * gapY,
  };
}

function createInitialNodes(): RegistryFlowNode[] {
  return [
    {
      id: "n1",
      type: "registryNode",
      position: { x: 40, y: 80 },
      data: { kind: "fileInput" },
    },
    {
      id: "n2",
      type: "registryNode",
      position: { x: 320, y: 80 },
      data: { kind: "transform" },
    },
    {
      id: "n3",
      type: "registryNode",
      position: { x: 620, y: 80 },
      data: { kind: "join" },
    },
    {
      id: "n4",
      type: "registryNode",
      position: { x: 900, y: 80 },
      data: { kind: "dbOutput" },
    },
  ];
}

function createInitialEdges(): Edge[] {
  return [
    { id: "n1-n2", source: "n1", target: "n2" },
    { id: "n2-n3", source: "n2", target: "n3" },
    { id: "n1-n3", source: "n1", target: "n3" },
    { id: "n3-n4", source: "n3", target: "n4" },
  ];
}

export function createFlowStore(): FlowStore {
  const initialNodes = createInitialNodes();
  const initialEdges = createInitialEdges();

  return createStore<FlowState>((set) => ({
    nodes: initialNodes,
    edges: initialEdges,
    selectedNodeId: initialNodes[0]?.id ?? null,
    lastSnapshot: null,
    isDragging: false,
    addNode: (kind) => {
      set((state) => {
        const snapshot = takeSnapshot<RegistryFlowNode, Edge>(state.nodes, state.edges);
        state.onSnapshot?.();
        const nodeId = getNextNodeId(state.nodes);
        const nextNode: RegistryFlowNode = {
          id: nodeId,
          type: "registryNode",
          position: getNextNodePosition(state.nodes),
          data: { kind },
        };

        return {
          nodes: [...state.nodes, nextNode],
          selectedNodeId: nodeId,
          lastSnapshot: snapshot,
        };
      });
    },
    onNodesChange: (changes) => {
      set((state) => {
        // Don't take snapshots for position changes (dragging) - handled in onNodeDragStop
        const hasPositionChange = changes.some((change) => change.type === 'position');

        const snapshot = hasPositionChange
          ? state.lastSnapshot
          : takeSnapshot<RegistryFlowNode, Edge>(state.nodes, state.edges);

        return {
          nodes: applyNodeChanges<RegistryFlowNode>(changes, state.nodes),
          lastSnapshot: snapshot,
          isDragging: hasPositionChange ? true : state.isDragging,
        };
      });
    },
    onEdgesChange: (changes) => {
      set((state) => {
        const snapshot = takeSnapshot<RegistryFlowNode, Edge>(state.nodes, state.edges);
        state.onSnapshot?.();
        return {
          edges: applyEdgeChanges(changes, state.edges),
          lastSnapshot: snapshot,
        };
      });
    },
    onConnect: (connection) => {
      set((state) => {
        const snapshot = takeSnapshot<RegistryFlowNode, Edge>(state.nodes, state.edges);
        state.onSnapshot?.();
        return {
          edges: addEdge(connection, state.edges),
          lastSnapshot: snapshot,
        };
      });
    },
    onNodeDragStop: (event, node) => {
      set((state) => {
        const snapshot = takeSnapshot<RegistryFlowNode, Edge>(state.nodes, state.edges);
        state.onSnapshot?.();
        return {
          lastSnapshot: snapshot,
          isDragging: false,
        };
      });
    },
    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    applySnapshot: (snapshot) => {
      set({
        nodes: snapshot.nodes,
        edges: snapshot.edges,
        selectedNodeId: snapshot.nodes[0]?.id ?? null,
      });
    },
    setOnSnapshot: (callback) => set({ onSnapshot: callback }),
    selectNode: (nodeId) => {
      set({ selectedNodeId: nodeId });
    },
  }));
}

const FlowStoreContext = createContext<FlowStore | null>(null);

export function FlowStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<FlowStore | null>(null);
  if (storeRef.current == null) {
    storeRef.current = createFlowStore();
  }

  return createElement(
    FlowStoreContext.Provider,
    { value: storeRef.current },
    children,
  );
}

export function useFlowStore<T>(selector: (state: FlowState) => T): T {
  const store = useContext(FlowStoreContext);
  if (!store) {
    throw new Error("useFlowStore must be used within a FlowStoreProvider");
  }

  return useStore(store, selector);
}
