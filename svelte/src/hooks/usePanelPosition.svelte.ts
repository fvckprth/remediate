import type { ViewportTick } from "./useViewportTick.svelte";

const BAR_HEIGHT = 40;
const GAP = 4;
const PADDING = 20;

export interface PanelPositionArgs {
  panelKey: string | null;
  panelWidth: number;
  barEl: HTMLDivElement | null;
  anchorAriaLabel: string | null;
}

export interface PanelPositionResult {
  panelWidth: number;
  panelPosition: Record<string, number>;
  panelBelow: boolean;
}

/**
 * Reads panel placement live from the DOM each compute — no cached x/y state to
 * go stale on viewport resize / browser zoom. Reading `viewportTick.tick` inside
 * `compute` (called from a $derived) re-runs it on every viewport change.
 * Position, direction and width are frozen while a panel exits (panelKey null).
 */
export function createPanelPositioner(viewportTick: ViewportTick) {
  let lastPanelPosition: Record<string, number> = { bottom: 72, right: 20 };
  let lastPanelBelow = false;
  let lastPanelWidth = 176;

  function compute(args: PanelPositionArgs): PanelPositionResult {
    // Establish the reactive dependency on viewport changes.
    void viewportTick.tick;

    const { panelKey, panelWidth, barEl, anchorAriaLabel } = args;
    const isBrowser = typeof window !== "undefined";

    const barRect = isBrowser ? barEl?.getBoundingClientRect() ?? null : null;
    const anchorBtn =
      isBrowser && anchorAriaLabel
        ? (document.querySelector(
            `[data-remediate-widget] button[aria-label="${anchorAriaLabel}"]`,
          ) as HTMLElement | null)
        : null;
    const anchorRect = anchorBtn ? anchorBtn.getBoundingClientRect() : null;

    let panelLeft = barRect
      ? barRect.left
      : isBrowser
        ? window.innerWidth - 20 - panelWidth
        : 0;

    if (anchorRect && isBrowser) {
      const desiredLeft = anchorRect.left + anchorRect.width / 2 - panelWidth / 2;
      panelLeft = Math.max(
        PADDING,
        Math.min(window.innerWidth - panelWidth - PADDING, desiredLeft),
      );
    }

    const panelBelow = barRect ? barRect.top < window.innerHeight / 2 : false;

    const panelPosition: Record<string, number> = barRect
      ? panelBelow
        ? { top: barRect.top + BAR_HEIGHT + GAP, left: panelLeft }
        : { bottom: isBrowser ? window.innerHeight - barRect.top + GAP : 0, left: panelLeft }
      : { bottom: 72, right: 20 };

    if (panelKey !== null) {
      lastPanelPosition = panelPosition;
      lastPanelBelow = panelBelow;
      lastPanelWidth = panelWidth;
    }

    return {
      panelWidth: lastPanelWidth,
      panelPosition: lastPanelPosition,
      panelBelow: lastPanelBelow,
    };
  }

  return { compute };
}
