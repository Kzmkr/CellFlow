"use client"

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export function PropertiesPanel() {
  return (
    <div className="flex h-full flex-col p-4 bg-muted/50">
      <h2 className="text-lg font-semibold mb-4">Properties</h2>
      <div className="flex flex-col gap-2 flex-1">
        <Label htmlFor="sql-query">SQL Query</Label>
        <Textarea
          id="sql-query"
          placeholder="SELECT * FROM users WHERE..."
          className="flex-1 resize-none font-mono text-sm"
        />
      </div>
    </div>
  )
}
