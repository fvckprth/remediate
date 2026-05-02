"use client";

import { useState, useEffect, useId, type ReactNode } from "react";
import { DownFill } from "@mingcute/react";

interface FaqItemProps {
  question: string;
  children: ReactNode;
}

export function FaqItem({ question, children }: FaqItemProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  // Close when another FaqItem opens
  useEffect(() => {
    function handleOtherOpen(e: Event) {
      if ((e as CustomEvent).detail !== id) setOpen(false);
    }
    window.addEventListener("faq-open", handleOtherOpen);
    return () => window.removeEventListener("faq-open", handleOtherOpen);
  }, [id]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      window.dispatchEvent(new CustomEvent("faq-open", { detail: id }));
    }
  }

  return (
    <div
      className="border-b border-foreground/5 last:border-b-0 faq-item transition-[filter,opacity] duration-300"
      data-open={open || undefined}
    >
      <button
        onClick={toggle}
        className="flex items-center justify-between w-full py-4 text-left cursor-pointer group"
      >
        <span className="text-sm font-bold tracking-tight leading-none text-foreground/75 transition-colors duration-150 group-hover:text-foreground">
          {question}
        </span>
        <DownFill
          size={16}
          className={`shrink-0 text-foreground/25 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className={`pb-4 text-sm font-medium tracking-[-0.28px] leading-[1.5] text-foreground/50 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
