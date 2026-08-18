<script lang="ts">
  import { onMount, tick } from "svelte";
  import PriorityButton from "../shared/PriorityButton.svelte";
  import type { AnnotationPriority } from "../../types";

  interface Props {
    elementName: string;
    selector: string;
    computedStyles: Record<string, string>;
    initialNote: string;
    initialPriority: AnnotationPriority;
    annotationIndex: number;
    anchorRect: DOMRect;
    onSave: (note: string, priority: AnnotationPriority) => void;
    onCancel: () => void;
    placeholder?: string;
  }
  let {
    elementName,
    initialNote,
    initialPriority,
    anchorRect,
    onSave,
    onCancel,
    placeholder,
  }: Props = $props();

  const popoverWidth = 280;
  const gap = 12;

  let note = $state(initialNote);
  let priority = $state<AnnotationPriority>(initialPriority);
  let isShaking = $state(false);
  let textareaRef: HTMLTextAreaElement | undefined;
  let popoverRef: HTMLDivElement | undefined;
  let shakeTimer: ReturnType<typeof setTimeout> | undefined;
  let position = $state<{ top?: number; bottom?: number; left: number }>({ left: 0 });
  let placement: "above" | "below" | null = $state(null);

  /** Exposed to the parent via bind:this — flashes the shake animation. */
  export function shake() {
    if (shakeTimer) clearTimeout(shakeTimer);
    isShaking = true;
    shakeTimer = setTimeout(() => {
      isShaking = false;
      textareaRef?.focus();
    }, 250);
  }

  function reposition() {
    const el = popoverRef;
    if (!el) return;
    const height = el.offsetHeight;

    if (placement === null) {
      placement = anchorRect.top - height - gap < 10 ? "below" : "above";
    }

    let left = anchorRect.left + anchorRect.width / 2 - popoverWidth / 2;
    if (left < 10) left = 10;
    if (left + popoverWidth > window.innerWidth - 10) {
      left = window.innerWidth - popoverWidth - 10;
    }

    if (placement === "below") {
      position = { top: anchorRect.bottom + gap, bottom: undefined, left };
    } else {
      position = { top: undefined, bottom: window.innerHeight - anchorRect.top + gap, left };
    }
  }

  onMount(() => {
    tick().then(reposition);
    const timer = setTimeout(() => textareaRef?.focus(), 50);
    return () => {
      clearTimeout(timer);
      if (shakeTimer) clearTimeout(shakeTimer);
    };
  });

  // Reposition if the anchor changes.
  $effect(() => {
    void anchorRect;
    reposition();
  });

  function handleSubmit() {
    if (note.trim()) onSave(note.trim(), priority);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const hasContent = $derived(note.trim().length > 0);
</script>

<div
  bind:this={popoverRef}
  class="rm-popover{isShaking ? ' rm-popover--shake' : ''}"
  data-remediate-widget=""
  data-placement={placement ?? undefined}
  style:top={position.top != null ? `${position.top}px` : undefined}
  style:bottom={position.bottom != null ? `${position.bottom}px` : undefined}
  style:left="{position.left}px"
  style:width="{popoverWidth}px"
  onclick={(e) => e.stopPropagation()}
  onkeydown={handleKeyDown}
  role="presentation"
>
  <div class="rm-popover__header">
    <span class="rm-popover__header-meta">{elementName}</span>
  </div>

  <div class="rm-input-group">
    <textarea
      bind:this={textareaRef}
      class="rm-input-group__textarea"
      placeholder={placeholder ?? "What should change?"}
      bind:value={note}
      maxlength={2000}
      rows={3}
    ></textarea>
    <div class="rm-input-group__footer">
      <PriorityButton {priority} onCycle={(p) => (priority = p)} />
    </div>
  </div>

  <div class="rm-popover__footer">
    <div class="rm-popover__actions">
      <button class="rm-popover__cancel" onclick={onCancel}>Cancel</button>
      <button
        class="rm-popover__submit"
        onclick={() => hasContent && onSave(note.trim(), priority)}
        disabled={!hasContent}
      >
        Add
      </button>
    </div>
  </div>
</div>
