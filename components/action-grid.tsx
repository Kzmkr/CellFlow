"use client"

import { Download, Upload, GitMerge, Database, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"

const actions = [
  {
    label: "Input",
    icon: Download,
  },
  {
    label: "Output",
    icon: Upload,
  },
  {
    label: "Join",
    icon: GitMerge,
  },
  {
    label: "SQL",
    icon: Database,
  },
  {
    label: "Filter",
    icon: Filter,
  },
]

export function ActionGrid() {
  return (
    <div className="flex h-full flex-col p-4">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">Actions</h3>
      <div className="grid grid-cols-2 gap-3 flex-1 content-start">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="flex h-20 flex-col items-center justify-center gap-2"
          >
            <action.icon className="h-6 w-6" />
            <span className="text-sm font-medium">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
