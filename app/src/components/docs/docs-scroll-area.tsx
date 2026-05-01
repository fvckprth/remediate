"use client";

import { useRef, useEffect, useState, useCallback, type ReactNode } from "react";

export function DocsScrollArea({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [atBottom, setAtBottom] = useState(false);
  const [atTop, setAtTop] = useState(true);

  const check = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtTop(el.scrollTop < 20);
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 20);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    check();
    el.addEventListener("scroll", check, { passive: true });

    const ro = new ResizeObserver(check);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", check);
      ro.disconnect();
    };
  }, [check]);

  const maskStyle = (() => {
    if (atTop && atBottom) return undefined;
    const top = atTop ? "black" : "transparent";
    const topEnd = atTop ? "black" : "black";
    const botStart = atBottom ? "black" : "black";
    const bot = atBottom ? "black" : "transparent";
    const mask = `linear-gradient(to bottom, ${top} 0%, ${topEnd} 80px, ${botStart} calc(100% - 80px), ${bot} 100%)`;
    return {
      maskImage: mask,
      WebkitMaskImage: mask,
      transition: "mask-image 300ms ease, -webkit-mask-image 300ms ease",
    } as React.CSSProperties;
  })();

  return (
    <main
      ref={ref}
      className="flex-1 min-w-0 overflow-y-auto landing-scroll flex flex-col"
      style={maskStyle}
    >
      {children}
    </main>
  );
}
