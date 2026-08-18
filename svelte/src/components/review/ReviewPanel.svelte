<script lang="ts" module>
  import type { FeedbackItem } from "../../types";
  import { icons } from "../icons";

  function itemIconPath(type: FeedbackItem["type"]): string {
    switch (type) {
      case "photo": return icons.CameraFill;
      case "video": return icons.CamcorderFill;
      case "annotation": return icons.Cursor3Fill;
      case "textNote": return icons.Message4Fill;
      case "voiceNote": return icons.VoiceFill;
    }
  }

  function itemLabel(item: FeedbackItem): string {
    switch (item.type) {
      case "photo":
        return `${Math.round(item.area.width)} × ${Math.round(item.area.height)} at (${Math.round(item.area.x)}, ${Math.round(item.area.y)})`;
      case "video":
        return `${item.duration} seconds`;
      case "annotation":
        return item.element.name;
      case "textNote":
        return item.text;
      case "voiceNote":
        return `~${Math.ceil(item.duration / 60)} minute${Math.ceil(item.duration / 60) !== 1 ? "s" : ""}`;
    }
  }
</script>

<script lang="ts">
  import Icon from "../Icon.svelte";
  import PriorityIcon from "../shared/PriorityIcon.svelte";

  interface Props {
    items: FeedbackItem[];
    isSubmitting?: boolean;
    messages?: { submitButton: string; submittingButton: string; cancelButton: string };
    onRemoveItem: (id: string) => void;
    onPreviewItem: (id: string) => void;
    onBack: () => void;
    onSubmit: () => void;
  }
  let { items, isSubmitting, messages, onRemoveItem, onPreviewItem, onBack, onSubmit }: Props =
    $props();

  let listRef: HTMLDivElement | undefined;
  let scrollMask = $state({ top: false, bottom: false });

  function updateScrollMask() {
    const el = listRef;
    if (!el) return;
    scrollMask = {
      top: el.scrollTop > 0,
      bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 1,
    };
  }

  $effect(() => {
    void items.length;
    updateScrollMask();
  });
</script>

<div class="rm-review-panel" data-remediate-widget="">
  <div
    bind:this={listRef}
    class="rm-review-panel__list"
    onscroll={updateScrollMask}
    data-mask-top={scrollMask.top || undefined}
    data-mask-bottom={scrollMask.bottom || undefined}
  >
    {#each items as item, i (item.id)}
      <div class="rm-review-item" style="animation-delay: {i * 40}ms">
        <span class="rm-review-item__priority">
          {#if item.priority && item.priority !== "none"}
            <PriorityIcon priority={item.priority} />
          {:else}
            <span class="rm-review-item__no-priority">---</span>
          {/if}
        </span>
        <div class="rm-review-item__meta">
          <span class="rm-review-item__icon"><Icon d={itemIconPath(item.type)} size={16} /></span>
          <span class="rm-review-item__label">{itemLabel(item)}</span>
        </div>
        <div class="rm-review-item__actions">
          <button
            class="rm-review-item__action-btn"
            onclick={() => onPreviewItem(item.id)}
            aria-label={`Preview item ${item.index}`}
          >
            <Icon d={icons.EyeLine} size={16} />
          </button>
          <button
            class="rm-review-item__action-btn rm-review-item__action-btn--danger"
            onclick={() => onRemoveItem(item.id)}
            aria-label={`Remove item ${item.index}`}
          >
            <Icon d={icons.CloseLine} size={16} />
          </button>
        </div>
      </div>
    {/each}
  </div>

  <div class="rm-review-panel__footer">
    <span class="rm-review-panel__count">
      {items.length} item{items.length !== 1 ? "s" : ""}
    </span>
    <div class="rm-popover__actions">
      <button class="rm-popover__cancel" onclick={onBack}>
        {messages?.cancelButton ?? "Cancel"}
      </button>
      <button
        class="rm-popover__submit"
        onclick={onSubmit}
        disabled={items.length === 0 || isSubmitting}
      >
        {isSubmitting ? (messages?.submittingButton ?? "Sending…") : (messages?.submitButton ?? "Submit")}
      </button>
    </div>
  </div>
</div>
