"use client";

import { useState } from "react";
import { Copy2Fill, CheckFill } from "@mingcute/react";

const managers = [
  { name: "yarn", command: "yarn add remediate" },
  { name: "pnpm", command: "pnpm add remediate" },
  { name: "bun", command: "bun add remediate" },
];

export function AltInstall() {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function handleCopy(command: string, idx: number) {
    await navigator.clipboard.writeText(command);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <div className="flex gap-1.5 items-center text-sm font-medium tracking-tight">
      <span className="text-foreground/50">or try</span>
      {managers.map((pm, i) => {
        const isCopied = copiedIdx === i;
        return (
          <span key={pm.name} className="flex items-center gap-1">
            <button
              onClick={() => handleCopy(pm.command, i)}
              className="flex items-center gap-1 text-foreground/25 hover:text-foreground/50 transition-colors cursor-pointer"
            >
              {pm.name}
              <span className="relative size-4">
                <span className={`absolute inset-0 flex items-center justify-center transition-all duration-150 ${isCopied ? "opacity-0 scale-75 blur-sm" : "opacity-100 scale-100 blur-0"}`}>
                  <Copy2Fill size={16} />
                </span>
                <span className={`absolute inset-0 flex items-center justify-center transition-all duration-150 ${isCopied ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-125 blur-sm"}`}>
                  <CheckFill size={16} />
                </span>
              </span>
            </button>
            {i < managers.length - 1 && (
              <span className="text-foreground/50">,</span>
            )}
            {i === managers.length - 2 && (
              <span className="text-foreground/50 ml-1">or</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
