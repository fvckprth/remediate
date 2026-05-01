"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteProject } from "@/actions/projects";

export function DeleteProjectButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button variant="danger" onClick={() => setConfirming(true)}>
        Delete project
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-red-500/30 p-4 space-y-3">
      <p className="text-sm">
        Are you sure you want to delete <strong>{projectName}</strong>? This
        will permanently remove all feedback and API keys.
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
        <Button variant="danger" onClick={() => deleteProject(projectId)}>
          Yes, delete
        </Button>
      </div>
    </div>
  );
}
