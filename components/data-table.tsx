import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const data = [
  { id: 1, name: "John Doe", email: "john@example.com", status: "Active", role: "Admin" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", status: "Active", role: "User" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", status: "Inactive", role: "User" },
  { id: 4, name: "Alice Brown", email: "alice@example.com", status: "Active", role: "Editor" },
  { id: 5, name: "Charlie Wilson", email: "charlie@example.com", status: "Pending", role: "User" },
  { id: 6, name: "Diana Lee", email: "diana@example.com", status: "Active", role: "Admin" },
]

export function DataTable() {
  return (
    <div className="h-full overflow-auto p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.id}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    row.status === "Active"
                      ? "default"
                      : row.status === "Inactive"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {row.status}
                </Badge>
              </TableCell>
              <TableCell>{row.role}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
