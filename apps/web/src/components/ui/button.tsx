"use client";

import { Button as BaseButton } from "@base-ui-components/react/button";
import { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary:
    "bg-foreground text-background hover:opacity-90 active:opacity-80",
  secondary:
    "border border-border text-foreground hover:bg-surface active:bg-border",
  ghost:
    "text-muted hover:text-foreground hover:bg-surface",
  danger:
    "border border-red-500/30 text-red-400 hover:bg-red-500/10",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof BaseButton> & { variant?: Variant }) {
  return (
    <BaseButton
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 cursor-pointer ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
