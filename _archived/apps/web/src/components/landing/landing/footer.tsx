"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { GithubFill, SunFill, MoonFill } from "@mingcute/react";

export function Footer() {
  const { resolvedTheme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentTheme = resolvedTheme ?? "dark";

  return (
    <div className="flex items-center justify-between shrink-0 pl-2">
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-medium tracking-[-0.56px] leading-none text-foreground/25 underline decoration-dotted decoration-2 underline-offset-4 transition-opacity hover:opacity-80 cursor-pointer">
          v0.1.0
        </span>
        <a
          href="https://github.com/prtk-s/remediate"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground/25 transition-opacity hover:opacity-80"
        >
          <GithubFill size={16} />
        </a>
        <button
          onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
          className="text-foreground/25 transition-opacity hover:opacity-80 cursor-pointer"
        >
          {!isMounted || currentTheme === "dark" ? <SunFill size={16} /> : <MoonFill size={16} />}
        </button>
      </div>
      <div className="flex items-start gap-4 text-[20px] font-medium tracking-[-0.8px] text-foreground/50">
        <Link href="/docs" className="transition-opacity hover:opacity-80">
          docs
        </Link>
        <Link href="/pricing" className="transition-opacity hover:opacity-80">
          pricing
        </Link>
        <Link href="/support" className="transition-opacity hover:opacity-80">
          support
        </Link>
      </div>
    </div>
  );
}
