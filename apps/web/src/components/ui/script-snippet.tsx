"use client";

import { useState } from "react";
import { Button } from "./button";

export function ScriptSnippet({
  appUrl,
  apiKey,
  keyPlaceholder,
}: {
  appUrl: string;
  apiKey?: string;
  keyPlaceholder?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const keyValue = apiKey ?? (keyPlaceholder ? "YOUR_API_KEY" : "");

  const snippet = `<script src="${appUrl}/widget.js" data-project-key="${keyValue}" data-api-url="${appUrl}"></script>`;

  async function handleCopy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <pre className="text-sm font-mono break-all whitespace-pre-wrap text-foreground">
        {snippet}
      </pre>
      <div className="flex justify-end">
        <Button variant="secondary" onClick={handleCopy}>
          {copied ? "Copied" : "Copy snippet"}
        </Button>
      </div>
    </div>
  );
}
