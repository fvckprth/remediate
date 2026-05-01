"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { highlight } from "sugar-high";
import { Copy2Fill, CheckFill } from "@mingcute/react";

interface CodeBlockProps {
  children: string;
  language?: string;
}

export function CodeBlock({ children, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);
  const [showMask, setShowMask] = useState(false);
  const [showMaskLeft, setShowMaskLeft] = useState(false);
  const isMultiLine = children.includes("\n");

  const isHighlightable = language && ["js", "ts", "tsx", "jsx", "javascript", "typescript"].includes(language);
  const html = isHighlightable ? highlight(children) : null;

  const check = useCallback(() => {
    const el = preRef.current;
    if (!el) return;
    const overflows = el.scrollWidth > el.clientWidth + 4;
    const atStart = el.scrollLeft < 4;
    const atEnd = el.scrollWidth - el.scrollLeft - el.clientWidth < 4;
    setShowMaskLeft(overflows && !atStart);
    setShowMask(overflows && !atEnd);
  }, []);

  useEffect(() => {
    check();
    const el = preRef.current;
    if (!el) return;
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [check]);

  async function handleCopy() {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const maskStyle = (() => {
    if (!showMaskLeft && !showMask) return undefined;
    const left = showMaskLeft ? "transparent 0%, black 32px" : "black 0%";
    const right = showMask ? "black calc(100% - 32px), transparent 100%" : "black 100%";
    const mask = `linear-gradient(to right, ${left}, ${right})`;
    return {
      maskImage: mask,
      WebkitMaskImage: mask,
      transition: "mask-image 300ms ease, -webkit-mask-image 300ms ease",
    } as React.CSSProperties;
  })();

  return (
    <div
      className={`group/code relative flex ${isMultiLine ? "items-start" : "items-center"} justify-between bg-foreground/5 border border-foreground/5 hover:border-foreground/10 transition-colors rounded-lg pl-2 pr-2.5 py-3.5 w-full`}
      style={!isMultiLine ? { height: 32 } : undefined}
    >
      <pre
        ref={preRef}
        className="flex-1 min-w-0 overflow-x-auto landing-scroll font-mono text-xs tracking-tight leading-normal whitespace-pre"
        style={maskStyle}
      >
        {html ? (
          <code dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <code className="text-foreground/50">{children}</code>
        )}
      </pre>
      <button
        onClick={handleCopy}
        aria-label="Copy to clipboard"
        className="relative shrink-0 size-4 text-foreground/25 hover:text-foreground/50 transition-colors cursor-pointer"
      >
        <span
          className={`absolute inset-0 flex items-center justify-center transition-all duration-150 ${
            copied ? "opacity-0 scale-75 blur-sm" : "opacity-100 scale-100 blur-0"
          }`}
        >
          <Copy2Fill size={16} />
        </span>
        <span
          className={`absolute inset-0 flex items-center justify-center transition-all duration-150 ${
            copied ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-125 blur-sm"
          }`}
        >
          <CheckFill size={16} />
        </span>
      </button>
    </div>
  );
}
