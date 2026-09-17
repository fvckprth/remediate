/** True when the OS asks for reduced motion. Safe to call during render (SSR returns false). */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
