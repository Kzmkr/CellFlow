import {
  createContext,
  createElement,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";

import {
  getDefaultValues,
  getNodeDefinition,
  type NodeField,
  type NodeKind,
  type NodeValues,
} from "@/lib/node-registry";

type AttributeState = {
  nodeValues: Record<string, NodeValues>;
  ensureNodeDefaults: (nodeId: string, kind: NodeKind) => void;
  setNodeValue: (
    nodeId: string,
    kind: NodeKind,
    key: string,
    value: string | number | boolean,
  ) => void;
  getNodeErrors: (nodeId: string, kind: NodeKind) => Record<string, string>;
};

export type NodeAttributeStore = StoreApi<AttributeState>;

function clampNumber(value: number, min?: number, max?: number): number {
  if (Number.isNaN(value)) {
    return min ?? 0;
  }

  let normalized = value;
  if (typeof min === "number") {
    normalized = Math.max(min, normalized);
  }
  if (typeof max === "number") {
    normalized = Math.min(max, normalized);
  }
  return normalized;
}

function normalizeValue(
  field: NodeField,
  value: string | number | boolean,
): string | number | boolean {
  switch (field.type) {
    case "text":
    case "file":
    case "textarea":
      return String(value);
    case "toggle":
      return Boolean(value);
    case "number":
    case "slider": {
      const numeric = typeof value === "number" ? value : Number(value);
      return clampNumber(numeric, field.min, field.max);
    }
    case "select": {
      const stringValue = String(value);
      const isValid = field.options.some(
        (option) => option.value === stringValue,
      );
      return isValid ? stringValue : field.defaultValue;
    }
    default:
      return value;
  }
}

function fieldHasError(field: NodeField, value: unknown): string | null {
  if (field.required) {
    if (typeof value === "string" && value.trim().length === 0) {
      return "Required field";
    }
    if (value == null) {
      return "Required field";
    }
  }

  return null;
}

export function createNodeAttributeStore(): NodeAttributeStore {
  return createStore<AttributeState>((set, get) => ({
    nodeValues: {},
    ensureNodeDefaults: (nodeId, kind) => {
      set((state) => {
        if (state.nodeValues[nodeId]) {
          return state;
        }

        return {
          nodeValues: {
            ...state.nodeValues,
            [nodeId]: getDefaultValues(kind),
          },
        };
      });
    },
    setNodeValue: (nodeId, kind, key, value) => {
      const definition = getNodeDefinition(kind);
      const field = definition.attributes.find((item) => item.key === key);
      if (!field) {
        return;
      }

      set((state) => ({
        nodeValues: {
          ...state.nodeValues,
          [nodeId]: {
            ...(state.nodeValues[nodeId] ?? getDefaultValues(kind)),
            [key]: normalizeValue(field, value),
          },
        },
      }));
    },
    getNodeErrors: (nodeId, kind) => {
      const definition = getNodeDefinition(kind);
      const values = get().nodeValues[nodeId] ?? getDefaultValues(kind);

      return definition.attributes.reduce<Record<string, string>>(
        (acc, field) => {
          const maybeError = fieldHasError(field, values[field.key]);
          if (maybeError) {
            acc[field.key] = maybeError;
          }
          return acc;
        },
        {},
      );
    },
  }));
}

const NodeAttributeStoreContext = createContext<NodeAttributeStore | null>(
  null,
);

export function NodeAttributeStoreProvider({
  children,
}: {
  children: ReactNode;
}) {
  const storeRef = useRef<NodeAttributeStore | null>(null);
  if (storeRef.current == null) {
    storeRef.current = createNodeAttributeStore();
  }

  return createElement(
    NodeAttributeStoreContext.Provider,
    { value: storeRef.current },
    children,
  );
}

export function useNodeAttributeStore<T>(
  selector: (state: AttributeState) => T,
): T {
  const store = useContext(NodeAttributeStoreContext);
  if (!store) {
    throw new Error(
      "useNodeAttributeStore must be used within a NodeAttributeStoreProvider",
    );
  }

  return useStore(store, selector);
}
