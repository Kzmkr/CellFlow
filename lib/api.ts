export const API =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "https://cellflow-backend.kozma-kristof14.workers.dev"

console.log("[api] VITE_API_URL=", import.meta.env.VITE_API_URL, "→ using", API)

export async function getCsrfToken(): Promise<string> {
  const res = await fetch(`${API}/api/auth/csrf`, { credentials: "include" })
  const { csrfToken } = (await res.json()) as { csrfToken: string }
  return csrfToken
}
