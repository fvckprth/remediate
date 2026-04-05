"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  children: string;
  /** Language hint. Stored but not used until syntax highlighting lands. */
  language?: string;
}

export function CodeBlock({ children, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="my-6 rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-[12px] font-medium tracking-[-0.48px] text-foreground/40 uppercase">
          {language ?? "code"}
        </span>
        <Button
          variant="ghost"
          onClick={handleCopy}
          className="h-7 px-2 py-0 text-[12px]"
        >
          {copied ? "copied" : "copy"}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 text-[14px] font-mono leading-[1.6] text-foreground">
        <code>{children}</code>
      </pre>
    </div>
  );
}
