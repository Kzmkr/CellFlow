"use client";

import { useEffect, useState } from "react";

import { FileDownIcon, Loader2Icon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useFlowStore } from "@/lib/flow-store";
import { useNodeAttributeStore } from "@/lib/node-attribute-store";
import {
  buildConversionExpression,
  getDefaultValues,
  getNodeDefinition,
} from "@/lib/node-registry";
import { DEMO_ROWS } from "@/lib/demo-data";
import { renderTemplate } from "@/lib/document-template";
import { compileTypstToPdf, compileTypstToSvg, TypstCompileError } from "@/lib/typst";

const stats = [
  { label: "Rows", value: "2k" },
  { label: "Columns", value: "13" },
];

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug : "document";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function generateDocumentsForRows(
  template: string,
  format: string,
  baseName: string,
): Promise<{ succeeded: number; failed: Array<{ rowId: number; message: string }> }> {
  const failed: Array<{ rowId: number; message: string }> = [];
  let succeeded = 0;

  for (const row of DEMO_ROWS) {
    const source = renderTemplate(template, row);
    try {
      if (format === "svg") {
        const svg = await compileTypstToSvg(source);
        downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `${baseName}-${row.id}.svg`);
      } else {
        const pdf = await compileTypstToPdf(source);
        downloadBlob(
          new Blob([new Uint8Array(pdf)], { type: "application/pdf" }),
          `${baseName}-${row.id}.pdf`,
        );
      }
      succeeded += 1;
    } catch (error) {
      const message =
        error instanceof TypstCompileError ? error.message : "Failed to compile document.";
      failed.push({ rowId: row.id, message });
    }
  }

  return { succeeded, failed };
}

export function PropertiesPanel() {
  const selectedNodeId = useFlowStore((state) => state.selectedNodeId);
  const selectedNode = useFlowStore((state) =>
    state.nodes.find((node) => node.id === state.selectedNodeId),
  );

  const nodeValues = useNodeAttributeStore((state) => state.nodeValues);
  const ensureNodeDefaults = useNodeAttributeStore(
    (state) => state.ensureNodeDefaults,
  );
  const setNodeValue = useNodeAttributeStore((state) => state.setNodeValue);
  const getNodeErrors = useNodeAttributeStore((state) => state.getNodeErrors);

  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!selectedNodeId || !selectedNode) {
      return;
    }
    ensureNodeDefaults(selectedNodeId, selectedNode.data.kind);
  }, [selectedNodeId, selectedNode, ensureNodeDefaults]);

  if (!selectedNodeId || !selectedNode) {
    return (
      <div className="flex h-full flex-col bg-muted/50 p-4">
        <h2 className="mb-4 text-lg font-semibold">Properties</h2>
        <Empty className="border-border/70 bg-background/70">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SparklesIcon />
            </EmptyMedia>
            <EmptyTitle>Select a node</EmptyTitle>
            <EmptyDescription>
              Click a node on the canvas to edit its attributes.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const definition = getNodeDefinition(selectedNode.data.kind);
  const values = nodeValues[selectedNodeId] ?? getDefaultValues(selectedNode.data.kind);
  const errors = getNodeErrors(selectedNodeId, selectedNode.data.kind);

  const outputTypeValue = String(values.outputType ?? "db");
  const isDbOutputNode = selectedNode.data.kind === "dbOutput";
  const targetOptionsByType: Record<"db" | "file", string[]> = {
    db: ["mysql", "postgres"],
    file: ["json", "csv", "parquet"],
  };
  const isConversionNode = selectedNode.data.kind === "conversion";
  const isDocumentNode = selectedNode.data.kind === "document";

  async function handleGenerateDocuments() {
    const template = String(values.template ?? "");
    const format = String(values.format ?? "pdf");
    const baseName = slugify(String(values.label ?? "document"));

    if (template.trim().length === 0) {
      toast.error("Add a template before generating documents.");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading(`Generating ${DEMO_ROWS.length} documents…`);
    try {
      const { succeeded, failed } = await generateDocumentsForRows(template, format, baseName);
      if (failed.length === 0) {
        toast.success(`Generated ${succeeded} document${succeeded === 1 ? "" : "s"}.`, {
          id: toastId,
        });
      } else if (succeeded === 0) {
        toast.error(`Failed to generate documents: ${failed[0].message}`, { id: toastId });
      } else {
        toast.warning(
          `Generated ${succeeded} document${succeeded === 1 ? "" : "s"}, ${failed.length} failed.`,
          { id: toastId },
        );
      }
    } catch {
      toast.error("Couldn't generate documents. Please try again.", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-muted/50 p-4">
      <div className="mb-3">
        <h2 className="text-lg font-semibold">{definition.title}</h2>
        <p className="text-xs text-muted-foreground">Node ID: {selectedNodeId}</p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-2">
            <span className="font-medium text-foreground">{stat.label}:</span>
            <span className="font-semibold tabular-nums">{stat.value}</span>
          </div>
        ))}
      </div>

      <Separator className="mb-4" />

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <FieldGroup>
          {definition.attributes.map((field) => {
            const fieldId = `${selectedNodeId}-${field.key}`;
            const currentValue = values[field.key] ?? field.defaultValue;
            const error = errors[field.key];

            if (field.type === "toggle") {
              return (
                <Field key={field.key} orientation="horizontal" data-invalid={Boolean(error)}>
                  <div className="flex flex-col gap-1">
                    <FieldLabel htmlFor={fieldId}>{field.label}</FieldLabel>
                    {field.description ? (
                      <FieldDescription>{field.description}</FieldDescription>
                    ) : null}
                    {error ? <FieldError>{error}</FieldError> : null}
                  </div>
                  <Switch
                    id={fieldId}
                    checked={Boolean(currentValue)}
                    onCheckedChange={(checked) => {
                      setNodeValue(selectedNodeId, selectedNode.data.kind, field.key, checked);
                    }}
                  />
                </Field>
              );
            }

            if (field.type === "select") {
              let selectOptions = field.options;

              if (isDbOutputNode && field.key === "target") {
                const allowedOptions = new Set<string>(
                  targetOptionsByType[outputTypeValue === "file" ? "file" : "db"],
                );
                selectOptions = field.options.filter((option) => allowedOptions.has(option.value));
              }

              return (
                <Field key={field.key} data-invalid={Boolean(error)}>
                  <FieldLabel htmlFor={fieldId}>{field.label}</FieldLabel>
                  <Select
                    value={String(currentValue)}
                    onValueChange={(value) => {
                      setNodeValue(selectedNodeId, selectedNode.data.kind, field.key, value);

                      if (isDbOutputNode && field.key === "outputType") {
                        const allowedTargets = targetOptionsByType[value === "file" ? "file" : "db"];
                        const currentTarget = String(values.target ?? "");
                        if (!allowedTargets.includes(currentTarget)) {
                          setNodeValue(selectedNodeId, selectedNode.data.kind, "target", allowedTargets[0]);
                        }
                      }

                      if (isConversionNode && (field.key === "preset" || field.key === "column")) {
                        const nextPreset = field.key === "preset" ? value : String(values.preset ?? "");
                        const nextColumn = field.key === "column" ? value : String(values.column ?? "");
                        // "Custom" means the expression is fully hand-owned: selecting it
                        // (or changing the column while it's active) never overwrites
                        // whatever the user already typed.
                        if (nextPreset !== "custom") {
                          setNodeValue(
                            selectedNodeId,
                            selectedNode.data.kind,
                            "expression",
                            buildConversionExpression(nextPreset, nextColumn),
                          );
                        }
                      }
                    }}
                  >
                    <SelectTrigger id={fieldId} aria-invalid={Boolean(error)}>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {selectOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {field.description ? (
                    <FieldDescription>{field.description}</FieldDescription>
                  ) : null}
                  {error ? <FieldError>{error}</FieldError> : null}
                </Field>
              );
            }

            if (field.type === "slider") {
              return (
                <Field key={field.key} data-invalid={Boolean(error)}>
                  <div className="flex items-center justify-between gap-3">
                    <FieldLabel htmlFor={fieldId}>{field.label}</FieldLabel>
                    <span className="text-xs text-muted-foreground">{Number(currentValue)}</span>
                  </div>
                  <Slider
                    id={fieldId}
                    value={[Number(currentValue)]}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    onValueChange={(nextValue) => {
                      setNodeValue(selectedNodeId, selectedNode.data.kind, field.key, nextValue[0] ?? field.defaultValue);
                    }}
                  />
                  {field.description ? (
                    <FieldDescription>{field.description}</FieldDescription>
                  ) : null}
                  {error ? <FieldError>{error}</FieldError> : null}
                </Field>
              );
            }

            if (field.type === "file") {
              const fileInputId = `${fieldId}-file`;

              return (
                <Field key={field.key} data-invalid={Boolean(error)}>
                  <FieldLabel htmlFor={fieldId}>{field.label}</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id={fieldId}
                      aria-invalid={Boolean(error)}
                      value={String(currentValue)}
                      onChange={(event) => {
                        setNodeValue(selectedNodeId, selectedNode.data.kind, field.key, event.target.value);
                      }}
                      placeholder={field.placeholder}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        onClick={() => document.getElementById(fileInputId)?.click()}
                      >
                        Browse
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  <input
                    id={fileInputId}
                    type="file"
                    className="sr-only"
                    accept={field.accept}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        setNodeValue(selectedNodeId, selectedNode.data.kind, field.key, file.name);
                      }
                    }}
                  />
                  {field.description ? (
                    <FieldDescription>{field.description}</FieldDescription>
                  ) : null}
                  {error ? <FieldError>{error}</FieldError> : null}
                </Field>
              );
            }

            if (field.type === "textarea") {
              return (
                <Field key={field.key} data-invalid={Boolean(error)}>
                  <FieldLabel htmlFor={fieldId}>{field.label}</FieldLabel>
                  <Textarea
                    id={fieldId}
                    aria-invalid={Boolean(error)}
                    value={String(currentValue)}
                    onChange={(event) => {
                      setNodeValue(selectedNodeId, selectedNode.data.kind, field.key, event.target.value);
                    }}
                    placeholder={field.placeholder}
                    className="min-h-28 font-mono text-sm"
                  />
                  {field.description ? (
                    <FieldDescription>{field.description}</FieldDescription>
                  ) : null}
                  {error ? <FieldError>{error}</FieldError> : null}
                </Field>
              );
            }

            if (field.type === "number") {
              return (
                <Field key={field.key} data-invalid={Boolean(error)}>
                  <FieldLabel htmlFor={fieldId}>{field.label}</FieldLabel>
                  <Input
                    id={fieldId}
                    type="number"
                    aria-invalid={Boolean(error)}
                    value={Number(currentValue)}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    onChange={(event) => {
                      setNodeValue(selectedNodeId, selectedNode.data.kind, field.key, Number(event.target.value));
                    }}
                  />
                  {field.description ? (
                    <FieldDescription>{field.description}</FieldDescription>
                  ) : null}
                  {error ? <FieldError>{error}</FieldError> : null}
                </Field>
              );
            }

            if (field.type === "text") {
              return (
                <Field key={field.key} data-invalid={Boolean(error)}>
                  <FieldLabel htmlFor={fieldId}>{field.label}</FieldLabel>
                  <Input
                    id={fieldId}
                    type="text"
                    aria-invalid={Boolean(error)}
                    value={String(currentValue)}
                    onChange={(event) => {
                      setNodeValue(selectedNodeId, selectedNode.data.kind, field.key, event.target.value);
                    }}
                    placeholder={field.placeholder}
                  />
                  {field.description ? (
                    <FieldDescription>{field.description}</FieldDescription>
                  ) : null}
                  {error ? <FieldError>{error}</FieldError> : null}
                </Field>
              );
            }

            return null;
          })}
        </FieldGroup>

        {isDocumentNode ? (
          <div className="mt-4 border-t pt-4">
            <Button
              className="w-full"
              onClick={handleGenerateDocuments}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2Icon className="animate-spin" data-icon="inline-start" />
              ) : (
                <FileDownIcon data-icon="inline-start" />
              )}
              {isGenerating ? "Generating…" : `Generate ${DEMO_ROWS.length} Documents`}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Compiles the template with Typst (WASM) once per row and downloads each result.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
