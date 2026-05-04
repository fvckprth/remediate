import { useRef, type RefObject } from "react";
import { useViewportTick } from "./useViewportTick";

const BAR_HEIGHT = 40;
const GAP = 4;
const PADDING = 20;

export function usePanelPosition({
  panelKey,
  panelWidth,
  barRef,
  anchorAriaLabel,
}: {
  panelKey: string | null;
  panelWidth: number;
  barRef: RefObject<HTMLDivElement | null>;
  anchorAriaLabel: string | null;
}) {
  // Re-render whenever the viewport changes so the live DOM reads below
  // pick up the new bar / button positions on the same tick as innerHeight.
  useViewportTick();

  const isBrowser = typeof window !== "undefined";

  // Live read — same tick as window.innerHeight, no cached state to go stale.
  const barRect = isBrowser ? barRef.current?.getBoundingClientRect() ?? null : null;
  const anchorBtn = isBrowser && anchorAriaLabel
    ? (document.querySelector(
        `[data-remediate-widget] button[aria-label="${anchorAriaLabel}"]`
      ) as HTMLElement | null)
    : null;
  const anchorRect = anchorBtn ? anchorBtn.getBoundingClientRect() : null;

  let panelLeft = barRect ? barRect.left : (isBrowser ? window.innerWidth - 20 - panelWidth : 0);

  if (anchorRect && isBrowser) {
    const desiredLeft = (anchorRect.left + anchorRect.width / 2) - (panelWidth / 2);
    panelLeft = Math.max(PADDING, Math.min(window.innerWidth - panelWidth - PADDING, desiredLeft));
  }

  const panelBelow = barRect ? barRect.top < window.innerHeight / 2 : false;

  const panelPosition = barRect
    ? panelBelow
      ? { top: barRect.top + BAR_HEIGHT + GAP, left: panelLeft }
      : { bottom: isBrowser ? window.innerHeight - barRect.top + GAP : 0, left: panelLeft }
    : { bottom: 72, right: 20 }; // Default when bar isn't measured yet

  // Freeze panel position, direction & width during exit so panels don't shift while fading out
  const lastPanelPosition = useRef(panelPosition);
  const lastPanelBelow = useRef(panelBelow);
  const lastPanelWidth = useRef(panelWidth);
  if (panelKey !== null) {
    lastPanelPosition.current = panelPosition;
    lastPanelBelow.current = panelBelow;
    lastPanelWidth.current = panelWidth;
  }

  return {
    panelWidth: lastPanelWidth.current,
    panelPosition: lastPanelPosition.current,
    panelBelow: lastPanelBelow.current,
  };
}
