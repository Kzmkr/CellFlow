"use client";

import { useEffect } from "react";

import { SparklesIcon } from "lucide-react";

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
import { getDefaultValues, getNodeDefinition } from "@/lib/node-registry";

const stats = [
  { label: "Rows", value: "2k" },
  { label: "Columns", value: "13" },
];

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
      </div>
    </div>
  );
}
