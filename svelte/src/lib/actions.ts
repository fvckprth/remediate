/** Report an element's border-box size on mount and on every resize. */
export function measure(
  node: HTMLElement,
  cb: (width: number, height: number) => void,
) {
  let current = cb;
  const report = () => current(node.offsetWidth, node.offsetHeight);
  const ro = new ResizeObserver(report);
  ro.observe(node);
  report();
  return {
    update(next: (width: number, height: number) => void) {
      current = next;
    },
    destroy() {
      ro.disconnect();
    },
  };
}

/** Move a node to a target container (default document.body) — a portal. */
export function portal(node: HTMLElement, target: HTMLElement | string = document.body) {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  el?.appendChild(node);
  return {
    destroy() {
      node.remove();
    },
  };
}
