"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScriptSnippet } from "@/components/ui/script-snippet";
import { createApiKey, revokeApiKey } from "@/actions/api-keys";

type KeyInfo = { id: string; prefix: string; createdAt: string };

export function ApiKeyManager({
  projectId,
  appUrl,
  keys,
}: {
  projectId: string;
  appUrl: string;
  keys: KeyInfo[];
}) {
  const [newKey, setNewKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    setCreating(true);
    try {
      const result = await createApiKey(projectId);
      setNewKey(result.rawKey);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      {newKey && (
        <div className="space-y-3">
          <p className="text-sm font-medium">
            Paste this snippet before the closing <code>&lt;/body&gt;</code> tag on your site:
          </p>
          <ScriptSnippet appUrl={appUrl} apiKey={newKey} />
          <p className="text-xs text-muted">
            Save this key — it won&apos;t be shown again.
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleCreate} disabled={creating}>
          {creating ? "Creating..." : "Create API Key"}
        </Button>
      </div>

      {keys.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="pb-3 font-medium">Key</th>
              <th className="pb-3 font-medium">Created</th>
              <th className="pb-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.id} className="border-b border-border">
                <td className="py-3 font-mono text-xs">{key.prefix}...</td>
                <td className="py-3 text-muted">
                  {new Date(key.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 text-right">
                  <Button
                    variant="danger"
                    onClick={() => revokeApiKey(key.id, projectId)}
                  >
                    Revoke
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
