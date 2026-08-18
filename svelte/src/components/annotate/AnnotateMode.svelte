<script lang="ts" module>
  const DRAG_THRESHOLD = 5;
  const MULTI_SELECT_COLOR = "#22c55e";

  const MEANINGFUL_TAGS = new Set([
    "button", "a", "input", "select", "textarea", "img", "video",
    "h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "td", "th", "label",
  ]);

  function isMeaningfulElement(el: HTMLElement): boolean {
    if (MEANINGFUL_TAGS.has(el.tagName.toLowerCase())) return true;
    if (el.getAttribute("role") === "button") return true;
    if (el.hasAttribute("tabindex")) return true;
    const rect = el.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return false;
    if (rect.width > window.innerWidth * 0.8) return false;
    return false;
  }
</script>

<script lang="ts">
  import { onMount } from "svelte";
  import type { AnnotationItem, AnnotationPriority, ElementCapture } from "../../types";
  import { captureElement } from "../../utils/capture";
  import { identifyElement } from "../../utils/element-identify";
  import { nanoid } from "../../utils/nanoid";
  import AnnotationBadge from "./AnnotationBadge.svelte";
  import AnnotationPopover from "./AnnotationPopover.svelte";
  import HighlightOverlay from "../shared/HighlightOverlay.svelte";

  interface PendingElement {
    id: string;
    element: ElementCapture;
    rect: DOMRect;
    domElement: HTMLElement;
    clickOffset: { x: number; y: number };
  }

  interface Props {
    annotations: AnnotationItem[];
    markerColor: string;
    nextIndex: number;
    onAddAnnotation: (annotation: AnnotationItem) => void;
  }
  let { annotations, markerColor, nextIndex, onAddAnnotation }: Props = $props();

  let hoverInfo = $state<{ rect: DOMRect; name: string; domElement: HTMLElement } | null>(null);
  let hoverPos = $state({ x: 0, y: 0 });
  let pendingElements = $state<PendingElement[]>([]);
  let showPopover = $state(false);
  let overlayRef: HTMLDivElement | undefined;
  let popoverRef = $state<AnnotationPopover>();
  let modifiersHeld = { meta: false, shift: false };

  // Drag-to-select state
  let dragStart: { x: number; y: number } | null = null;
  let isDragging = $state(false);
  let dragBox = $state<{ left: number; top: number; width: number; height: number } | null>(null);
  let dragHighlights = $state<DOMRect[]>([]);

  function isWidgetElement(el: Element | null): boolean {
    if (!el) return false;
    let current: Element | null = el;
    while (current) {
      if (current.hasAttribute("data-remediate-widget")) return true;
      if (current.classList?.contains("rm-popover")) return true;
      if (current.classList?.contains("rm-badge")) return true;
      if (current.classList?.contains("rm-toolbar")) return true;
      if (current.classList?.contains("rm-bar")) return true;
      current = current.parentElement;
    }
    return false;
  }

  function getElementAtPoint(x: number, y: number): HTMLElement | null {
    const overlay = overlayRef;
    if (!overlay) return null;
    overlay.style.pointerEvents = "none";
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    overlay.style.pointerEvents = "auto";
    if (!el || el === document.documentElement || el === document.body || isWidgetElement(el)) {
      return null;
    }
    return el;
  }

  onMount(() => {
    function handleKeyDown(e: KeyboardEvent) {
      modifiersHeld = { meta: e.metaKey || e.ctrlKey, shift: e.shiftKey };
    }
    function handleKeyUp(e: KeyboardEvent) {
      const wasBothHeld = modifiersHeld.meta && modifiersHeld.shift;
      modifiersHeld = { meta: e.metaKey || e.ctrlKey, shift: e.shiftKey };
      const nowBothHeld = modifiersHeld.meta && modifiersHeld.shift;

      if (wasBothHeld && !nowBothHeld && pendingElements.length > 0 && !showPopover) {
        showPopover = true;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  });

  function handleMouseMove(e: MouseEvent) {
    if (showPopover || isDragging) return;

    if (dragStart) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      if (dx * dx + dy * dy >= DRAG_THRESHOLD * DRAG_THRESHOLD) {
        isDragging = true;
      }
    }

    if (!dragStart) {
      const el = getElementAtPoint(e.clientX, e.clientY);
      if (el) {
        hoverInfo = { rect: el.getBoundingClientRect(), name: identifyElement(el).name, domElement: el };
        hoverPos = { x: e.clientX, y: e.clientY };
      } else {
        hoverInfo = null;
      }
    }
  }

  function handleDragMove(e: MouseEvent) {
    if (!isDragging || !dragStart) return;

    const left = Math.min(dragStart.x, e.clientX);
    const top = Math.min(dragStart.y, e.clientY);
    const width = Math.abs(e.clientX - dragStart.x);
    const height = Math.abs(e.clientY - dragStart.y);
    dragBox = { left, top, width, height };

    const overlay = overlayRef;
    if (!overlay) return;
    overlay.style.pointerEvents = "none";

    const seen = new Set<HTMLElement>();
    const matched: DOMRect[] = [];
    const points = [
      [left, top], [left + width / 2, top], [left + width, top],
      [left, top + height / 2], [left + width / 2, top + height / 2], [left + width, top + height / 2],
      [left, top + height], [left + width / 2, top + height], [left + width, top + height],
    ];

    for (const [px, py] of points) {
      const el = document.elementFromPoint(px, py) as HTMLElement | null;
      if (el && !seen.has(el) && !isWidgetElement(el) && el !== document.documentElement && el !== document.body) {
        seen.add(el);
        if (isMeaningfulElement(el)) {
          matched.push(el.getBoundingClientRect());
        }
      }
    }

    overlay.style.pointerEvents = "auto";
    dragHighlights = matched;
  }

  function handleMouseDown(e: MouseEvent) {
    if (showPopover) return;
    const tag = (e.target as HTMLElement).tagName;
    if (["P", "SPAN", "H1", "H2", "H3", "H4", "H5", "H6", "A", "LABEL", "LI"].includes(tag)) return;
    dragStart = { x: e.clientX, y: e.clientY };
  }

  function handleMouseUp(e: MouseEvent) {
    if (isDragging && dragStart) {
      const left = Math.min(dragStart.x, e.clientX);
      const top = Math.min(dragStart.y, e.clientY);
      const width = Math.abs(e.clientX - dragStart.x);
      const height = Math.abs(e.clientY - dragStart.y);

      const overlay = overlayRef;
      if (overlay) {
        overlay.style.pointerEvents = "none";

        const seen = new Set<HTMLElement>();
        const elements: PendingElement[] = [];
        const points = [
          [left, top], [left + width / 2, top], [left + width, top],
          [left, top + height / 2], [left + width / 2, top + height / 2], [left + width, top + height / 2],
          [left, top + height], [left + width / 2, top + height], [left + width, top + height],
        ];

        for (const [px, py] of points) {
          const el = document.elementFromPoint(px, py) as HTMLElement | null;
          if (el && !seen.has(el) && !isWidgetElement(el) && el !== document.documentElement && el !== document.body) {
            seen.add(el);
            if (isMeaningfulElement(el)) {
              const elRect = el.getBoundingClientRect();
              elements.push({
                id: `ann_${nanoid(8)}`,
                element: captureElement(el),
                rect: elRect,
                domElement: el,
                clickOffset: { x: elRect.width / 2, y: elRect.height / 2 },
              });
            }
          }
        }

        overlay.style.pointerEvents = "auto";

        if (elements.length > 0) {
          pendingElements = elements;
          showPopover = true;
        }
      }

      isDragging = false;
      dragBox = null;
      dragHighlights = [];
      dragStart = null;
      return;
    }

    dragStart = null;
  }

  function handleClick(e: MouseEvent) {
    if (isDragging) return;

    if (showPopover) {
      popoverRef?.shake();
      return;
    }

    const el = getElementAtPoint(e.clientX, e.clientY);
    if (!el) return;

    const isMultiSelect = (e.metaKey || e.ctrlKey) && e.shiftKey;

    if (isMultiSelect) {
      const existingIdx = pendingElements.findIndex((p) => p.domElement === el);
      if (existingIdx >= 0) {
        pendingElements = pendingElements.filter((_, i) => i !== existingIdx);
      } else {
        const captured = captureElement(el);
        const id = `ann_${nanoid(8)}`;
        const rect = el.getBoundingClientRect();
        const clickOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        pendingElements = [...pendingElements, { id, element: captured, rect, domElement: el, clickOffset }];
      }
      hoverInfo = null;
      return;
    }

    const captured = captureElement(el);
    const id = `ann_${nanoid(8)}`;
    const rect = el.getBoundingClientRect();
    const clickOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    pendingElements = [{ id, element: captured, rect, domElement: el, clickOffset }];
    showPopover = true;
    hoverInfo = null;
  }

  function handleAddPending(note: string, priority: AnnotationPriority) {
    if (pendingElements.length === 0) return;
    let idx = nextIndex;
    for (const pe of pendingElements) {
      const item: AnnotationItem = {
        id: pe.id,
        index: idx++,
        type: "annotation",
        element: pe.element,
        note,
        priority,
        clickOffset: pe.clickOffset,
        timestamp: Date.now(),
        additionalText: "",
      };
      onAddAnnotation(item);
    }
    pendingElements = [];
    showPopover = false;
  }

  function handleCancelPending() {
    pendingElements = [];
    showPopover = false;
  }

  const lastPending = $derived(pendingElements[pendingElements.length - 1] ?? null);
  const popoverAnchorRect = $derived.by(() => {
    if (!lastPending) return null;
    const cx = lastPending.rect.left + lastPending.clickOffset.x;
    const cy = lastPending.rect.top + lastPending.clickOffset.y;
    return new DOMRect(cx - 1, cy - 1, 2, 2);
  });

  const isMulti = $derived(pendingElements.length > 1);
  const pendingColor = $derived(isMulti ? MULTI_SELECT_COLOR : markerColor);

  function isAnnotated(domElement: HTMLElement): boolean {
    return annotations.some((a) => {
      try {
        return domElement.matches(a.element.selector);
      } catch {
        return false;
      }
    });
  }
</script>

<div data-remediate-widget="">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    bind:this={overlayRef}
    class="rm-overlay"
    onmousemove={(e) => { handleMouseMove(e); handleDragMove(e); }}
    onmousedown={handleMouseDown}
    onmouseup={handleMouseUp}
    onclick={handleClick}
  ></div>

  {#if hoverInfo && !showPopover && pendingElements.length === 0 && !isDragging && !isAnnotated(hoverInfo.domElement)}
    <HighlightOverlay rect={hoverInfo.rect} color={markerColor} variant="hover" />
    <div
      class="rm-hover-tooltip"
      data-remediate-widget=""
      style:left="{Math.max(8, Math.min(hoverPos.x, window.innerWidth - 100))}px"
      style:top="{hoverPos.y + 16}px"
    >
      {hoverInfo.name}
    </div>
  {/if}

  {#if isDragging && dragBox}
    <div
      class="rm-drag-selection"
      style:left="{dragBox.left}px"
      style:top="{dragBox.top}px"
      style:width="{dragBox.width}px"
      style:height="{dragBox.height}px"
    ></div>
  {/if}

  {#if isDragging}
    {#each dragHighlights as rect, i (i)}
      <div
        class="rm-drag-highlight"
        style:left="{rect.left}px"
        style:top="{rect.top}px"
        style:width="{rect.width}px"
        style:height="{rect.height}px"
      ></div>
    {/each}
  {/if}

  {#each pendingElements as pe, i (pe.id)}
    {@const showBadge = !isMulti || i === pendingElements.length - 1}
    <div data-remediate-widget="">
      <HighlightOverlay
        rect={pe.rect}
        color={pendingColor}
        variant={isMulti ? "multi-pending" : "persistent"}
      />
      {#if showBadge}
        <AnnotationBadge
          index={nextIndex + i}
          rect={pe.rect}
          clickOffset={pe.clickOffset}
          color={pendingColor}
          onClick={() => {}}
          variant={isMulti ? "multi-pending" : "pending"}
        />
      {/if}
    </div>
  {/each}

  {#if showPopover && popoverAnchorRect && lastPending}
    <AnnotationPopover
      bind:this={popoverRef}
      elementName={isMulti ? `${pendingElements.length} elements` : lastPending.element.name}
      selector={lastPending.element.selector}
      computedStyles={lastPending.element.computedStyles}
      initialNote=""
      initialPriority="none"
      annotationIndex={nextIndex}
      anchorRect={popoverAnchorRect}
      onSave={handleAddPending}
      onCancel={handleCancelPending}
      placeholder={isMulti ? "Feedback for this group of elements..." : undefined}
    />
  {/if}
</div>
