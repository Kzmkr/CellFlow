"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createWorkflow, updateWorkflow } from "@/lib/api";

export type SaveWorkflowDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string | null;
  defaultName: string;
  nodes: unknown;
  edges: unknown;
  nodeValues: unknown;
  onSaved?: (id: string, name: string) => void;
};

export function SaveWorkflowDialog({
  open,
  onOpenChange,
  workflowId,
  defaultName,
  nodes,
  edges,
  nodeValues,
  onSaved,
}: SaveWorkflowDialogProps) {
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (workflowId) {
        await updateWorkflow(workflowId, {
          name: name.trim(),
          nodes,
          edges,
          node_values: nodeValues,
        });
        onSaved?.(workflowId, name.trim());
      } else {
        const result = await createWorkflow({
          name: name.trim(),
          nodes,
          edges,
          node_values: nodeValues,
        });
        onSaved?.(result.id, name.trim());
      }
      onOpenChange(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Workflow</DialogTitle>
          <DialogDescription>
            {workflowId ? "Update your workflow." : "Save the current workflow to your account."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="workflow-name">Name</Label>
            <Input
              id="workflow-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Workflow"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : workflowId ? "Update" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
