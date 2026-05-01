"use client";

import Link from "next/link";
import { SiteShell } from "@/components/site-shell";

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M14.707 5.636L20.364 11.293C20.5515 11.4805 20.6568 11.7348 20.6568 12C20.6568 12.2652 20.5515 12.5195 20.364 12.707L14.707 18.364C14.5184 18.5462 14.2658 18.647 14.0036 18.6447C13.7414 18.6424 13.4906 18.5372 13.3052 18.3518C13.1198 18.1664 13.0146 17.9156 13.0123 17.6534C13.01 17.3912 13.1108 17.1386 13.293 16.95L17.243 13H4C3.73478 13 3.48043 12.8946 3.29289 12.7071C3.10536 12.5196 3 12.2652 3 12C3 11.7348 3.10536 11.4804 3.29289 11.2929C3.48043 11.1054 3.73478 11 4 11H17.243L13.293 7.05C13.1975 6.95775 13.1213 6.84741 13.0689 6.7254C13.0165 6.6034 12.9889 6.47218 12.9877 6.3394C12.9866 6.20662 13.0119 6.07494 13.0622 5.95205C13.1125 5.82915 13.1867 5.7175 13.2806 5.62361C13.3745 5.52971 13.4861 5.45546 13.609 5.40518C13.7319 5.3549 13.8636 5.3296 13.9964 5.33075C14.1292 5.3319 14.2604 5.35949 14.3824 5.4119C14.5044 5.46431 14.6148 5.54049 14.707 5.636Z"
        fill="currentColor"
      />
    </svg>
  );
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div
      className={`animate-fade-in-blur ${className}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      {children}
    </div>
  );
}

function Footer() {
  return (
    <div className="flex items-center text-sm font-medium tracking-tight leading-none text-foreground/25">
      <p>
        Made by{" "}
        <a
          href="https://x.com/prtk_s"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted underline-offset-2 transition-colors hover:text-foreground/50"
        >
          Parth Patel
        </a>
      </p>
    </div>
  );
}

export function LandingPage() {
  return (
    <SiteShell>
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div className="flex flex-col gap-12">
          {/* Hero */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <FadeIn delay={0}>
                <p className="text-base font-medium tracking-tight leading-snug text-foreground">
                  capture feedback where it happens
                </p>
              </FadeIn>
              <FadeIn delay={80}>
                <p className="text-sm font-medium tracking-tight leading-normal text-foreground/50 max-w-sm">
                  remediate is a react component that captures screenshots, video, voice notes, and annotations
                  from your users.
                </p>
              </FadeIn>
            </div>
            <FadeIn delay={160}>
              <Link
                href="/docs/install"
                className="inline-flex items-center gap-1 bg-[#406dff] text-foreground text-base font-medium tracking-tight h-8 pl-3 pr-2 rounded-full w-fit transition-transform duration-200 hover:scale-105"
              >
                Get started
                <ArrowRight className="size-6" />
              </Link>
            </FadeIn>
          </div>

          {/* Mockup placeholder */}
          <FadeIn delay={280}>
            <div className="w-full aspect-[596/350] bg-foreground/5 rounded-2xl" />
          </FadeIn>
        </div>

        <FadeIn delay={400}>
          <Footer />
        </FadeIn>
      </div>
    </SiteShell>
  );
}
