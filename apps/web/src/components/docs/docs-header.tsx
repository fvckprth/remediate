"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SunFill, MoonFill } from "@mingcute/react";
import { Logo } from "@/components/logo";

export function DocsHeader() {
  const { resolvedTheme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentTheme = resolvedTheme ?? "dark";

  return (
    <div className="flex items-center justify-between shrink-0">
      <Link href="/" className="flex items-center gap-3 group">
        <Logo className="text-foreground" />
        <span className="text-[20px] font-bold tracking-[-0.8px] leading-none text-foreground">
          remediate
        </span>
        <span className="text-[14px] font-medium tracking-[-0.56px] leading-none text-foreground/25 transition-colors group-hover:text-foreground/50">
          docs
        </span>
      </Link>
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="text-[16px] font-medium tracking-[-0.64px] text-foreground/50 transition-opacity hover:text-foreground"
        >
          ← back to remediate
        </Link>
        <button
          onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
          className="text-foreground/50 transition-opacity hover:text-foreground cursor-pointer"
          aria-label="toggle theme"
        >
          {!isMounted || currentTheme === "dark" ? <SunFill size={18} /> : <MoonFill size={18} />}
        </button>
      </div>
    </div>
  );
}
