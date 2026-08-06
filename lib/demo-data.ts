// The single demo dataset shown across the app (data table preview, and any
// node — like Conversion or Document — that operates "per row"). Keeping it
// in one place means every node references the same column keys.
export type DemoRow = {
  id: number
  name: string
  email: string
  status: string
  role: string
}

export const DEMO_ROWS: DemoRow[] = [
  { id: 1, name: "John Doe", email: "john@example.com", status: "Active", role: "Admin" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", status: "Active", role: "User" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", status: "Inactive", role: "User" },
  { id: 4, name: "Alice Brown", email: "alice@example.com", status: "Active", role: "Editor" },
  { id: 5, name: "Charlie Wilson", email: "charlie@example.com", status: "Pending", role: "User" },
  { id: 6, name: "Diana Lee", email: "diana@example.com", status: "Active", role: "Admin" },
]

export const DEMO_ROW_KEYS = ["id", "name", "email", "status", "role"] as const
