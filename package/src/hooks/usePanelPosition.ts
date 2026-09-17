import { useRef, type RefObject } from "react";
import { useViewportTick } from "./useViewportTick";
import type { PanelAnchor } from "../state/panel-layout";

const BAR_HEIGHT = 40;
const GAP = 4;
const PADDING = 20;

interface PanelPosition { top?: number; bottom?: number; left?: number; right?: number }

/**
 * Where the panel host sits relative to the bar. Reads the DOM live on every
 * render (and on each viewport tick) so it tracks resize, zoom and drag without
 * cached state. Values are frozen while no panel is open so exits don't shift.
 */
export function usePanelPosition({
  panelKey,
  panelWidth,
  barRef,
  anchor,
}: {
  panelKey: string | null;
  panelWidth: number;
  barRef: RefObject<HTMLDivElement | null>;
  anchor: PanelAnchor | null;
}) {
  useViewportTick();

  const last = useRef<{ position: PanelPosition; below: boolean }>({ position: { bottom: 72, right: 20 }, below: false });

  if (panelKey !== null && typeof window !== "undefined") {
    const barRect = barRef.current?.getBoundingClientRect() ?? null;
    const anchorEl = anchor
      ? barRef.current?.querySelector<HTMLElement>(`[data-rm-anchor="${anchor}"]`) ?? null
      : null;
    const anchorRect = anchorEl?.getBoundingClientRect() ?? null;

    let left = barRect ? barRect.left : window.innerWidth - PADDING - panelWidth;
    if (anchorRect) {
      const desired = anchorRect.left + anchorRect.width / 2 - panelWidth / 2;
      left = Math.max(PADDING, Math.min(window.innerWidth - panelWidth - PADDING, desired));
    }

    const below = barRect ? barRect.top < window.innerHeight / 2 : false;
    const position: PanelPosition = barRect
      ? below
        ? { top: barRect.top + BAR_HEIGHT + GAP, left }
        : { bottom: window.innerHeight - barRect.top + GAP, left }
      : { bottom: 72, right: 20 };

    last.current = { position, below };
  }

  return { panelPosition: last.current.position, panelBelow: last.current.below };
}
