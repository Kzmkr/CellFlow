import { useEffect, useState } from "react";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type NodeTypes,
  type ColorMode,
} from "@xyflow/react";

import { useTheme } from "next-themes";

import { RegistryNode } from "@/components/nodes/registry-node";
import { useFlowStore } from "@/lib/flow-store";
import { useNodeAttributeStore } from "@/lib/node-attribute-store";

const nodeTypes = {
  registryNode: RegistryNode,
} satisfies NodeTypes;

export default function Flow() {
  const { resolvedTheme } = useTheme();
  const flowColorMode: ColorMode = resolvedTheme == "dark" ? "dark" : "light";

  useEffect(() => {
    // Find the root .react-flow element that the library renders.
    // It may not exist immediately on first render, so toggle when it appears.
    const el = document.querySelector(".react-flow");
    if (!el) return;

    if (resolvedTheme === "dark") el.classList.add("dark");
    else el.classList.remove("dark");

    // keep in sync on cleanup if element is removed
    return () => {
      if (!el) return;
      el.classList.remove("dark");
    };
  }, [resolvedTheme]);

  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const onNodesChange = useFlowStore((state) => state.onNodesChange);
  const onEdgesChange = useFlowStore((state) => state.onEdgesChange);
  const onConnect = useFlowStore((state) => state.onConnect);
  const selectNode = useFlowStore((state) => state.selectNode);

  const ensureNodeDefaults = useNodeAttributeStore(
    (state) => state.ensureNodeDefaults,
  );

  useEffect(() => {
    for (const node of nodes) {
      ensureNodeDefaults(node.id, node.data.kind);
    }
  }, [nodes, ensureNodeDefaults]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={({ nodes: selectedNodes }) => {
          selectNode(selectedNodes[0]?.id ?? null);
        }}
        fitView
        className="h-full w-full"
      >
        <Background gap={24} size={1} />
        <MiniMap zoomable pannable />
        <Controls />
      </ReactFlow>
    </div>
  );
}
