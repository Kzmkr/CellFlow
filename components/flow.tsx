import { useEffect } from "react";

import { Background, Controls, MiniMap, ReactFlow, type NodeTypes } from "@xyflow/react";

import { RegistryNode } from "@/components/nodes/registry-node";
import { useFlowStore } from "@/lib/flow-store";
import { useNodeAttributeStore } from "@/lib/node-attribute-store";

const nodeTypes = {
  registryNode: RegistryNode,
} satisfies NodeTypes;

export default function Flow() {
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