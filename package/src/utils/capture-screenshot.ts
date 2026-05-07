import { toBlob } from "html-to-image";
import type { SelectionArea } from "../types";
import { findScrolledAncestors, type ScrolledAncestor } from "./viewport-offset";

interface FrozenScroll {
  el: HTMLElement;
  origScrollTop: number;
  origScrollLeft: number;
  child: HTMLElement | null;
  childPriorTransform: string;
  childPriorWillChange: string;
}

function findUnderlyingElement(viewportX: number, viewportY: number): Element {
  // The Remediate area-selector overlay covers the viewport during capture, so a
  // plain elementFromPoint would return it. Walk elementsFromPoint and skip any
  // widget elements to find the underlying page element.
  const stack = document.elementsFromPoint(viewportX, viewportY);
  for (const el of stack) {
    if (el.closest("[data-remediate-widget]")) continue;
    return el;
  }
  return document.body;
}

function freezeScrolls(scrollables: ScrolledAncestor[]): FrozenScroll[] {
  const frozen: FrozenScroll[] = [];
  for (const s of scrollables) {
    const child = (s.el.firstElementChild as HTMLElement | null) ?? null;
    const frame: FrozenScroll = {
      el: s.el,
      origScrollTop: s.scrollTop,
      origScrollLeft: s.scrollLeft,
      child,
      childPriorTransform: child?.style.transform ?? "",
      childPriorWillChange: child?.style.willChange ?? "",
    };
    if (child) {
      child.style.transform = `translate(${-s.scrollLeft}px, ${-s.scrollTop}px) ${frame.childPriorTransform}`.trim();
      child.style.willChange = "transform";
    }
    s.el.scrollTop = 0;
    s.el.scrollLeft = 0;
    frozen.push(frame);
  }
  return frozen;
}

function unfreezeScrolls(frozen: FrozenScroll[]): void {
  for (const frame of frozen) {
    frame.el.scrollTop = frame.origScrollTop;
    frame.el.scrollLeft = frame.origScrollLeft;
    if (frame.child) {
      frame.child.style.transform = frame.childPriorTransform;
      frame.child.style.willChange = frame.childPriorWillChange;
    }
  }
}

export async function captureScreenshot(area: SelectionArea): Promise<Blob | null> {
  const cx = area.x + area.width / 2;
  const cy = area.y + area.height / 2;
  const underlying = findUnderlyingElement(cx, cy);
  const scrollables = findScrolledAncestors(underlying);
  const frozen = freezeScrolls(scrollables);
  if (frozen.length > 0) {
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
  }

  try {
    // The freeze synchronously rewrites every nested scrollable to scrollTop=0 and
    // applies a CSS transform on its first child equal to the original scrollTop.
    // Visually the page is unchanged. html-to-image then clones the DOM and the
    // cloned tree renders the user-visible content because the scroll state is
    // baked into transforms (which cloneCSSStyle preserves) instead of the
    // non-cloneable scrollTop. We translate the cloned <html> by the area's
    // viewport origin so the rendered canvas crops to the requested region.
    const blob = await toBlob(document.documentElement, {
      width: area.width,
      height: area.height,
      canvasWidth: area.width,
      canvasHeight: area.height,
      pixelRatio: window.devicePixelRatio,
      style: {
        transform: `translate(-${area.x + window.scrollX}px, -${area.y + window.scrollY}px)`,
        transformOrigin: "top left",
      },
      filter: (node: HTMLElement) => {
        if (node?.hasAttribute?.("data-remediate-widget")) {
          return false;
        }
        return true;
      },
    });
    return blob;
  } catch (err) {
    console.warn("[Remediate] Screenshot capture failed:", err);
    return null;
  } finally {
    unfreezeScrolls(frozen);
  }
}
