"use client";

import { ThemeProvider } from "next-themes";
import { GlobalHaptics } from "@/components/global-haptics";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" forcedTheme="dark" disableTransitionOnChange>
      {children}
      <GlobalHaptics />
    </ThemeProvider>
  );
}
