export const API =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "https://cellflow-backend.kozma-kristof14.workers.dev"

console.log("[api] VITE_API_URL=", import.meta.env.VITE_API_URL, "→ using", API)

export async function getCsrfToken(): Promise<string> {
  const res = await fetch(`${API}/api/auth/csrf`, { credentials: "include" })
  const { csrfToken } = (await res.json()) as { csrfToken: string }
  return csrfToken
}

// Workflow types
export type WorkflowSummary = {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export type Workflow = {
  id: string
  name: string
  nodes: unknown
  edges: unknown
  node_values: unknown
  created_at: string
  updated_at: string
}

export type WorkflowPayload = {
  name: string
  nodes: unknown
  edges: unknown
  node_values: unknown
}

// Workflow API
export async function listWorkflows(): Promise<WorkflowSummary[]> {
  const res = await fetch(`${API}/api/workflows`, { credentials: "include" })
  if (!res.ok) throw new Error(`Failed to list workflows: ${res.status}`)
  const data = (await res.json()) as { workflows: WorkflowSummary[] }
  return data.workflows
}

export async function getWorkflow(id: string): Promise<Workflow> {
  const res = await fetch(`${API}/api/workflows/${id}`, { credentials: "include" })
  if (!res.ok) throw new Error(`Failed to get workflow: ${res.status}`)
  const data = (await res.json()) as { workflow: Workflow }
  return data.workflow
}

export async function createWorkflow(payload: WorkflowPayload): Promise<WorkflowSummary> {
  const res = await fetch(`${API}/api/workflows`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Failed to create workflow: ${res.status}`)
  const data = (await res.json()) as { workflow: WorkflowSummary }
  return data.workflow
}

export async function updateWorkflow(id: string, payload: Partial<WorkflowPayload>): Promise<void> {
  const res = await fetch(`${API}/api/workflows/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Failed to update workflow: ${res.status}`)
}

export async function deleteWorkflow(id: string): Promise<void> {
  const res = await fetch(`${API}/api/workflows/${id}`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!res.ok) throw new Error(`Failed to delete workflow: ${res.status}`)
}
