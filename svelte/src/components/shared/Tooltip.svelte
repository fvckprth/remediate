<script lang="ts">
  import type { Snippet } from "svelte";
  import { portal } from "../../lib/actions";

  interface Props {
    content: string;
    children: Snippet;
    delay?: number;
    disabled?: boolean;
    /** Element whose top edge the tooltip sits above (with gap). */
    anchorEl?: HTMLElement | null;
  }
  let { content, children, delay = 500, disabled = false, anchorEl = null }: Props = $props();

  let visible = $state(false);
  let shouldRender = $state(false);
  let position = $state({ top: 0, left: 0 });
  let triggerRef: HTMLSpanElement;
  let enterTimer: ReturnType<typeof setTimeout> | null = null;
  let exitTimer: ReturnType<typeof setTimeout> | null = null;

  // When disabled flips to true, immediately hide.
  $effect(() => {
    if (disabled) {
      if (enterTimer) {
        clearTimeout(enterTimer);
        enterTimer = null;
      }
      visible = false;
      shouldRender = false;
    }
  });

  function updatePosition() {
    const el = triggerRef;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const anchorTop = anchorEl?.getBoundingClientRect().top ?? rect.top;
    position = { top: anchorTop - 6, left: rect.left + rect.width / 2 };
  }

  function handleMouseEnter() {
    if (disabled) return;
    if (exitTimer) {
      clearTimeout(exitTimer);
      exitTimer = null;
    }
    shouldRender = true;
    updatePosition();
    enterTimer = setTimeout(() => {
      visible = true;
    }, delay);
  }

  function handleMouseLeave() {
    if (enterTimer) {
      clearTimeout(enterTimer);
      enterTimer = null;
    }
    visible = false;
    exitTimer = setTimeout(() => {
      shouldRender = false;
    }, 150);
  }

  $effect(() => {
    return () => {
      if (enterTimer) clearTimeout(enterTimer);
      if (exitTimer) clearTimeout(exitTimer);
    };
  });
</script>

<span
  bind:this={triggerRef}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  style="display: inline-flex"
  role="presentation"
>
  {@render children()}
</span>

{#if shouldRender}
  <div
    use:portal
    class="rm-tooltip{visible ? ' rm-tooltip--visible' : ''}"
    data-remediate-widget=""
    style:top="{position.top}px"
    style:left="{position.left}px"
    style:transform="translateX(-50%) translateY(-100%){visible ? '' : ' translateY(4px)'}"
  >
    {content}
  </div>
{/if}
