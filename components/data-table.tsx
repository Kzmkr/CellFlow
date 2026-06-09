import { PlayIcon, SnowflakeIcon } from "lucide-react"

import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export type DataTableProps = {
  data: Record<string, unknown>[]
  columns: string[]
  frozen?: boolean
  onToggleFreeze?: () => void
}

export function DataTable({ data, columns, frozen, onToggleFreeze }: DataTableProps) {
  const toolbar = onToggleFreeze ? (
    <div className="flex items-center justify-between gap-2 border-b px-4 py-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground tabular-nums">{data.length}</span>
        <span>rows</span>
        {frozen ? (
          <Badge variant="secondary" className="gap-1">
            <SnowflakeIcon className="size-3" />
            Frozen
          </Badge>
        ) : null}
      </div>
      <Button
        size="sm"
        variant={frozen ? "default" : "outline"}
        onClick={onToggleFreeze}
      >
        {frozen ? (
          <>
            <PlayIcon data-icon="inline-start" />
            Resume
          </>
        ) : (
          <>
            <SnowflakeIcon data-icon="inline-start" />
            Freeze
          </>
        )}
      </Button>
    </div>
  ) : null

  if (columns.length === 0) {
    return (
      <div className="flex h-full flex-col">
        {toolbar}
        <div className="flex flex-1 items-center justify-center p-4 text-sm text-muted-foreground">
          No data to display. Run the pipeline to see results.
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {toolbar}
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col}>{col}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i}>
                {columns.map((col) => {
                  const val = row[col]
                  const str = val == null ? "" : String(val)
                  const isBoolean = typeof val === "boolean"
                  const boolLabel = isBoolean ? (val ? "true" : "false") : str

                  return (
                    <TableCell key={col} className="font-medium">
                      {isBoolean ? (
                        <Badge variant={val ? "default" : "secondary"}>{boolLabel}</Badge>
                      ) : (
                        str
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
