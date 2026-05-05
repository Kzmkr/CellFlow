export type NodeHandlePosition = "top" | "right" | "bottom" | "left";

export type NodeField =
  | {
      type: "text" | "textarea" | "file";
      key: string;
      label: string;
      description?: string;
      defaultValue: string;
      required?: boolean;
      placeholder?: string;
      accept?: string;
    }
  | {
      type: "number" | "slider";
      key: string;
      label: string;
      description?: string;
      defaultValue: number;
      required?: boolean;
      min?: number;
      max?: number;
      step?: number;
    }
  | {
      type: "toggle";
      key: string;
      label: string;
      description?: string;
      defaultValue: boolean;
      required?: boolean;
    }
  | {
      type: "select";
      key: string;
      label: string;
      description?: string;
      defaultValue: string;
      options: Array<{ value: string; label: string }>;
      required?: boolean;
    };

export type NodeDefinition = {
  title: string;
  icon: "file-input" | "wand" | "database" | "join";
  colorClassName: string;
  handles: Array<{
    type: "source" | "target";
    position: NodeHandlePosition;
  }>;
  attributes: NodeField[];
};

export const NODE_REGISTRY = {
  fileInput: {
    title: "File Input",
    icon: "file-input",
    colorClassName: "border-sky-500/30 bg-sky-500/8 text-sky-900",
    handles: [{ type: "source", position: "right" }],
    attributes: [
      {
        type: "text",
        key: "label",
        label: "Label",
        defaultValue: "File Input",
        required: true,
      },
      {
        type: "file",
        key: "source",
        label: "Source",
        defaultValue: "",
        required: true,
        placeholder: "Paste a URL or choose a file",
      },
    ],
  },
  transform: {
    title: "Transform",
    icon: "wand",
    colorClassName: "border-amber-500/30 bg-amber-500/8 text-amber-900",
    handles: [
      { type: "target", position: "left" },
      { type: "source", position: "right" },
    ],
    attributes: [
      {
        type: "text",
        key: "label",
        label: "Label",
        defaultValue: "Transform",
        required: true,
      },
      {
        type: "select",
        key: "mode",
        label: "Mode",
        defaultValue: "sql",
        options: [
          { value: "sql", label: "SQL" },
        ],
      },
      {
        type: "textarea",
        key: "script",
        label: "Script",
        required: true,
        defaultValue: "SELECT * FROM input",
        placeholder: "Write your transform script",
      },
      {
        type: "slider",
        key: "sampleRate",
        label: "Sample Rate",
        description: "Percentage of rows used for preview.",
        defaultValue: 100,
        min: 1,
        max: 100,
        step: 1,
      },
    ],
  },
  join: {
    title: "Join",
    icon: "join",
    colorClassName: "border-violet-500/30 bg-violet-500/8 text-violet-900",
    handles: [
      { type: "target", position: "left" },
    
      { type: "source", position: "right" },
    ],
    attributes: [
      {
        type: "text",
        key: "label",
        label: "Label",
        defaultValue: "Join",
        required: true,
      },
      {
        type: "select",
        key: "joinType",
        label: "Join Type",
        defaultValue: "inner",
        options: [
          { value: "inner", label: "Inner" },
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
          { value: "full", label: "Full" },
        ],
        required: true,
      },
      {
        type: "text",
        key: "leftKey",
        label: "Left Key",
        defaultValue: "id",
        required: true,
      },
      {
        type: "text",
        key: "rightKey",
        label: "Right Key",
        defaultValue: "id",
        required: true,
      },
    ],
  },
  dbOutput: {
    title: "Output",
    icon: "database",
    colorClassName: "border-emerald-500/30 bg-emerald-500/8 text-emerald-900",
    handles: [{ type: "target", position: "left" }],
    attributes: [
      {
        type: "text",
        key: "label",
        label: "Label",
        defaultValue: "Output",
        required: true,
      },
      {
        type: "select",
        key: "outputType",
        label: "Output Type",
        defaultValue: "db",
        options: [
          { value: "db", label: "Database" },
          { value: "file", label: "File" },
        ],
        required: true,
      },
      {
        type: "select",
        key: "target",
        label: "Destination",
        defaultValue: "postgres",
        options: [
          { value: "mysql", label: "MySQL" },
          { value: "postgres", label: "PostgreSQL" },
          { value: "json", label: "JSON" },
          { value: "csv", label: "CSV" },
          { value: "parquet", label: "Parquet" },
        ],
        required: true,
      },
    ],
  },
} as const satisfies Record<string, NodeDefinition>;

export type NodeKind = keyof typeof NODE_REGISTRY;

export type NodeValues = Record<string, string | number | boolean>;

export function getNodeDefinition(kind: NodeKind): NodeDefinition {
  return NODE_REGISTRY[kind];
}

export function getDefaultValues(kind: NodeKind): NodeValues {
  const definition = getNodeDefinition(kind);
  return definition.attributes.reduce<NodeValues>((acc, attribute) => {
    acc[attribute.key] = attribute.defaultValue;
    return acc;
  }, {});
}
