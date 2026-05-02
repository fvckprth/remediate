"use client";

import { useState, useEffect } from "react";
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

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 6h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M4.68267 1.54C5.18331 1.70959 5.65958 1.94403 6.09933 2.23733C6.72039 2.07861 7.35898 1.99887 8 2C8.662 2 9.30067 2.08267 9.89933 2.23667C10.3389 1.94365 10.815 1.70944 11.3153 1.54C11.78 1.382 12.442 1.126 12.8353 1.56133C13.102 1.85733 13.1687 2.35333 13.216 2.732C13.2693 3.15467 13.282 3.70533 13.142 4.252C13.6773 4.94333 14 5.768 14 6.66667C14 8.028 13.2627 9.21 12.1713 10.0287C11.6461 10.4177 11.0636 10.7227 10.4447 10.9327C10.5873 11.2593 10.6667 11.6207 10.6667 12V14C10.6667 14.1768 10.5964 14.3464 10.4714 14.4714C10.3464 14.5964 10.1768 14.6667 10 14.6667H6C5.82319 14.6667 5.65362 14.5964 5.5286 14.4714C5.40357 14.3464 5.33333 14.1768 5.33333 14V13.3393C4.69667 13.4173 4.16267 13.348 3.70867 13.1553C3.234 12.954 2.90333 12.642 2.65467 12.3433C2.41867 12.0607 2.16133 11.4233 1.78933 11.2993C1.70625 11.2717 1.62943 11.2279 1.56326 11.1706C1.49709 11.1132 1.44286 11.0434 1.40367 10.9651C1.32453 10.8069 1.31146 10.6238 1.36733 10.456C1.42321 10.2882 1.54345 10.1495 1.7016 10.0703C1.85976 9.9912 2.04287 9.97813 2.21067 10.034C2.65467 10.182 2.944 10.502 3.142 10.7593C3.462 11.1727 3.722 11.7127 4.22867 11.928C4.43733 12.0167 4.74333 12.0747 5.222 12.0093L5.33333 11.9867C5.33461 11.6239 5.41016 11.2652 5.55533 10.9327C4.93639 10.7227 4.35387 10.4177 3.82867 10.0287C2.73733 9.21 2 8.02867 2 6.66667C2 5.76933 2.322 4.94533 2.856 4.25467C2.716 3.708 2.728 3.156 2.78133 2.73267L2.78467 2.70733C2.83333 2.31933 2.89 1.86267 3.162 1.56133C3.55533 1.126 4.218 1.38267 4.682 1.54067L4.68267 1.54Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SpotifyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 256 256">
      <path
        d="M128 0C57.308 0 0 57.309 0 128c0 70.696 57.309 128 128 128 70.697 0 128-57.304 128-128C256 57.314 198.697.007 127.998.007l.001-.006Zm58.699 184.614c-2.293 3.76-7.215 4.952-10.975 2.644-30.053-18.357-67.885-22.515-112.44-12.335a7.981 7.981 0 0 1-9.552-6.007 7.968 7.968 0 0 1 6-9.553c48.76-11.14 90.583-6.344 124.323 14.276 3.76 2.308 4.952 7.215 2.644 10.975Zm15.667-34.853c-2.89 4.695-9.034 6.178-13.726 3.289-34.406-21.148-86.853-27.273-127.548-14.92-5.278 1.594-10.852-1.38-12.454-6.649-1.59-5.278 1.386-10.842 6.655-12.446 46.485-14.106 104.275-7.273 143.787 17.007 4.692 2.89 6.175 9.034 3.286 13.72v-.001Zm1.345-36.293C162.457 88.964 94.394 86.71 55.007 98.666c-6.325 1.918-13.014-1.653-14.93-7.978-1.917-6.328 1.65-13.012 7.98-14.935C93.27 62.027 168.434 64.68 215.929 92.876c5.702 3.376 7.566 10.724 4.188 16.405-3.362 5.69-10.73 7.565-16.4 4.187h-.006Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close menu on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Header bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4">
        <Link href="/" aria-label="Remediate home">
          <Logo size={40} />
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="text-foreground/50 hover:text-foreground transition-colors p-1"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Full-screen blur overlay */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-500 ${
          open
            ? "backdrop-blur-2xl bg-black/60 pointer-events-auto"
            : "backdrop-blur-none bg-black/0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      >
        <div
          className="flex flex-col justify-center items-start h-full px-8 pt-16"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Nav links */}
          <nav className="flex flex-col gap-5">
            {navLinks.map((link, i) => {
              const isActive = link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`text-xl font-medium tracking-tight transition-all duration-500 ${
                    open
                      ? "opacity-100 translate-y-0 blur-0"
                      : "opacity-0 translate-y-2 blur-sm"
                  } ${
                    isActive
                      ? "text-foreground"
                      : "text-foreground/40 hover:text-foreground/70"
                  }`}
                  style={{ transitionDelay: open ? `${i * 40}ms` : "0ms" }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div
            className={`flex items-center gap-3 mt-10 text-foreground/50 transition-all duration-500 ${
              open
                ? "opacity-100 translate-y-0 blur-0"
                : "opacity-0 translate-y-2 blur-sm"
            }`}
            style={{ transitionDelay: open ? `${navLinks.length * 40}ms` : "0ms" }}
          >
            <a
              href="https://www.npmjs.com/package/remediate"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium leading-none tracking-tight underline decoration-dotted underline-offset-2 hover:text-foreground/70"
            >
              v0.1.0
            </a>
            <a href="https://github.com/fvckprth/remediate" target="_blank" rel="noopener noreferrer" className="hover:text-foreground/70">
              <GithubIcon />
            </a>
            <a href="https://open.spotify.com/playlist/36RXHjMBMN3vHkm6KQO2O0?si=578ff2bb91c44924" target="_blank" rel="noopener noreferrer" className="hover:text-foreground/70">
              <SpotifyIcon />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
