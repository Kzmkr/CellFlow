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
  icon: "file-input" | "wand" | "database" | "join" | "chart" | "add-column" | "delete-column";
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
          { value: "filter", label: "Filter" },
        ],
      },
      {
        type: "textarea",
        key: "script",
        label: "Script",
        defaultValue: "SELECT * FROM input",
        placeholder: "Write your transform script",
      },
      {
        type: "text",
        key: "filterColumn",
        label: "Column",
        defaultValue: "",
        placeholder: "Select a column",
      },
      {
        type: "select",
        key: "filterOperator",
        label: "Operator",
        defaultValue: "eq",
        options: [
          { value: "eq", label: "Equals (=)" },
          { value: "neq", label: "Not equals (≠)" },
          { value: "gt", label: "Greater than (>)" },
          { value: "gte", label: "Greater or equal (≥)" },
          { value: "lt", label: "Less than (<)" },
          { value: "lte", label: "Less or equal (≤)" },
          { value: "between", label: "Between" },
          { value: "contains", label: "Contains" },
        ],
      },
      {
        type: "text",
        key: "filterValue",
        label: "Value",
        defaultValue: "",
        placeholder: "Value",
      },
      {
        type: "text",
        key: "filterValueTo",
        label: "And",
        defaultValue: "",
        placeholder: "Upper bound",
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
  addColumn: {
    title: "Add Column",
    icon: "add-column",
    colorClassName: "border-teal-500/30 bg-teal-500/8 text-teal-900",
    handles: [
      { type: "target", position: "left" },
      { type: "source", position: "right" },
    ],
    attributes: [
      {
        type: "text",
        key: "label",
        label: "Label",
        defaultValue: "Add Column",
        required: true,
      },
      {
        type: "text",
        key: "columnName",
        label: "Column Name",
        defaultValue: "new_column",
        required: true,
        placeholder: "new_column",
      },
      {
        type: "textarea",
        key: "expression",
        label: "Expression",
        description:
          "SQL expression over existing columns, e.g. price * quantity or first_name || ' ' || last_name.",
        defaultValue: "",
        placeholder: "price * quantity",
      },
    ],
  },
  deleteColumn: {
    title: "Delete Column",
    icon: "delete-column",
    colorClassName: "border-orange-500/30 bg-orange-500/8 text-orange-900",
    handles: [
      { type: "target", position: "left" },
      { type: "source", position: "right" },
    ],
    attributes: [
      {
        type: "text",
        key: "label",
        label: "Label",
        defaultValue: "Delete Column",
        required: true,
      },
      {
        type: "text",
        key: "column",
        label: "Column",
        defaultValue: "",
        placeholder: "Select a column",
      },
    ],
  },
  chart: {
    title: "Chart",
    icon: "chart",
    colorClassName: "border-rose-500/30 bg-rose-500/8 text-rose-900",
    handles: [{ type: "target", position: "left" }],
    attributes: [
      {
        type: "text",
        key: "label",
        label: "Label",
        defaultValue: "Chart",
        required: true,
      },
      {
        type: "select",
        key: "chartType",
        label: "Chart Type",
        defaultValue: "bar",
        options: [
          { value: "bar", label: "Bar" },
          { value: "line", label: "Line" },
          { value: "pie", label: "Pie" },
          { value: "doughnut", label: "Doughnut" },
          { value: "scatter", label: "Scatter" },
        ],
        required: true,
      },
      {
        type: "text",
        key: "xColumn",
        label: "X / Category",
        defaultValue: "",
        placeholder: "Select a column",
      },
      {
        type: "text",
        key: "yColumn",
        label: "Y / Value",
        defaultValue: "",
        placeholder: "Select a column",
      },
      {
        type: "select",
        key: "aggregation",
        label: "Aggregation",
        description: "How to combine Y values that share an X category.",
        defaultValue: "none",
        options: [
          { value: "none", label: "None" },
          { value: "sum", label: "Sum" },
          { value: "avg", label: "Average" },
          { value: "count", label: "Count" },
          { value: "min", label: "Min" },
          { value: "max", label: "Max" },
        ],
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
