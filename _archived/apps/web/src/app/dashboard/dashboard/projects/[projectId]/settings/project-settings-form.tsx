"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProject } from "@/actions/projects";

export function ProjectSettingsForm({
  projectId,
  name,
  webhookUrl,
}: {
  projectId: string;
  name: string;
  webhookUrl: string;
}) {
  const [, action, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      await updateProject(projectId, formData);
      return { saved: true };
    },
    null
  );

  return (
    <form action={action} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1.5">
          Project name
        </label>
        <Input id="name" name="name" defaultValue={name} required />
      </div>

      <div>
        <label htmlFor="webhookUrl" className="block text-sm font-medium mb-1.5">
          Webhook URL
        </label>
        <Input
          id="webhookUrl"
          name="webhookUrl"
          type="url"
          defaultValue={webhookUrl}
          placeholder="https://hooks.slack.com/... or https://hook.us1.make.com/..."
        />
        <p className="mt-1.5 text-xs text-muted">
          Feedback will be forwarded as a JSON POST to this URL on each submission.
        </p>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
