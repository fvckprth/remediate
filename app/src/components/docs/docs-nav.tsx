"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";

const navLinks = [
  { label: "overview", href: "/" },
  { label: "install", href: "/docs/install" },
  { label: "recipes", href: "/docs/recipes" },
  { label: "payload", href: "/docs/payload" },
  { label: "privacy", href: "/docs/privacy" },
  { label: "reference", href: "/docs/reference" },
  { label: "faq", href: "/docs/faq" },
];

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M4.68267 1.54C5.18331 1.70959 5.65958 1.94403 6.09933 2.23733C6.72039 2.07861 7.35898 1.99887 8 2C8.662 2 9.30067 2.08267 9.89933 2.23667C10.3389 1.94365 10.815 1.70944 11.3153 1.54C11.78 1.382 12.442 1.126 12.8353 1.56133C13.102 1.85733 13.1687 2.35333 13.216 2.732C13.2693 3.15467 13.282 3.70533 13.142 4.252C13.6773 4.94333 14 5.768 14 6.66667C14 8.028 13.2627 9.21 12.1713 10.0287C11.6461 10.4177 11.0636 10.7227 10.4447 10.9327C10.5873 11.2593 10.6667 11.6207 10.6667 12V14C10.6667 14.1768 10.5964 14.3464 10.4714 14.4714C10.3464 14.5964 10.1768 14.6667 10 14.6667H6C5.82319 14.6667 5.65362 14.5964 5.5286 14.4714C5.40357 14.3464 5.33333 14.1768 5.33333 14V13.3393C4.69667 13.4173 4.16267 13.348 3.70867 13.1553C3.234 12.954 2.90333 12.642 2.65467 12.3433C2.41867 12.0607 2.16133 11.4233 1.78933 11.2993C1.70625 11.2717 1.62943 11.2279 1.56326 11.1706C1.49709 11.1132 1.44286 11.0434 1.40367 10.9651C1.32453 10.8069 1.31146 10.6238 1.36733 10.456C1.42321 10.2882 1.54345 10.1495 1.7016 10.0703C1.85976 9.9912 2.04287 9.97813 2.21067 10.034C2.65467 10.182 2.944 10.502 3.142 10.7593C3.462 11.1727 3.722 11.7127 4.22867 11.928C4.43733 12.0167 4.74333 12.0747 5.222 12.0093L5.33333 11.9867C5.33461 11.6239 5.41016 11.2652 5.55533 10.9327C4.93639 10.7227 4.35387 10.4177 3.82867 10.0287C2.73733 9.21 2 8.02867 2 6.66667C2 5.76933 2.322 4.94533 2.856 4.25467C2.716 3.708 2.728 3.156 2.78133 2.73267L2.78467 2.70733C2.83333 2.31933 2.89 1.86267 3.162 1.56133C3.55533 1.126 4.218 1.38267 4.682 1.54067L4.68267 1.54Z"
        fill="currentColor"
      />
    </svg>
  );
}


export function DocsNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col justify-between shrink-0">
      <div className="flex flex-col gap-8">
        <Link href="/" aria-label="Remediate home">
          <Logo size={64} />
        </Link>
        <nav className="flex flex-col text-base font-medium tracking-tight leading-none">
          <div className="flex flex-col -my-1.5">
            {navLinks.map((link) => {
              const isActive = link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`py-1.5 transition-colors duration-150 ${
                    isActive
                      ? "text-foreground"
                      : "text-foreground/25 hover:text-foreground/50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
      <div className="flex items-center gap-2 h-4 pt-10 text-foreground/50">
        <a
          href="https://www.npmjs.com/package/remediate"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium leading-none tracking-tight underline decoration-dotted underline-offset-2 transition-colors hover:text-foreground/70"
        >
          v0.1.0
        </a>
        <a
          href="https://github.com/fvckprth/remediate"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-foreground/70"
        >
          <GithubIcon />
        </a>
      </div>
    </div>
  );
}
