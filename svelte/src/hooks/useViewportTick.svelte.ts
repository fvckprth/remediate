/**
 * Bumps a counter on every viewport change (window resize, visual viewport
 * resize from pinch-zoom, or document element resize). Consumers read `.tick`
 * inside a reactive context ($derived) so anything computed from the live DOM
 * recomputes on the same tick as the resize event.
 */
export function createViewportTick() {
  let tick = $state(0);

  function install(): () => void {
    if (typeof window === "undefined") return () => {};
    const bump = () => { tick += 1; };

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
  }

  return {
    get tick() { return tick; },
    install,
  };
}

export type ViewportTick = ReturnType<typeof createViewportTick>;
