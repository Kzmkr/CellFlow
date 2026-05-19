"use client";

import {
  DatabaseIcon,
  FileInputIcon,
  GitMergeIcon,
  WandSparklesIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useFlowStore } from "@/lib/flow-store";
import { NODE_REGISTRY, type NodeKind } from "@/lib/node-registry";
import { cn } from "@/lib/utils";

const iconMap = {
  "file-input": FileInputIcon,
  wand: WandSparklesIcon,
  database: DatabaseIcon,
  join: GitMergeIcon,
};

export function ActionGrid() {
  const addNode = useFlowStore((state) => state.addNode);
  const actions = Object.entries(NODE_REGISTRY) as Array<
    [NodeKind, (typeof NODE_REGISTRY)[NodeKind]]
  >;

  return (
    <div className="flex h-full flex-col p-4">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">Nodes</h3>
      <div className="grid grid-cols-2 gap-3 flex-1 content-start">
        {actions.map(([kind, definition]) => {
          const Icon = iconMap[definition.icon];

          return (
            <Button
              key={kind}
              variant="outline"
              className={cn(
                "flex h-20 flex-col items-center justify-center gap-2 border",
                definition.colorClassName,
              )}
              onClick={() => addNode(kind)}
            >
              <Icon aria-hidden="true" className="size-5" />
              <span className="text-sm font-medium">{definition.title}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
