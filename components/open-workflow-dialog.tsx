"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listWorkflows, type WorkflowSummary } from "@/lib/api";

export type OpenWorkflowDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
};

export function OpenWorkflowDialog({
  open,
  onOpenChange,
  onSelect,
}: OpenWorkflowDialogProps) {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setSelectedId(null);
    listWorkflows()
      .then(setWorkflows)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [open]);

  function handleOpen() {
    if (selectedId) {
      onSelect(selectedId);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Open Workflow</DialogTitle>
          <DialogDescription>
            Select a saved workflow to load into the current tab.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!loading && !error && workflows.length === 0 && (
            <p className="text-sm text-muted-foreground">No saved workflows found.</p>
          )}
          {!loading && !error && workflows.length > 0 && (
            <div className="max-h-64 overflow-auto rounded-md border">
              {workflows.map((wf) => (
                <button
                  key={wf.id}
                  type="button"
                  onClick={() => setSelectedId(wf.id)}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-muted ${
                    selectedId === wf.id ? "bg-muted font-medium" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{wf.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(wf.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleOpen} disabled={!selectedId}>
            Open
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
