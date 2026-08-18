<script lang="ts">
  import { onMount } from "svelte";
  import type { AnnotationItem } from "../../types";
  import AnnotationBadge from "./AnnotationBadge.svelte";
  import MarkerTooltip from "./MarkerTooltip.svelte";

  interface Props {
    annotations: AnnotationItem[];
    markerColor: string;
    activePopoverAnnotationId: string | null;
    onBadgeClick: (id: string) => void;
  }
  let { annotations, markerColor, activePopoverAnnotationId, onBadgeClick }: Props = $props();

  let rects = $state<Map<string, DOMRect>>(new Map());
  let hoveredId = $state<string | null>(null);

  function recalcRects() {
    const next = new Map<string, DOMRect>();
    for (const ann of annotations) {
      try {
        const el = document.querySelector(ann.element.selector);
        if (el) next.set(ann.id, el.getBoundingClientRect());
      } catch {
        /* selector may no longer match */
      }
    }
    rects = next;
  }

  // Recalculate whenever the annotation set changes (mirrors the React deps).
  $effect(() => {
    void annotations;
    recalcRects();
  });

  onMount(() => {
    const onScroll = () => recalcRects();
    const onResize = () => recalcRects();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  });

  const hoveredAnn = $derived(hoveredId ? annotations.find((a) => a.id === hoveredId) : null);
  const hoveredRect = $derived(hoveredId ? rects.get(hoveredId) : null);
</script>

{#if annotations.length > 0}
  <div data-remediate-widget="">
    {#each annotations as ann (ann.id)}
      {@const rect = rects.get(ann.id)}
      {#if rect}
        {@const offset = ann.clickOffset ?? { x: rect.width - 3, y: -8 }}
        <div
          data-remediate-widget=""
          role="presentation"
          onmouseenter={() => (hoveredId = ann.id)}
          onmouseleave={() => (hoveredId = null)}
        >
          <AnnotationBadge
            index={ann.index}
            {rect}
            clickOffset={offset}
            color={markerColor}
            onClick={() => onBadgeClick(ann.id === activePopoverAnnotationId ? "" : ann.id)}
          />
        </div>
      {/if}
    {/each}

    {#if hoveredAnn && hoveredRect && hoveredAnn.note && hoveredId !== activePopoverAnnotationId}
      <MarkerTooltip
        descriptor={hoveredAnn.element.name}
        note={hoveredAnn.note}
        top={hoveredRect.top + (hoveredAnn.clickOffset?.y ?? 0) + 16}
        left={hoveredRect.left + (hoveredAnn.clickOffset?.x ?? 0) - 11}
      />
    {/if}
  </div>
{/if}
