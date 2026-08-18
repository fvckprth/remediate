export interface ScrolledAncestor {
  el: HTMLElement;
  scrollTop: number;
  scrollLeft: number;
}

function isScrollable(el: Element): boolean {
  if (el === document.documentElement || el === document.body) return false;
  const style = getComputedStyle(el);
  const oy = style.overflowY;
  const ox = style.overflowX;
  const scrollableY = (oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight;
  const scrollableX = (ox === "auto" || ox === "scroll") && el.scrollWidth > el.clientWidth;
  return scrollableY || scrollableX;
}

/**
 * Walk the ancestor chain of `start` and return every scrollable element with a
 * non-zero scroll offset. Used to resolve viewport coordinates to document space
 * on pages with nested scroll containers (e.g. an `overflow:auto` `<main>` inside
 * an `overflow:hidden` body).
 */
export function findScrolledAncestors(start: Element): ScrolledAncestor[] {
  const out: ScrolledAncestor[] = [];
  let cursor: Element | null = start;
  while (cursor && cursor !== document.documentElement) {
    if (isScrollable(cursor) && (cursor.scrollTop !== 0 || cursor.scrollLeft !== 0)) {
      out.push({
        el: cursor as HTMLElement,
        scrollTop: cursor.scrollTop,
        scrollLeft: cursor.scrollLeft,
      });
    }
    cursor = cursor.parentElement;
  }
  return out;
}

/**
 * Cumulative document-space offset for `start`: window scroll plus every nested
 * scrollable ancestor's scroll position. Add to a viewport-relative coordinate
 * (e.g. from `getBoundingClientRect()`) to get a stable document-space coordinate.
 */
export function getDocumentOffset(start: Element): { x: number; y: number } {
  return findScrolledAncestors(start).reduce(
    (acc, s) => ({ x: acc.x + s.scrollLeft, y: acc.y + s.scrollTop }),
    { x: window.scrollX, y: window.scrollY },
  );
}
