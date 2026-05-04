import { useRef } from "react";

const BAR_HEIGHT = 40;
const GAP = 2;
const PADDING = 20;

export function usePanelPosition({
  panelKey,
  panelWidth,
  barPosition,
  anchorX,
}: {
  panelKey: string | null;
  panelWidth: number;
  barPosition: { x: number; y: number } | null;
  anchorX: number | null;
}) {
  // Calculate position centered on the triggering button, clamped to viewport
  const isBrowser = typeof window !== "undefined";
  let panelLeft = barPosition ? barPosition.x : (isBrowser ? window.innerWidth - 20 - panelWidth : 0);

  if (anchorX !== null && isBrowser) {
    const desiredLeft = anchorX - (panelWidth / 2);
    panelLeft = Math.max(PADDING, Math.min(window.innerWidth - panelWidth - PADDING, desiredLeft));
  }

  const panelBelow = barPosition ? barPosition.y < window.innerHeight / 2 : false;

  const panelPosition = barPosition
    ? panelBelow
      ? { top: barPosition.y + BAR_HEIGHT + GAP, left: panelLeft }
      : { bottom: isBrowser ? window.innerHeight - barPosition.y + GAP : 0, left: panelLeft }
    : { bottom: 72, right: 20 }; // Default when no position is set

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
