"use client";

import { usePathname } from "next/navigation";

export function DocsFadeIn({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="flex-1 animate-fade-in-blur">
      {children}
    </div>
  );
}
