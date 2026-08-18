<script lang="ts">
  import type { Snippet } from "svelte";
  import { measure } from "../../lib/actions";

  const EXIT_MS = 200; // matches rm-fade-out duration

  interface Position {
    bottom?: number;
    top?: number;
    left?: number;
    right?: number;
  }

  interface Props {
    panelKey: string | null;
    position?: Position;
    below?: boolean;
    pill?: boolean;
    /** Panel content, keyed by panel key so exiting panels keep their identity. */
    children: Snippet<[string]>;
  }
  let { panelKey, position, below = false, pill = false, children }: Props = $props();

  interface PanelItem {
    id: string;
    key: string;
    isExiting: boolean;
  }

  let panels = $state<PanelItem[]>([]);
  let hostBounds = $state({ width: 0, height: 0 });
  let measuredPanelKey = $state<string | null>(panelKey);
  let isSnapping = $state(false);

  // Non-reactive refs (mirror the React useRefs).
  let idCounter = 0;
  let hostBoundsRef = { width: 0, height: 0 };
  let measuredKeyRef: string | null = null;
  let snapTimer: ReturnType<typeof setTimeout> | undefined;
  let prevPosition = position;
  let prevPanelKey: string | null | undefined;

  function handleMeasure(key: string, w: number, h: number) {
    if (!(w > 0 && h > 0)) return;
    const bounds = { width: w, height: h };
    const isNewPanel = key !== measuredKeyRef;

    const apply = () => {
      hostBoundsRef = bounds;
      measuredKeyRef = key;
      hostBounds = bounds;
      measuredPanelKey = key;
    };

    if (!isNewPanel) {
      const prev = hostBoundsRef;
      if (Math.abs(prev.width - bounds.width) < 1 && Math.abs(prev.height - bounds.height) < 1) {
        return;
      }
      isSnapping = true;
      apply();
      if (snapTimer) clearTimeout(snapTimer);
      snapTimer = setTimeout(() => { isSnapping = false; }, 50);
    } else {
      apply();
    }
  }

  // Panel list management — runs on panelKey change (mirrors the React layout effect).
  $effect(() => {
    const k = panelKey;
    if (k === prevPanelKey) return;
    prevPanelKey = k;

    let next = panels.map((p) => (p.isExiting ? p : { ...p, isExiting: true }));
    if (k) {
      idCounter += 1;
      next = [...next, { id: String(idCounter), key: k, isExiting: false }];
    }
    panels = next;
  });

  // Remove exiting panels after their fade-out completes.
  $effect(() => {
    const hasExiting = panels.some((p) => p.isExiting);
    if (!hasExiting) return;
    const isHostExiting = panels.every((p) => p.isExiting);
    const timer = setTimeout(() => {
      panels = panels.filter((p) => !p.isExiting);
      if (isHostExiting) {
        hostBounds = { width: 0, height: 0 };
        hostBoundsRef = { width: 0, height: 0 };
        measuredKeyRef = null;
      }
    }, EXIT_MS);
    return () => clearTimeout(timer);
  });

  $effect(() => () => { if (snapTimer) clearTimeout(snapTimer); });

  const isHostExiting = $derived(panels.length > 0 && panels.every((p) => p.isExiting));

  const activePosition = $derived.by(() => {
    const isHostClosed = hostBounds.width === 0;
    const isWaitingForMeasurement = panelKey !== null && panelKey !== measuredPanelKey;
    const isExiting = panelKey === null && panels.length > 0;
    const shouldUsePrevious = (isWaitingForMeasurement && !isHostClosed) || isExiting;
    if (!shouldUsePrevious) prevPosition = position;
    return shouldUsePrevious ? prevPosition : position;
  });

  const px = (v: number | undefined) => (v != null ? `${v}px` : undefined);
</script>

{#if panels.length > 0}
  <div
    class="rm-panel-host"
    data-exiting={isHostExiting ? "" : undefined}
    data-below={below ? "" : undefined}
    data-pill={pill ? "" : undefined}
    data-snapping={isSnapping ? "" : undefined}
    style:bottom={px(activePosition?.bottom)}
    style:top={px(activePosition?.top)}
    style:left={px(activePosition?.left)}
    style:right={px(activePosition?.right)}
    style:width={hostBounds.width > 0 ? `${hostBounds.width}px` : undefined}
    style:height={hostBounds.height > 0 ? `${hostBounds.height}px` : undefined}
  >
    {#each panels as panel (panel.id)}
      <div class="rm-panel-wrapper" data-exiting={panel.isExiting ? "" : undefined}>
        <div
          style="width: max-content; height: max-content;"
          use:measure={(w, h) => {
            if (panel.isExiting) return;
            handleMeasure(panel.key, w, h);
          }}
        >
          {@render children(panel.key)}
        </div>
      </div>
    {/each}
  </div>
{/if}
