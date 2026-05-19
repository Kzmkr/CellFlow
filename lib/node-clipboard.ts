import { Edge } from "@xyflow/react";
import { RegistryFlowNode } from "@/lib/flow-store";

export type NodeClipboard = {
  node: RegistryFlowNode;
};

function cloneNode(node: RegistryFlowNode): RegistryFlowNode {
  return JSON.parse(JSON.stringify(node)) as RegistryFlowNode;
}

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

export function copySelectedNode(
  selectedNodeId: string | null,
  nodes: RegistryFlowNode[],
): NodeClipboard | null {
  if (!selectedNodeId) {
    return null;
  }

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  if (!selectedNode) {
    return null;
  }

  return { node: cloneNode(selectedNode) };
}

export function cutSelectedNode(
  selectedNodeId: string | null,
  nodes: RegistryFlowNode[],
  edges: Edge[],
): {
  clipboard: NodeClipboard | null;
  nodes: RegistryFlowNode[];
  edges: Edge[];
} {
  if (!selectedNodeId) {
    return {
      clipboard: null,
      nodes,
      edges,
    };
  }

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  if (!selectedNode) {
    return {
      clipboard: null,
      nodes,
      edges,
    };
  }

  const remainingNodes = nodes.filter((node) => node.id !== selectedNodeId);
  const remainingEdges = edges.filter(
    (edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId,
  );

  return {
    clipboard: { node: cloneNode(selectedNode) },
    nodes: remainingNodes,
    edges: remainingEdges,
  };
}

export function pasteNodeFromClipboard(
  clipboard: NodeClipboard,
  nodes: RegistryFlowNode[],
): RegistryFlowNode[] {
  const nextNode = cloneNode(clipboard.node);
  nextNode.id = getNextNodeId(nodes);
  nextNode.position = {
    x: (nextNode.position?.x ?? 0) + 40,
    y: (nextNode.position?.y ?? 0) + 40,
  };

  return [...nodes, nextNode];
}
