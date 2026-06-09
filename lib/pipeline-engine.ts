import { Edge } from "@xyflow/react";
import { RegistryFlowNode } from "@/lib/flow-store";
import { NodeValues } from "@/lib/node-registry";
import {
  initDuckDB,
  query,
  insertCSVFromString,
  insertJSONFromString,
  createOrReplaceTable,
} from "@/lib/duckdb";

export type PipelineResult = {
  success: boolean;
  rows: Record<string, unknown>[];
  columns: string[];
  error?: string;
  logs: string[];
};

function topologicalSort(
  nodes: RegistryFlowNode[],
  edges: Edge[]
): RegistryFlowNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of nodes) {
    adj.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    const from = edge.source;
    const to = edge.target;
    if (adj.has(from) && adj.has(to)) {
      adj.get(from)!.push(to);
      inDegree.set(to, (inDegree.get(to) ?? 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const sorted: RegistryFlowNode[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const node = nodeMap.get(id);
    if (node) sorted.push(node);

    for (const neighbor of adj.get(id) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  if (sorted.length !== nodes.length) {
    throw new Error("Cycle detected in workflow graph");
  }

  return sorted;
}

function getPredecessors(nodeId: string, edges: Edge[]): string[] {
  return edges
    .filter((e) => e.target === nodeId)
    .map((e) => e.source);
}

function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/**
 * Render a user-supplied value as a SQL literal. Numeric strings are emitted
 * bare; everything else is single-quoted and escaped.
 */
function toSqlLiteral(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed !== "" && !Number.isNaN(Number(trimmed))) {
    return trimmed;
  }
  return `'${trimmed.replace(/'/g, "''")}'`;
}

/**
 * Build a SQL WHERE clause for the Filter mode of a transform node.
 */
function buildFilterClause(values: NodeValues): string | null {
  const column = String(values.filterColumn ?? "").trim();
  if (!column) {
    return null;
  }

  const operator = String(values.filterOperator ?? "eq");
  const col = quoteIdentifier(column);
  const value = String(values.filterValue ?? "");

  switch (operator) {
    case "neq":
      return `${col} <> ${toSqlLiteral(value)}`;
    case "gt":
      return `${col} > ${toSqlLiteral(value)}`;
    case "gte":
      return `${col} >= ${toSqlLiteral(value)}`;
    case "lt":
      return `${col} < ${toSqlLiteral(value)}`;
    case "lte":
      return `${col} <= ${toSqlLiteral(value)}`;
    case "between": {
      const upper = String(values.filterValueTo ?? "");
      return `${col} BETWEEN ${toSqlLiteral(value)} AND ${toSqlLiteral(upper)}`;
    }
    case "contains":
      return `${col} LIKE ${toSqlLiteral(`%${value}%`)}`;
    case "eq":
    default:
      return `${col} = ${toSqlLiteral(value)}`;
  }
}

/**
 * Collect the target node plus every node it (transitively) depends on.
 * Used to run the pipeline only up to a selected node.
 */
function collectAncestors(targetId: string, edges: Edge[]): Set<string> {
  const included = new Set<string>([targetId]);
  const stack = [targetId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const pred of getPredecessors(current, edges)) {
      if (!included.has(pred)) {
        included.add(pred);
        stack.push(pred);
      }
    }
  }
  return included;
}

export async function runPipeline(
  nodes: RegistryFlowNode[],
  edges: Edge[],
  nodeValues: Record<string, NodeValues>,
  fileMap?: Record<string, File>,
  targetNodeId?: string | null
): Promise<PipelineResult> {
  const logs: string[] = [];

  try {
    await initDuckDB();
  } catch (err) {
    return {
      success: false,
      rows: [],
      columns: [],
      error: `Failed to initialize DuckDB: ${(err as Error).message}`,
      logs,
    };
  }

  if (nodes.length === 0) {
    return { success: true, rows: [], columns: [], logs };
  }

  let sorted: RegistryFlowNode[];
  try {
    sorted = topologicalSort(nodes, edges);
  } catch (err) {
    return {
      success: false,
      rows: [],
      columns: [],
      error: (err as Error).message,
      logs,
    };
  }

  // When a target node is selected, run only the subgraph that feeds it so the
  // preview reflects that node's state.
  if (targetNodeId) {
    if (!nodes.some((n) => n.id === targetNodeId)) {
      return {
        success: false,
        rows: [],
        columns: [],
        error: `Selected node ${targetNodeId} is not part of the workflow.`,
        logs,
      };
    }
    const included = collectAncestors(targetNodeId, edges);
    sorted = sorted.filter((node) => included.has(node.id));
  }

  const resultTableByNode = new Map<string, string>();

  for (const node of sorted) {
    const values = nodeValues[node.id] ?? {};
    const tableName = `node_${node.id}`;

    try {
      if (node.data.kind === "fileInput") {
        const source = String(values.source ?? "").trim();
        if (!source) {
          logs.push(`[${node.id}] fileInput: no source provided`);
          return {
            success: false,
            rows: [],
            columns: [],
            error: `File Input node ${node.id} has no source configured. Please set a file URL or upload a file in the Properties panel.`,
            logs,
          };
        }

        const file = fileMap?.[node.id];
        if (file) {
          const text = await file.text();
          if (file.name.endsWith(".csv")) {
            await insertCSVFromString(tableName, text);
          } else if (file.name.endsWith(".json")) {
            await insertJSONFromString(tableName, text);
          } else {
            await insertCSVFromString(tableName, text);
          }
          logs.push(`[${node.id}] fileInput: loaded ${file.name}`);
        } else if (source.startsWith("http")) {
          const res = await fetch(source);
          const text = await res.text();
          if (source.endsWith(".json")) {
            await insertJSONFromString(tableName, text);
          } else {
            await insertCSVFromString(tableName, text);
          }
          logs.push(`[${node.id}] fileInput: fetched ${source}`);
        } else {
          logs.push(`[${node.id}] fileInput: no file available for ${source}`);
          return {
            success: false,
            rows: [],
            columns: [],
            error: `File Input node ${node.id} could not load "${source}". Please provide a valid HTTP(S) URL or upload a file.`,
            logs,
          };
        }
        resultTableByNode.set(node.id, tableName);
      }

      if (node.data.kind === "transform") {
        const mode = String(values.mode ?? "sql");
        const preds = getPredecessors(node.id, edges);

        if (mode === "filter") {
          const predTable = preds
            .map((p) => resultTableByNode.get(p))
            .find((table): table is string => Boolean(table));

          if (!predTable) {
            logs.push(`[${node.id}] filter: no input table`);
            return {
              success: false,
              rows: [],
              columns: [],
              error: `Filter node ${node.id} has no valid input. Connect a node that produces data.`,
              logs,
            };
          }

          const clause = buildFilterClause(values);
          const sql = clause
            ? `SELECT * FROM ${predTable} WHERE ${clause}`
            : `SELECT * FROM ${predTable}`;
          await createOrReplaceTable(tableName, sql);
          resultTableByNode.set(node.id, tableName);
          logs.push(
            clause
              ? `[${node.id}] filter: WHERE ${clause}`
              : `[${node.id}] filter: no column selected, passing through`
          );
        } else {
          const script = String(values.script ?? "").trim();
          if (!script) {
            logs.push(`[${node.id}] transform: no script provided`);
            continue;
          }

          let sql = script;
          for (const predId of preds) {
            const predTable = resultTableByNode.get(predId);
            if (predTable) {
              sql = sql.replace(/\binput\b/gi, predTable);
            }
          }

          if (/\binput\b/i.test(sql)) {
            const missing = preds.filter((p) => !resultTableByNode.has(p));
            const reason = missing.length > 0
              ? `missing input data from predecessor(s): ${missing.join(", ")}`
              : "input reference could not be resolved";
            logs.push(`[${node.id}] transform: ${reason}`);
            return {
              success: false,
              rows: [],
              columns: [],
              error: `Transform node ${node.id} has no valid input. Make sure the preceding node(s) executed successfully (${reason}).`,
              logs,
            };
          }

          await createOrReplaceTable(tableName, sql);
          resultTableByNode.set(node.id, tableName);
          logs.push(`[${node.id}] transform: executed SQL`);
        }
      }

      if (node.data.kind === "join") {
        const preds = getPredecessors(node.id, edges);
        if (preds.length < 2) {
          logs.push(`[${node.id}] join: needs 2 inputs, got ${preds.length}`);
          return {
            success: false,
            rows: [],
            columns: [],
            error: `Join node ${node.id} needs exactly 2 input connections, but has ${preds.length}. Please connect 2 nodes to it.`,
            logs,
          };
        }

        const leftTable = resultTableByNode.get(preds[0]);
        const rightTable = resultTableByNode.get(preds[1]);
        if (!leftTable || !rightTable) {
          const missing = [
            !leftTable && `left (${preds[0]})`,
            !rightTable && `right (${preds[1]})`,
          ].filter(Boolean).join(", ");
          logs.push(`[${node.id}] join: missing input tables: ${missing}`);
          return {
            success: false,
            rows: [],
            columns: [],
            error: `Join node ${node.id} is missing input data from: ${missing}. Make sure the connected nodes executed successfully.`,
            logs,
          };
        }

        const joinType = String(values.joinType ?? "inner").toUpperCase();
        const leftKey = String(values.leftKey ?? "id");
        const rightKey = String(values.rightKey ?? "id");

        const joinSQL = `SELECT * FROM ${leftTable} ${joinType} JOIN ${rightTable} ON ${leftTable}.${leftKey} = ${rightTable}.${rightKey}`;
        await createOrReplaceTable(tableName, joinSQL);
        resultTableByNode.set(node.id, tableName);
        logs.push(`[${node.id}] join: ${joinType} JOIN on ${leftKey} = ${rightKey}`);
      }

      if (node.data.kind === "dbOutput") {
        const preds = getPredecessors(node.id, edges);
        const predTable = preds.length > 0 ? resultTableByNode.get(preds[0]) : undefined;
        if (!predTable) {
          logs.push(`[${node.id}] dbOutput: no input table`);
          continue;
        }
        resultTableByNode.set(node.id, predTable);
        logs.push(`[${node.id}] dbOutput: mapped to ${predTable}`);
      }
    } catch (err) {
      logs.push(`[${node.id}] error: ${(err as Error).message}`);
      return {
        success: false,
        rows: [],
        columns: [],
        error: `Node ${node.id} (${node.data.kind}): ${(err as Error).message}`,
        logs,
      };
    }
  }

  // Determine which table to preview. When a node is selected, show its output;
  // otherwise show the last node in topo order that produced a table.
  let finalTable: string | null = null;
  if (targetNodeId) {
    finalTable = resultTableByNode.get(targetNodeId) ?? null;
  } else {
    for (let i = sorted.length - 1; i >= 0; i--) {
      const table = resultTableByNode.get(sorted[i]!.id);
      if (table) {
        finalTable = table;
        break;
      }
    }
  }

  if (!finalTable) {
    return { success: true, rows: [], columns: [], logs };
  }

  try {
    const rows = await query(`SELECT * FROM ${finalTable} LIMIT 1000`);
    let columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    if (columns.length === 0) {
      const described = await query(`DESCRIBE ${finalTable}`);
      columns = described.map((row) => String(row.column_name));
    }
    logs.push(`Pipeline complete: ${rows.length} rows`);
    return { success: true, rows, columns, logs };
  } catch (err) {
    return {
      success: false,
      rows: [],
      columns: [],
      error: `Failed to read output: ${(err as Error).message}`,
      logs,
    };
  }
}

/**
 * Run the pipeline up to a node and return the column names it produces.
 * Used to populate the Filter mode column dropdown from upstream data.
 */
export async function getNodeColumns(
  nodes: RegistryFlowNode[],
  edges: Edge[],
  nodeValues: Record<string, NodeValues>,
  fileMap: Record<string, File> | undefined,
  nodeId: string
): Promise<string[]> {
  const result = await runPipeline(nodes, edges, nodeValues, fileMap, nodeId);
  return result.success ? result.columns : [];
}
