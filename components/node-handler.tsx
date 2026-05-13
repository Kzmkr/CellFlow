import { useState, useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';

// 1. Típusdefiníció a mentett pillanatképhez
export type FlowSnapshot<TNode extends Node = Node, TEdge extends Edge = Edge> = {
  nodes: TNode[];
  edges: TEdge[];
};

export function takeSnapshot<TNode extends Node = Node, TEdge extends Edge = Edge>(
  nodes: TNode[],
  edges: TEdge[],
): FlowSnapshot<TNode, TEdge> {
  return {
    nodes: JSON.parse(JSON.stringify(nodes)) as TNode[],
    edges: JSON.parse(JSON.stringify(edges)) as TEdge[],
  };
}

export function useUndoRedo<TNode extends Node = Node, TEdge extends Edge = Edge>(
  nodes: TNode[],
  edges: TEdge[],
  setNodes: (nodes: TNode[]) => void,
  setEdges: (edges: TEdge[]) => void,
) {
  // A múlt és a jövő "tornyai" (stack-ek)
  const [past, setPast] = useState<FlowSnapshot<TNode, TEdge>[]>([]);
  const [future, setFuture] = useState<FlowSnapshot<TNode, TEdge>[]>([]);

  const recordSnapshot = useCallback(() => {
    const snapshot = takeSnapshot<TNode, TEdge>(nodes, edges);

    setPast((prev) => [...prev, snapshot].slice(-50));
    setFuture([]);
    return snapshot;
  }, [nodes, edges]);

  // --- VISSZAVONÁS (Undo) ---
  const undo = useCallback(() => {
    if (past.length === 0) return;

    const previous = past[past.length - 1]; // Az utolsó mentett állapot
    const newPast = past.slice(0, -1);      // Eltávolítjuk a múltból

    // A jelenlegi állapotot elmentjük a jövőbe a redo-hoz
    const currentSnapshot = takeSnapshot<TNode, TEdge>(nodes, edges);
    setFuture((prev) => [currentSnapshot, ...prev]);

    // Alkalmazzuk a régi állapotot
    setNodes(previous.nodes);
    setEdges(previous.edges);
    setPast(newPast);
  }, [past, nodes, edges, setNodes, setEdges]);

  // --- ÚJRA VÉGREHAJTÁS (Redo) ---
  const redo = useCallback(() => {
    if (future.length === 0) return;

    const next = future[0];         // A következő állapot a jövőből
    const newFuture = future.slice(1); // Kivesszük a jövőből

    // A jelenlegi állapotot elmentjük a múltba
    const currentSnapshot = takeSnapshot<TNode, TEdge>(nodes, edges);
    setPast((prev) => [...prev, currentSnapshot]);

    // Alkalmazzuk az új állapotot
    setNodes(next.nodes);
    setEdges(next.edges);
    setFuture(newFuture);
  }, [future, nodes, edges, setNodes, setEdges]);

  return { undo, redo, takeSnapshot: recordSnapshot, canUndo: past.length > 0, canRedo: future.length > 0 };
}