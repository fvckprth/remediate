"use client";

import { useState, type ReactNode } from "react";

export function ChecklistItem({ children }: { children: ReactNode }) {
  const [checked, setChecked] = useState(false);

  return (
    <label className="flex items-start gap-3 py-3 cursor-pointer group">
      <div className="shrink-0 mt-0.5">
        <div
          className={`size-5 rounded border transition-colors ${
            checked
              ? "bg-[#406DFF] border-[#406DFF]"
              : "border-foreground/20 group-hover:border-foreground/40"
          } flex items-center justify-center`}
        >
          {checked && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => setChecked(!checked)}
          className="sr-only"
        />
      </div>
      <span className={`text-sm font-medium tracking-[-0.28px] leading-[1.5] transition-colors ${checked ? "text-foreground/25 line-through" : "text-foreground/50"}`}>
        {children}
      </span>
    </label>
  );
}

export function Checklist({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col divide-y divide-foreground/5">
      {children}
    </div>
  );
}
