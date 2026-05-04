import { useState, useEffect } from "react";

/**
 * Bumps a counter on every viewport change (window resize, visual viewport
 * resize from pinch-zoom, or document element resize). Consumers depend on
 * the counter to force a re-render, so any code reading the live DOM in
 * render gets a chance to recompute.
 *
 * Sync update — no rAF throttle. React batches into the same task as the
 * resize event, so the next paint reflects fresh state without the
 * one-frame jitter a rAF-deferred update would introduce.
 */
export function useViewportTick(): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const bump = () => setTick((t) => t + 1);

    window.addEventListener("resize", bump);
    window.visualViewport?.addEventListener("resize", bump);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && document.documentElement) {
      observer = new ResizeObserver(bump);
      observer.observe(document.documentElement);
    }

    return () => {
      window.removeEventListener("resize", bump);
      window.visualViewport?.removeEventListener("resize", bump);
      observer?.disconnect();
    };
  }, []);

  return tick;
}
