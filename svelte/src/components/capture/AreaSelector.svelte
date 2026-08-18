<script lang="ts">
  interface Props {
    onSelect: (area: { x: number; y: number; width: number; height: number }) => void;
    onCancel: () => void;
  }
  let { onSelect, onCancel }: Props = $props();

  interface DragState {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  }

  function toRect(drag: DragState) {
    const x = Math.min(drag.startX, drag.currentX);
    const y = Math.min(drag.startY, drag.currentY);
    const width = Math.abs(drag.currentX - drag.startX);
    const height = Math.abs(drag.currentY - drag.startY);
    return { x, y, width, height };
  }

  let drag = $state<DragState | null>(null);

  function handleMouseDown(e: MouseEvent) {
    drag = { startX: e.clientX, startY: e.clientY, currentX: e.clientX, currentY: e.clientY };
  }

  function handleMouseMove(e: MouseEvent) {
    if (!drag) return;
    drag = { ...drag, currentX: e.clientX, currentY: e.clientY };
  }

  function handleMouseUp() {
    if (!drag) return;
    const r = toRect(drag);
    if (r.width < 10 || r.height < 10) {
      drag = null;
      return;
    }
    drag = null;
    onSelect(r);
  }

  function handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    const t = e.touches[0];
    drag = { startX: t.clientX, startY: t.clientY, currentX: t.clientX, currentY: t.clientY };
  }

  function handleTouchMove(e: TouchEvent) {
    if (!drag) return;
    const t = e.touches[0];
    drag = { ...drag, currentX: t.clientX, currentY: t.clientY };
  }

  function handleTouchEnd() {
    if (!drag) return;
    const r = toRect(drag);
    if (r.width < 10 || r.height < 10) {
      drag = null;
      return;
    }
    drag = null;
    onSelect(r);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      drag = null;
      onCancel();
    }
  }

  const rect = $derived(drag ? toRect(drag) : null);

  const clipPath = $derived(
    rect
      ? `polygon(
        0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
        ${rect.x}px ${rect.y}px,
        ${rect.x}px ${rect.y + rect.height}px,
        ${rect.x + rect.width}px ${rect.y + rect.height}px,
        ${rect.x + rect.width}px ${rect.y}px,
        ${rect.x}px ${rect.y}px
      )`
      : "",
  );
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="rm-area-selector"
  onmousedown={handleMouseDown}
  onmousemove={handleMouseMove}
  onmouseup={handleMouseUp}
  ontouchstart={handleTouchStart}
  ontouchmove={handleTouchMove}
  ontouchend={handleTouchEnd}
  onkeydown={handleKeyDown}
  tabindex={0}
  role="application"
  aria-label="Select capture area"
  data-remediate-widget=""
>
  {#if rect && rect.width > 0 && rect.height > 0}
    <div class="rm-area-selector__dim" style:clip-path={clipPath}></div>

    <div
      class="rm-area-selector__rect"
      style:left="{rect.x}px"
      style:top="{rect.y}px"
      style:width="{rect.width}px"
      style:height="{rect.height}px"
    >
      <span class="rm-area-selector__size">
        {Math.round(rect.width)} × {Math.round(rect.height)}
      </span>
    </div>
  {/if}
</div>
