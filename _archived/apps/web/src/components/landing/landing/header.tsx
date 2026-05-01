"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Copy2Fill, CheckFill } from "@mingcute/react";
import { Logo } from "@/components/logo";

function NpmBadge() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    navigator.clipboard.writeText("npm install remediate");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);

  return (
    <button
      onClick={copy}
      className="flex w-fit h-8 items-center gap-2.5 rounded-lg bg-foreground/5 px-2 pr-2.5 cursor-pointer transition-colors hover:bg-foreground/10"
    >
      <span className="text-[20px] font-medium tracking-[-0.8px] text-foreground/25">
        npm install remediate
      </span>
      <span className="relative shrink-0 size-4">
        <Copy2Fill
          size={16}
          className="absolute inset-0 text-foreground/25 transition-all duration-200 ease-out"
          style={{
            opacity: copied ? 0 : 1,
            transform: copied ? "scale(0.8)" : "scale(1)",
          }}
        />
        <CheckFill
          size={16}
          className="absolute inset-0 text-foreground/25 transition-all duration-200 ease-out"
          style={{
            opacity: copied ? 1 : 0,
            transform: copied ? "scale(1)" : "scale(0.8)",
          }}
        />
      </span>
    </button>
  );
}

export function Header() {
  return (
    <div className="flex flex-col gap-6 shrink-0">
      <div className="flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="flex h-8 items-center justify-center rounded-full bg-[#406dff] px-3 text-[16px] font-medium tracking-[-0.64px] text-[#e7e7e7] transition-opacity hover:opacity-90"
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="flex h-8 items-center justify-center rounded-full bg-foreground/25 px-3 text-[16px] font-medium tracking-[-0.64px] text-[#e7e7e7] transition-opacity hover:opacity-90"
          >
            Get Started
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-[20px] font-bold tracking-[-0.8px] leading-none text-foreground">
          remediate
        </p>
        <p className="text-[20px] font-medium tracking-[-0.8px] leading-none text-foreground/50">
          make it easy to collect honest feedback
        </p>
      </div>
      <NpmBadge />
    </div>
  );
}
