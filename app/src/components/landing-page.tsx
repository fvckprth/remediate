"use client";

import { DocsNav } from "@/components/docs/docs-nav";
import { HeroSection } from "@/components/hero-section";
import { BrowserMockup } from "@/components/browser-mockup";

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
          href="https://withparth.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground/50 underline decoration-dotted underline-offset-2 transition-colors hover:text-foreground/70"
        >
          Parth Patel
        </a>
      </p>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="h-screen overflow-hidden">
      {/* Nav — pinned top-left */}
      <div className="fixed top-10 left-10 z-30 h-[calc(100vh-80px)]">
        <DocsNav />
      </div>

      {/* Content */}
      <div className="h-full flex items-center justify-center p-10">
        <div className="flex gap-20 w-full max-w-3xl h-full">
          <div className="shrink-0 w-[120px]" />

          <div className="flex flex-col flex-1 min-w-0 h-full justify-between">
            {/* Hero — top */}
            <FadeIn delay={0}>
              <HeroSection />
            </FadeIn>

            {/* Mockup — scales to fit remaining space */}
            <div className="flex-1 min-h-0 flex items-center justify-center py-6">
              <FadeIn delay={200} className="h-full flex justify-center">
                <div className="h-full max-w-[840px]" style={{ aspectRatio: "16 / 10" }}>
                  <BrowserMockup />
                </div>
              </FadeIn>
            </div>

            {/* Footer — bottom */}
            <FadeIn delay={400}>
              <Footer />
            </FadeIn>
          </div>
        </div>
      </div>
    </div>
  );
}
