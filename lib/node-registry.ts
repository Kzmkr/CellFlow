import { DEMO_ROW_KEYS } from "@/lib/demo-data";

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
  icon: "file-input" | "wand" | "database" | "join" | "convert" | "document";
  colorClassName: string;
  handles: Array<{
    type: "source" | "target";
    position: NodeHandlePosition;
  }>;
  attributes: NodeField[];
};

function toColumnLabel(key: string): string {
  return key === "id" ? "ID" : key.charAt(0).toUpperCase() + key.slice(1);
}

// Columns exposed by the demo dataset shown in the data table preview.
export const CONVERSION_COLUMNS: Array<{ value: string; label: string }> =
  DEMO_ROW_KEYS.map((key) => ({ value: key, label: toColumnLabel(key) }));

export type ConversionPreset = {
  value: string;
  label: string;
  group: string;
  expression: (column: string) => string;
};

export const CONVERSION_PRESETS: ConversionPreset[] = [
  // Text
  { value: "uppercase", label: "Uppercase", group: "Text", expression: (c) => `UPPER(${c})` },
  { value: "lowercase", label: "Lowercase", group: "Text", expression: (c) => `LOWER(${c})` },
  { value: "titleCase", label: "Title Case", group: "Text", expression: (c) => `INITCAP(${c})` },
  { value: "trim", label: "Trim Whitespace", group: "Text", expression: (c) => `TRIM(${c})` },
  { value: "reverse", label: "Reverse", group: "Text", expression: (c) => `REVERSE(${c})` },
  { value: "slugify", label: "Slugify", group: "Text", expression: (c) => `SLUGIFY(${c})` },
  { value: "stripHtml", label: "Strip HTML", group: "Text", expression: (c) => `STRIP_HTML(${c})` },
  // Type casting
  { value: "toInteger", label: "To Integer", group: "Type", expression: (c) => `CAST(${c} AS INTEGER)` },
  { value: "toDecimal", label: "To Decimal", group: "Type", expression: (c) => `CAST(${c} AS DECIMAL(18,2))` },
  { value: "toText", label: "To Text", group: "Type", expression: (c) => `CAST(${c} AS TEXT)` },
  { value: "toBoolean", label: "To Boolean", group: "Type", expression: (c) => `CAST(${c} AS BOOLEAN)` },
  // Numeric
  { value: "round", label: "Round (2dp)", group: "Numeric", expression: (c) => `ROUND(${c}, 2)` },
  { value: "floor", label: "Floor", group: "Numeric", expression: (c) => `FLOOR(${c})` },
  { value: "ceil", label: "Ceiling", group: "Numeric", expression: (c) => `CEIL(${c})` },
  { value: "absolute", label: "Absolute Value", group: "Numeric", expression: (c) => `ABS(${c})` },
  { value: "negate", label: "Negate", group: "Numeric", expression: (c) => `-${c}` },
  // Date & time
  { value: "toDate", label: "To Date", group: "Date & Time", expression: (c) => `CAST(${c} AS DATE)` },
  { value: "toTimestamp", label: "To Timestamp", group: "Date & Time", expression: (c) => `CAST(${c} AS TIMESTAMP)` },
  { value: "extractYear", label: "Extract Year", group: "Date & Time", expression: (c) => `EXTRACT(YEAR FROM ${c})` },
  { value: "extractMonth", label: "Extract Month", group: "Date & Time", expression: (c) => `EXTRACT(MONTH FROM ${c})` },
  { value: "extractDay", label: "Extract Day", group: "Date & Time", expression: (c) => `EXTRACT(DAY FROM ${c})` },
  { value: "unixToTimestamp", label: "Unix Timestamp → Date", group: "Date & Time", expression: (c) => `TO_TIMESTAMP(${c})` },
  // Encoding
  { value: "base64Encode", label: "Base64 Encode", group: "Encoding", expression: (c) => `TO_BASE64(${c})` },
  { value: "base64Decode", label: "Base64 Decode", group: "Encoding", expression: (c) => `FROM_BASE64(${c})` },
  { value: "urlEncode", label: "URL Encode", group: "Encoding", expression: (c) => `URL_ENCODE(${c})` },
  { value: "urlDecode", label: "URL Decode", group: "Encoding", expression: (c) => `URL_DECODE(${c})` },
  { value: "jsonParse", label: "Parse JSON", group: "Encoding", expression: (c) => `PARSE_JSON(${c})` },
  { value: "jsonStringify", label: "To JSON String", group: "Encoding", expression: (c) => `TO_JSON(${c})` },
  // Unit conversion
  { value: "celsiusToFahrenheit", label: "Celsius → Fahrenheit", group: "Units", expression: (c) => `(${c} * 9/5) + 32` },
  { value: "fahrenheitToCelsius", label: "Fahrenheit → Celsius", group: "Units", expression: (c) => `(${c} - 32) * 5/9` },
  { value: "kmToMiles", label: "Kilometers → Miles", group: "Units", expression: (c) => `${c} * 0.621371` },
  { value: "milesToKm", label: "Miles → Kilometers", group: "Units", expression: (c) => `${c} * 1.60934` },
  { value: "kgToLbs", label: "Kilograms → Pounds", group: "Units", expression: (c) => `${c} * 2.20462` },
  { value: "lbsToKg", label: "Pounds → Kilograms", group: "Units", expression: (c) => `${c} * 0.453592` },
  { value: "metersToFeet", label: "Meters → Feet", group: "Units", expression: (c) => `${c} * 3.28084` },
  { value: "feetToMeters", label: "Feet → Meters", group: "Units", expression: (c) => `${c} * 0.3048` },
  // Custom
  { value: "custom", label: "Custom Expression", group: "Custom", expression: (c) => c },
];

export function getConversionPreset(value: string): ConversionPreset {
  return (
    CONVERSION_PRESETS.find((preset) => preset.value === value) ??
    CONVERSION_PRESETS[0]
  );
}

export function buildConversionExpression(presetValue: string, column: string): string {
  return getConversionPreset(presetValue).expression(column || "column");
}

// Default Typst template for the Document node — placeholders use the
// dataset's own row keys, e.g. {{name}}, {{email}}.
export const DEFAULT_DOCUMENT_TEMPLATE = [
  "= Record {{id}}",
  "",
  "*Name:* {{name}} \\",
  "*Email:* {{email}} \\",
  "*Status:* {{status}} \\",
  "*Role:* {{role}}",
].join("\n");

export const DOCUMENT_FORMATS: Array<{ value: string; label: string }> = [
  { value: "pdf", label: "PDF" },
  { value: "svg", label: "SVG" },
];

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
  conversion: {
    title: "Conversion",
    icon: "convert",
    colorClassName: "border-rose-500/30 bg-rose-500/8 text-rose-900",
    handles: [
      { type: "target", position: "left" },
      { type: "source", position: "right" },
    ],
    attributes: [
      {
        type: "text",
        key: "label",
        label: "Label",
        defaultValue: "Conversion",
        required: true,
      },
      {
        type: "select",
        key: "column",
        label: "Column",
        description: "The column this conversion is applied to.",
        defaultValue: CONVERSION_COLUMNS[0].value,
        options: CONVERSION_COLUMNS,
        required: true,
      },
      {
        type: "select",
        key: "preset",
        label: "Conversion",
        description: "Pick a preset to prefill the expression below.",
        defaultValue: CONVERSION_PRESETS[0].value,
        options: CONVERSION_PRESETS.map((preset) => ({
          value: preset.value,
          label: preset.label,
        })),
        required: true,
      },
      {
        type: "textarea",
        key: "expression",
        label: "Expression",
        description: "Generated from the preset — edit freely to customize it.",
        defaultValue: buildConversionExpression(
          CONVERSION_PRESETS[0].value,
          CONVERSION_COLUMNS[0].value,
        ),
        placeholder: "e.g. UPPER(column)",
        required: true,
      },
    ],
  },
  document: {
    title: "Document",
    icon: "document",
    colorClassName: "border-indigo-500/30 bg-indigo-500/8 text-indigo-900",
    handles: [{ type: "target", position: "left" }],
    attributes: [
      {
        type: "text",
        key: "label",
        label: "Label",
        defaultValue: "Document",
        required: true,
      },
      {
        type: "textarea",
        key: "template",
        label: "Template",
        description:
          "Typst markup. Use {{column}} placeholders — e.g. {{name}} — to insert each row's values.",
        defaultValue: DEFAULT_DOCUMENT_TEMPLATE,
        placeholder: "= {{name}}",
        required: true,
      },
      {
        type: "select",
        key: "format",
        label: "Format",
        description: "Saved with the workflow — applied when generating documents.",
        defaultValue: DOCUMENT_FORMATS[0].value,
        options: DOCUMENT_FORMATS,
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
