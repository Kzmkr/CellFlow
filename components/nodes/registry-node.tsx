import { Handle, Position } from "@xyflow/react";
import { DatabaseIcon, FileInputIcon, GitMergeIcon, WandSparklesIcon } from "lucide-react";

import {
  BaseNode,
  BaseNodeContent,
  BaseNodeHeader,
  BaseNodeHeaderTitle,
} from "@/components/base-node";
import { cn } from "@/lib/utils";
import {
  getDefaultValues,
  getNodeDefinition,
  type NodeHandlePosition,
  type NodeKind,
} from "@/lib/node-registry";
import { useNodeAttributeStore } from "@/lib/node-attribute-store";

type RegistryNodeData = {
  kind: NodeKind;
};

const iconMap = {
  "file-input": FileInputIcon,
  wand: WandSparklesIcon,
  database: DatabaseIcon,
  join: GitMergeIcon,
};

function toPosition(position: NodeHandlePosition): Position {
  switch (position) {
    case "top":
      return Position.Top;
    case "right":
      return Position.Right;
    case "bottom":
      return Position.Bottom;
    case "left":
      return Position.Left;
    default:
      return Position.Right;
  }
}

function toTitleCase(value: string): string {
  return value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function getPreviewLine(kind: NodeKind, values: Record<string, string | number | boolean>): string {
  if (kind === "fileInput") {
    const source = String(values.source ?? "").trim();
    return source.length > 0 ? source : "No file selected";
  }

  if (kind === "join") {
    const joinType = String(values.joinType ?? "inner");
    return `Type: ${toTitleCase(joinType)}`;
  }

  if (kind === "dbOutput") {
    const outputType = String(values.outputType ?? "db");
    return `Type: ${toTitleCase(outputType)}`;
  }

  if (kind === "transform") {
    const script = String(values.script ?? "");
    const firstLine = script
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0);

    return firstLine ?? "No script";
  }

  return "";
}

export function RegistryNode({ id, data }: { id: string; data: RegistryNodeData }) {
  const definition = getNodeDefinition(data.kind);
  const Icon = iconMap[definition.icon];
  const nodeValues = useNodeAttributeStore((state) => state.nodeValues[id]);
  const values = nodeValues ?? getDefaultValues(data.kind);

  // Get live label from node values, or fallback to definition title
  const displayLabel = values.label ? String(values.label) : definition.title;
  const previewLine = getPreviewLine(data.kind, values);

  return (
    <BaseNode className={cn("min-w-52", definition.colorClassName)}>
      {definition.handles.map((handle, index) => (
        <Handle
          key={`${id}-${handle.type}-${handle.position}-${index}`}
          type={handle.type}
          position={toPosition(handle.position)}
        />
      ))}
      <BaseNodeHeader>
        <div className="rounded-md bg-background/80 p-1.5">
          <Icon aria-hidden="true" className="size-4" />
        </div>
        <BaseNodeHeaderTitle>{displayLabel}</BaseNodeHeaderTitle>
      </BaseNodeHeader>
      <BaseNodeContent className="pt-0">
        <p className="truncate text-xs text-muted-foreground">{previewLine}</p>
      </BaseNodeContent>
    </BaseNode>
  );
}
