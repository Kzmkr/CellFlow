export const API =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "https://cellflow-backend.kozma-kristof14.workers.dev"

console.log("[api] VITE_API_URL=", import.meta.env.VITE_API_URL, "→ using", API)

export async function getCsrfToken(): Promise<string> {
  const res = await fetch(`${API}/api/auth/csrf`, { credentials: "include" })
  const { csrfToken } = (await res.json()) as { csrfToken: string }
  return csrfToken
}

export type WorkflowNodeValues = Record<string, Record<string, string | number | boolean>>

export type WorkflowData = {
  nodes: unknown[]
  edges: unknown[]
  nodeValues: WorkflowNodeValues
}

export type WorkflowSummary = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export type Workflow = WorkflowSummary & {
  data: WorkflowData
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  })

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = (await res.json()) as { error?: string }
      if (body?.error) message = body.error
    } catch {
      // ignore non-JSON error bodies
    }
    throw new ApiError(res.status, message)
  }

  return res.json() as Promise<T>
}

export async function listWorkflows(): Promise<WorkflowSummary[]> {
  const { workflows } = await apiFetch<{ workflows: WorkflowSummary[] }>(
    "/api/workflows",
  )
  return workflows
}

export async function getWorkflow(id: string): Promise<Workflow> {
  const { workflow } = await apiFetch<{ workflow: Workflow }>(
    `/api/workflows/${id}`,
  )
  return workflow
}

export async function createWorkflow(
  name: string,
  data: WorkflowData,
): Promise<Workflow> {
  const { workflow } = await apiFetch<{ workflow: Workflow }>("/api/workflows", {
    method: "POST",
    body: JSON.stringify({ name, data }),
  })
  return workflow
}

export async function updateWorkflow(
  id: string,
  updates: { name?: string; data?: WorkflowData },
): Promise<Workflow> {
  const { workflow } = await apiFetch<{ workflow: Workflow }>(
    `/api/workflows/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(updates),
    },
  )
  return workflow
}

export async function deleteWorkflow(id: string): Promise<void> {
  await apiFetch<{ success: boolean }>(`/api/workflows/${id}`, {
    method: "DELETE",
  })
}
