<script lang="ts">
  import { onMount } from "svelte";
  import type { WidgetMode } from "../../types";
  import { isCaptureMode, isNoteMode } from "../../types";
  import { createDraggable } from "../../hooks/useDraggable.svelte";
  import Icon from "../Icon.svelte";
  import { icons } from "../icons";
  import Tooltip from "../shared/Tooltip.svelte";

  interface Props {
    isIdle: boolean;
    onActivate: () => void;
    mode: WidgetMode;
    markerColor: string;
    itemCount: number;
    hasContent: boolean;
    onSetMode: (mode: WidgetMode) => void;
    onClose: () => void;
    onReview: () => void;
    onDeleteAll: () => void;
    onAnchorAriaLabel?: (ariaLabel: string) => void;
    panelOpen?: boolean;
    /** The bar element, exposed to the parent for panel positioning. */
    barEl?: HTMLDivElement | null;
  }
  let {
    isIdle,
    onActivate,
    mode,
    markerColor,
    itemCount,
    hasContent,
    onSetMode,
    onClose,
    onReview,
    onDeleteAll,
    onAnchorAriaLabel,
    panelOpen,
    barEl = $bindable(null),
  }: Props = $props();

  const isSuccess = $derived(mode === "success");
  const isError = $derived(mode === "submitError");
  const captureActive = $derived(isCaptureMode(mode));
  const annotateActive = $derived(mode === "annotating");
  const noteActive = $derived(isNoteMode(mode));

  let tooltipsHidden = $state(false);
  const hideTooltips = () => (tooltipsHidden = true);
  const showTooltips = () => (tooltipsHidden = false);

  const drag = createDraggable({
    getEnabled: () => !panelOpen,
    getBar: () => barEl,
  });
  onMount(() => drag.init());

  let toolsRef: HTMLDivElement | undefined;
  const BAR_PADDING = 8;

  $effect(() => {
    // Track the inputs that drive bar sizing.
    void [isIdle, isSuccess, isError, hasContent, itemCount];
    const bar = barEl;
    if (!bar) return;
    if (isSuccess) {
      bar.style.width = "48px";
      bar.style.height = "40px";
      return;
    }
    if (isError) {
      bar.style.width = "172px";
      bar.style.height = "40px";
      return;
    }
    if (isIdle) {
      if (itemCount > 0) {
        bar.style.width = itemCount > 9 ? "48px" : "36px";
        bar.style.height = "36px";
      } else {
        bar.style.width = "";
        bar.style.height = "40px";
      }
      return;
    }
    const tools = toolsRef;
    if (!tools) return;
    const id = requestAnimationFrame(() => {
      const width = tools.scrollWidth + BAR_PADDING;
      bar.style.width = `${width}px`;
      bar.style.height = "40px";
    });
    return () => cancelAnimationFrame(id);
  });

  function guardClick(fn: () => void) {
    if (drag.justDragged.current) return;
    fn();
  }

  function reportAnchor(e: MouseEvent) {
    const label = (e.currentTarget as HTMLButtonElement).getAttribute("aria-label");
    if (label) onAnchorAriaLabel?.(label);
  }

  const positionStyle = $derived.by(() => {
    const p = drag.position;
    if (!p) return "";
    return p.r < p.x
      ? `right: ${p.r}px; top: ${p.y}px; left: auto; bottom: auto;`
      : `left: ${p.x}px; top: ${p.y}px; right: auto; bottom: auto;`;
  });
</script>

<div
  bind:this={barEl}
  class="rm-bar {!drag.position ? 'rm-pos-br' : ''} {isIdle ? '' : 'rm-bar--expanded'} {drag.isDragging ? 'rm-bar--dragging' : ''} {isIdle && itemCount > 0 ? 'rm-bar--count-only' : ''}"
  data-remediate-widget=""
  data-has-submenu={mode === "captureMenu" || mode === "noteMenu" || undefined}
  data-has-content={hasContent}
  data-success={isSuccess ? "" : undefined}
  data-error={isError ? "" : undefined}
  onmousedown={drag.handleMouseDown}
  role="toolbar"
  tabindex="-1"
  style="position: fixed; z-index: 999999; visibility: var(--rm-ready, hidden); {isIdle && itemCount > 0 ? `background: ${markerColor};` : ''} {positionStyle}"
>
  <button
    class="rm-bar__trigger {isIdle ? '' : 'rm-bar__trigger--hidden'} {isIdle && itemCount > 0 ? 'rm-bar__trigger--count' : ''}"
    onclick={() => guardClick(onActivate)}
    aria-label={itemCount > 0 ? `Open feedback widget, ${itemCount} items` : "Open feedback widget"}
  >
    <span class="rm-bar__count-text {isIdle && itemCount > 0 ? 'rm-bar__count-text--visible' : ''}">
      {itemCount > 0 ? itemCount : ""}
    </span>
    <div class="rm-bar__text-wrapper {isIdle && itemCount > 0 ? 'rm-bar__text-wrapper--hidden' : ''}">
      <span class="rm-bar__text">Feedback</span>
      {#if isIdle && itemCount > 0}
        <span class="rm-bar__badge">{itemCount}</span>
      {/if}
    </div>
  </button>

  {#if isSuccess}
    <div class="rm-bar__check"><Icon d={icons.CheckLine} size={24} /></div>
  {/if}

  {#if isError}
    <div class="rm-bar__error">
      <Icon d={icons.AlertDiamondFill} size={20} />
      <span class="rm-bar__error-text">Submission Failed</span>
    </div>
  {/if}

  <div
    bind:this={toolsRef}
    class="rm-bar__tools {!isIdle && !isSuccess && !isError ? 'rm-bar__tools--visible' : ''}"
    onmouseleave={showTooltips}
    role="group"
  >
    <div class="rm-toolbar__actions">
      <Tooltip content="Capture" disabled={tooltipsHidden} anchorEl={barEl}>
        <button
          class="rm-toolbar-btn {captureActive ? 'rm-toolbar-btn--active' : ''}"
          onclick={(e) =>
            guardClick(() => {
              hideTooltips();
              if (!captureActive) reportAnchor(e);
              onSetMode(captureActive ? "active" : "captureMenu");
            })}
          aria-label="Capture mode"
        >
          <Icon d={icons.ScanLine} size={20} />
        </button>
      </Tooltip>

      <Tooltip content="Annotate" disabled={tooltipsHidden} anchorEl={barEl}>
        <button
          class="rm-toolbar-btn {annotateActive ? 'rm-toolbar-btn--active' : ''}"
          onclick={() =>
            guardClick(() => {
              hideTooltips();
              onSetMode(annotateActive ? "active" : "annotating");
            })}
          aria-label="Annotate mode"
        >
          <Icon d={icons.Cursor3Fill} size={20} />
        </button>
      </Tooltip>

      <Tooltip content="Note" disabled={tooltipsHidden} anchorEl={barEl}>
        <button
          class="rm-toolbar-btn {noteActive ? 'rm-toolbar-btn--active' : ''}"
          onclick={(e) =>
            guardClick(() => {
              hideTooltips();
              if (!noteActive) reportAnchor(e);
              onSetMode(noteActive ? "active" : "noteMenu");
            })}
          aria-label="Note mode"
        >
          <Icon d={icons.PenFill} size={20} />
        </button>
      </Tooltip>
    </div>

    {#if hasContent}
      <div class="rm-toolbar-divider"></div>
      <div class="rm-toolbar__actions">
        <Tooltip content="Delete all" disabled={tooltipsHidden} anchorEl={barEl}>
          <button
            class="rm-toolbar-btn"
            onclick={() =>
              guardClick(() => {
                hideTooltips();
                onDeleteAll();
              })}
            aria-label="Delete all items"
          >
            <Icon d={icons.Delete2Fill} size={20} />
          </button>
        </Tooltip>
        <Tooltip content="Review" disabled={tooltipsHidden} anchorEl={barEl}>
          <button
            class="rm-toolbar-btn rm-toolbar-btn--review"
            onclick={(e) =>
              guardClick(() => {
                hideTooltips();
                reportAnchor(e);
                onReview();
              })}
            aria-label="Review and submit"
          >
            <Icon d={icons.SendFill} size={20} />
            <span class="rm-toolbar-btn__badge" style:background={markerColor}>{itemCount}</span>
          </button>
        </Tooltip>
      </div>
    {/if}

    <div class="rm-toolbar-divider"></div>

    <Tooltip content="Close" disabled={tooltipsHidden} anchorEl={barEl}>
      <button
        class="rm-toolbar-btn rm-toolbar-btn--close"
        onclick={() =>
          guardClick(() => {
            hideTooltips();
            onClose();
          })}
        aria-label="Close widget"
      >
        <Icon d={icons.CloseLine} size={20} />
      </button>
    </Tooltip>
  </div>
</div>
