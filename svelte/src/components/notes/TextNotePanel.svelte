<script lang="ts">
  import { onMount } from "svelte";
  import PriorityButton from "../shared/PriorityButton.svelte";
  import Icon from "../Icon.svelte";
  import { icons } from "../icons";
  import type { AnnotationPriority, TextNoteItem } from "../../types";
  import { getWidgetStore } from "../../state/widget-store.svelte";

  interface Props {
    onAdd: (text: string, priority: AnnotationPriority) => void;
    onCancel: () => void;
    onDelete?: () => void;
  }
  let { onAdd, onCancel, onDelete }: Props = $props();

  const store = getWidgetStore();
  const preview = store.preview<TextNoteItem>("textNote");
  const submitLabel = store.state.previewingItemId ? "Save" : "Add";

  let text = $state(preview?.text ?? "");
  let priority = $state<AnnotationPriority>(preview?.priority ?? "none");
  let textareaRef: HTMLTextAreaElement | undefined;

  onMount(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        textareaRef?.focus();
      });
    });
  });

  function handleSubmit() {
    if (!text.trim()) return;
    onAdd(text.trim(), priority);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }
</script>

<div class="rm-text-panel" data-remediate-widget="">
  <p class="rm-text-panel__title">Text</p>

  <div class="rm-input-group">
    <textarea
      bind:this={textareaRef}
      class="rm-input-group__textarea"
      placeholder="What's on your mind?"
      bind:value={text}
      rows={3}
      onkeydown={handleKeyDown}
    ></textarea>
    <div class="rm-input-group__footer">
      <PriorityButton {priority} onCycle={(p) => (priority = p)} />
    </div>
  </div>

  <div class="rm-text-panel__footer">
    {#if onDelete}
      <button class="rm-text-panel__delete" onclick={onDelete} aria-label="Delete">
        <Icon d={icons.Delete2Fill} size={20} />
      </button>
    {/if}
    <div class="rm-text-panel__actions">
      <button class="rm-text-panel__cancel" onclick={onCancel}>Cancel</button>
      <button
        class="rm-text-panel__submit"
        style:opacity={text.trim() ? 1 : 0.4}
        onclick={handleSubmit}
        disabled={!text.trim()}
      >
        {submitLabel}
      </button>
    </div>
  </div>
</div>
