"use client";

import { forwardRef } from "react";

interface SectionProps {
  title: string;
  isActive: boolean;
  children: React.ReactNode;
}

export const Section = forwardRef<HTMLDivElement, SectionProps>(
  function Section({ title, isActive, children }, ref) {
    return (
      <div
        ref={ref}
        className={`flex flex-col gap-6 transition-colors duration-300 ${isActive ? "section-active" : ""}`}
      >
        <div className="flex flex-col gap-4">
          <p className={`text-[24px] font-medium tracking-[-0.96px] leading-none transition-colors duration-300 ${isActive ? "text-foreground" : "text-foreground/10"}`}>
            {title}
          </p>
          <div className="h-px w-full bg-foreground/10" />
        </div>
        <div className={`text-[20px] font-medium tracking-[-0.8px] leading-[1.35] transition-colors duration-300 ${isActive ? "text-foreground/50" : "text-foreground/10"}`}>
          {children}
        </div>
      </div>
    );
  }
);
